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
function makeEnv(initialSheets) {
  const mails = [];
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
    globals: {
      SpreadsheetApp: { getActiveSpreadsheet: () => ss },
      MailApp: {
        sendEmail: (to, subject, body) => mails.push({ to, subject, body }),
      },
      LockService: {
        getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
      },
      ContentService: {
        MimeType: { JSON: "json" },
        createTextOutput: (t) => ({ setMimeType: () => t }),
      },
    },
  };
}

const src = readFileSync(join(root, "apps-script", "Code.gs"), "utf8");
function load(env) {
  const keys = Object.keys(env.globals);
  const fn = new Function(...keys, src + "\nreturn { doPost, doGet };");
  return fn(...keys.map((k) => env.globals[k]));
}
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

console.log("6) doGet 헬스체크");
{
  const r = JSON.parse(load(makeEnv(["얼리어답터"])).doGet());
  check(
    "배포 버전 식별 문자열",
    r.ok === true && r.msg === "deulli form endpoint alive",
    r.msg,
  );
}

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
