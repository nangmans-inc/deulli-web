/**
 * Code.gs 동작 검증.
 *
 * Apps Script 런타임(SpreadsheetApp·MailApp·LockService·ContentService)을 흉내 내고
 * doPost를 실제로 돌려 본다. 구글에 배포하기 전에 확인하는 용도라 구글 계정이 필요 없다.
 *
 *   pnpm test:gs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ── Apps Script 런타임 흉내 ──────────────────────────────
function makeEnv(initialSheets, opts = {}) {
  const mails = [];
  const posts = [];
  const errors = [];
  const sheets = initialSheets.map((name) => ({ name, rows: [] }));
  const api = (o) => ({
    getName: () => o.name,
    appendRow: (r) => o.rows.push(r),
    getLastRow: () => o.rows.length,
    getMaxRows: () => 1000,
    setFrozenRows: () => {},
    getRange: (row, col, numRows) => ({
      setFontWeight: () => {},
      setNumberFormat: () => {},
      getValues: () =>
        o.rows.slice(row - 1, row - 1 + numRows).map((r) => [r[col - 1]]),
    }),
  });
  const ss = {
    getSheets: () => sheets.map(api),
    getSheetByName: (n) => {
      const o = sheets.find((s) => s.name === n);
      return o ? api(o) : null;
    },
    getNumSheets: () => sheets.length,
    insertSheet: (n, idx) => {
      const o = { name: n, rows: [] };
      sheets.splice(idx ?? sheets.length, 0, o);
      return api(o);
    },
  };
  return {
    sheets,
    mails,
    posts,
    errors,
    globals: {
      SpreadsheetApp: { getActiveSpreadsheet: () => ss },
      MailApp: {
        sendEmail: (to, subject, body) => mails.push({ to, subject, body }),
      },
      LockService: {
        getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
      },
      UrlFetchApp: {
        fetch: (url, params) => {
          if (opts.fetchThrows) throw new Error("network down");
          posts.push({ url, body: JSON.parse(params.payload) });
          return {
            getResponseCode: () => opts.fetchStatus ?? 204,
            getContentText: () => opts.fetchBody ?? "",
          };
        },
      },
      console: { error: (m) => errors.push(String(m)), log: () => {} },
      PropertiesService: (() => {
        const store = {};
        return {
          getScriptProperties: () => ({
            setProperty: (k, v) => (store[k] = v),
            getProperty: (k) => store[k] ?? null,
          }),
        };
      })(),
      ContentService: {
        MimeType: { JSON: "json" },
        createTextOutput: (t) => ({ setMimeType: () => t }),
      },
    },
  };
}

const rawSrc = readFileSync(join(root, "apps-script", "Code.gs"), "utf8");
/** 저장소의 Code.gs는 웹훅 URL이 비어 있다(public 저장소라 비밀값을 넣지 않는다).
 *  테스트에서는 채운 상태를 흉내 낸다. */
function load(env, { webhook = "", fullPhone = false } = {}) {
  let src = rawSrc.replace(
    'const DISCORD_WEBHOOK = "";',
    "const DISCORD_WEBHOOK = " + JSON.stringify(webhook) + ";",
  );
  // 저장소의 기본값이 무엇이든 테스트가 원하는 값으로 강제한다
  src = src.replace(
    /const DISCORD_SEND_FULL_PHONE = (?:true|false);/,
    "const DISCORD_SEND_FULL_PHONE = " + String(fullPhone) + ";",
  );
  const keys = Object.keys(env.globals);
  const fn = new Function(...keys, src + "\nreturn { doPost, doGet };");
  return fn(...keys.map((k) => env.globals[k]));
}
const HOOK = "https://discord.test/api/webhooks/1/abc";
const post = (a, o) =>
  JSON.parse(a.doPost({ postData: { contents: JSON.stringify(o) } }));

const deulli = {
  form: "deulli",
  phone: "010-1234-5678",
  consent: true,
  referrer: "",
  landing: "https://deulli.com/",
};
const dionomy = {
  name: "홍길동",
  studio: "스튜디오 디오",
  phone: "010-1111-2222",
  category: "댄스",
  consent: true,
};

let pass = 0;
let fail = 0;
const check = (label, cond, detail = "") =>
  cond
    ? (pass++, console.log("  PASS  " + label))
    : (fail++,
      console.log("  FAIL  " + label + (detail ? " — " + detail : "")));

console.log("1) 신청 1건 — 탭 생성과 컬럼 배치");
{
  const env = makeEnv(["얼리어답터"]);
  const r = post(load(env), deulli);
  const d = env.sheets.find((s) => s.name === "deulli");
  check("응답 ok, 중복 아님", r.ok === true && r.duplicate === false);
  check(
    "deulli 탭이 맨 끝에 생성",
    env.sheets[env.sheets.length - 1].name === "deulli",
  );
  check("기존 탭은 그대로", env.sheets[0].rows.length === 0);
  check("헤더 + 데이터 1행", d.rows.length === 2);
  check(
    "A열 접수시각",
    d.rows[0][0] === "접수시각" && d.rows[1][0] instanceof Date,
  );
  check("B열 전화번호(하이픈)", d.rows[1][1] === "010-1234-5678", d.rows[1][1]);
  check("C열 동의", d.rows[1][2] === "동의");
  check("D열 유입경로", d.rows[1][3] === "직접 유입");
  check("E열 랜딩 URL", d.rows[1][4] === "https://deulli.com/");
  check(
    "빈 칸 없음(A~E 연속)",
    d.rows[1].length === 5 && d.rows[1].every((v) => v !== ""),
  );
  check(
    "메일 발송",
    env.mails.length === 1 && env.mails[0].subject === "[들리] 새 사전신청",
  );
}

console.log("2) 중복 번호");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  post(api, deulli);
  const dup = post(api, { ...deulli, phone: "01012345678" }); // 하이픈만 다름
  const d = env.sheets.find((s) => s.name === "deulli");
  check("duplicate로 응답", dup.ok === true && dup.duplicate === true);
  check("행이 늘지 않음", d.rows.length === 2);
  check("중복은 메일도 안 감", env.mails.length === 1);
}

console.log("3) 잘못된 번호");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  const cases = [
    ["유선번호", "02-123-4567"],
    ["자릿수 부족", "010-123-456"],
    ["빈 값", ""],
    ["문자열", "없음"],
  ];
  for (const [label, phone] of cases) {
    const r = post(api, { ...deulli, phone });
    check(
      label + " 거절",
      r.ok === false && r.error === "invalid_phone",
      JSON.stringify(r),
    );
  }
  check(
    "시트에 아무것도 안 쌓임",
    !env.sheets.find((s) => s.name === "deulli"),
  );
}

console.log("4) ★ 들리가 아닌 폼은 거절 — 신청자 번호가 섞이면 안 된다");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  const r = post(api, dionomy);
  check(
    "unknown_form으로 거절",
    r.ok === false && r.error === "unknown_form",
    JSON.stringify(r),
  );
  check(
    "deulli 탭 생성조차 안 됨",
    !env.sheets.find((s) => s.name === "deulli"),
  );
  check("기존 탭도 안 건드림", env.sheets[0].rows.length === 0);
  check("메일 안 감", env.mails.length === 0);
}

console.log("5) 기존 deulli 탭이 있으면 재사용");
{
  const env = makeEnv(["얼리어답터", "deulli"]);
  env.sheets[1].rows.push([
    "접수시각",
    "전화번호",
    "동의",
    "유입경로",
    "랜딩 URL",
  ]);
  post(load(env), deulli);
  check("탭을 새로 만들지 않음", env.sheets.length === 2);
  check("기존 탭에 이어 씀", env.sheets[1].rows.length === 2);
}

console.log("7) 디스코드 웹훅");
{
  const env = makeEnv(["얼리어답터"]);
  post(load(env, { webhook: HOOK, fullPhone: false }), deulli);
  check("웹훅 1회 호출", env.posts.length === 1);
  const b = env.posts[0]?.body;
  check("URL 정확", env.posts[0]?.url === HOOK);
  check(
    "전화번호 가림",
    b?.embeds[0].fields[0].value === "010-****-5678",
    b?.embeds[0].fields[0].value,
  );
  check("원본 번호가 payload에 없음", !JSON.stringify(b).includes("1234-5678"));
  check(
    "누적 인원 표기",
    /누적 1명/.test(b?.embeds[0].title),
    b?.embeds[0].title,
  );
}
{
  const env = makeEnv(["얼리어답터"]);
  post(load(env, { webhook: HOOK, fullPhone: true }), deulli);
  check(
    "옵션 켜면 원본 번호 전송",
    env.posts[0].body.embeds[0].fields[0].value === "010-1234-5678",
  );
}
{
  // 저장소에 커밋된 기본값 자체를 확인한다 — 개인정보가 나가는 설정이라
  // 의도치 않게 바뀌면 알아야 한다
  const m = rawSrc.match(/const DISCORD_SEND_FULL_PHONE = (true|false);/);
  check("저장소 기본값이 true(원본 전송)", m?.[1] === "true", m?.[1]);
}
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env, { webhook: HOOK });
  post(api, deulli);
  const dup = post(api, deulli);
  check(
    "중복 신청은 웹훅 안 쏨",
    env.posts.length === 1 && dup.duplicate === true,
  );
  const bad = post(api, { ...deulli, phone: "02-1234-5678" });
  check("거절된 신청도 웹훅 안 쏨", env.posts.length === 1 && bad.ok === false);
}
{
  const env = makeEnv(["얼리어답터"]);
  check(
    "웹훅 URL이 비면 호출 안 함",
    (post(load(env), deulli), env.posts.length === 0),
  );
}

console.log("8) ★ 알림이 실패해도 신청은 저장된다");
{
  const env = makeEnv(["얼리어답터"], { fetchThrows: true });
  const r = post(load(env, { webhook: HOOK }), deulli);
  const d = env.sheets.find((s) => s.name === "deulli");
  check(
    "응답은 여전히 ok",
    r.ok === true && r.duplicate === false,
    JSON.stringify(r),
  );
  check("행은 저장됨", d.rows.length === 2);
  check(
    "에러는 로그로만",
    env.errors.some((e) => /디스코드 발송 실패/.test(e)),
  );
}
{
  const env = makeEnv(["얼리어답터"], {
    fetchStatus: 404,
    fetchBody: "unknown webhook",
  });
  const r = post(load(env, { webhook: HOOK }), deulli);
  check("웹훅 404여도 신청은 ok", r.ok === true);
  check(
    "응답 코드를 로그에 남김",
    env.errors.some((e) => /디스코드 응답 404/.test(e)),
  );
}

console.log("9) 마지막 웹훅 결과가 doGet에 남는가");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env, { webhook: HOOK });
  post(api, deulli);
  const g = JSON.parse(api.doGet());
  check("성공 → ok 204", /ok 204/.test(g.lastDiscord), g.lastDiscord);
}
{
  const env = makeEnv(["얼리어답터"], { fetchThrows: true });
  const api = load(env, { webhook: HOOK });
  post(api, deulli);
  const g = JSON.parse(api.doGet());
  check(
    "예외 → throw …",
    /throw .*network down/.test(g.lastDiscord),
    g.lastDiscord,
  );
}
{
  const env = makeEnv(["얼리어답터"], {
    fetchStatus: 400,
    fetchBody: '{"message":"bad"}',
  });
  const api = load(env, { webhook: HOOK });
  post(api, deulli);
  const g = JSON.parse(api.doGet());
  check("HTTP 오류 → http 400", /http 400/.test(g.lastDiscord), g.lastDiscord);
}
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  post(api, deulli);
  const g = JSON.parse(api.doGet());
  check("웹훅 미설정 → skipped", /skipped/.test(g.lastDiscord), g.lastDiscord);
}

console.log("6) doGet 헬스체크");
{
  const r = JSON.parse(load(makeEnv(["얼리어답터"])).doGet());
  check(
    "배포 버전 식별 문자열",
    r.ok === true && r.msg === "deulli form endpoint alive",
    r.msg,
  );
  check(
    "version 노출",
    typeof r.version === "string" && r.version.length > 0,
    r.version,
  );
  check(
    "웹훅 미설정이면 discord=false",
    r.discord === false,
    String(r.discord),
  );
}
{
  const r = JSON.parse(
    load(makeEnv(["얼리어답터"]), { webhook: HOOK }).doGet(),
  );
  check("웹훅 설정되면 discord=true", r.discord === true);
  check("URL 자체는 응답에 없음", !JSON.stringify(r).includes("discord.test"));
}
{
  const on = JSON.parse(
    load(makeEnv(["얼리어답터"]), { webhook: HOOK, fullPhone: true }).doGet(),
  );
  const off = JSON.parse(
    load(makeEnv(["얼리어답터"]), { webhook: HOOK, fullPhone: false }).doGet(),
  );
  check(
    "fullPhone 설정이 응답에 드러남",
    on.fullPhone === true && off.fullPhone === false,
    String(on.fullPhone) + "/" + String(off.fullPhone),
  );
}

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
