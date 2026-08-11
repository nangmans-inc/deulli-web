/**
 * Code.gs 동작 검증.
 *
 * Apps Script 런타임(SpreadsheetApp·MailApp·LockService·ContentService)을 흉내 내고
 * doPost를 실제로 돌려 본다. 구글에 배포하기 전에 라우팅이 맞는지 확인하는 용도다.
 * 특히 4번 — deulli 탭이 시트 앞쪽에 놓여도 기존 dionomy 신청이 거기 섞이지 않는지.
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
  const mkSheet = (o) => ({
    _o: o,
    getName: () => o.name,
    appendRow: (r) => o.rows.push(r),
    getLastRow: () => o.rows.length + (o.hasHeader ? 0 : 0),
    setFrozenRows: () => {},
    getMaxRows: () => 1000,
    getRange: (r, c, nr, nc) => ({
      setFontWeight: () => {},
      setNumberFormat: () => {},
      getValues: () =>
        o.rows.slice(r - 2 + 1 - 1 + (r - 1) - (r - 1)).map(() => []),
    }),
  });
  // getRange(2, col, n, 1).getValues() 는 dedupe용 — 실제 열 값을 돌려주게 따로 구현
  const sheetApi = (o) => {
    const s = mkSheet(o);
    s.getRange = (row, col, numRows) => ({
      setFontWeight: () => {},
      setNumberFormat: () => {},
      getValues: () =>
        o.rows.slice(row - 1, row - 1 + numRows).map((r) => [r[col - 1]]),
    });
    s.getLastRow = () => o.rows.length;
    return s;
  };
  const ss = {
    getSheets: () => sheets.map(sheetApi),
    getSheetByName: (n) => {
      const o = sheets.find((s) => s.name === n);
      return o ? sheetApi(o) : null;
    },
    getNumSheets: () => sheets.length,
    insertSheet: (n, idx) => {
      const o = { name: n, rows: [] };
      sheets.splice(idx ?? sheets.length, 0, o);
      return sheetApi(o);
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
const post = (api, obj) =>
  JSON.parse(api.doPost({ postData: { contents: JSON.stringify(obj) } }));

const dionomy = {
  name: "홍길동",
  studio: "스튜디오 디오",
  phone: "010-1111-2222",
  category: "댄스",
  consent: true,
};
const deulli = {
  form: "deulli",
  phone: "010-1234-5678",
  consent: true,
  referrer: "",
  landing: "https://deulli.com/",
};

let pass = 0,
  fail = 0;
const check = (label, cond, detail = "") => {
  cond
    ? (pass++, console.log("  PASS  " + label))
    : (fail++,
      console.log("  FAIL  " + label + (detail ? " — " + detail : "")));
};

console.log("1) 기존 dionomy 폼만 있는 시트");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  const r = post(api, dionomy);
  check("응답 ok", r.ok === true);
  check("첫 시트에 1행 추가", env.sheets[0].rows.length === 1);
  check(
    "컬럼 순서 유지(이름/스튜디오/연락처)",
    env.sheets[0].rows[0][1] === "홍길동" &&
      env.sheets[0].rows[0][3] === "010-1111-2222",
  );
  check(
    "메일 제목 그대로",
    env.mails[0].subject === "[Dionomy] 새 얼리어답터 신청",
    env.mails[0]?.subject,
  );
}

console.log("2) 들리 폼 — 탭 자동 생성 + 맨 끝에");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  const r = post(api, deulli);
  check("응답 ok, 중복 아님", r.ok === true && r.duplicate === false);
  check(
    "deulli 탭 생성",
    env.sheets.some((s) => s.name === "deulli"),
  );
  check("맨 끝에 생성", env.sheets[env.sheets.length - 1].name === "deulli");
  const d = env.sheets.find((s) => s.name === "deulli");
  check(
    "헤더 + 데이터 1행",
    d.rows.length === 2 && d.rows[0][1] === "전화번호",
  );
  check("전화번호 하이픈 포맷", d.rows[1][1] === "010-1234-5678", d.rows[1][1]);
  check(
    "메일 제목",
    env.mails[0].subject === "[들리] 새 사전신청",
    env.mails[0]?.subject,
  );
}

console.log("3) 중복 번호 / 잘못된 번호");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  post(api, deulli);
  const dup = post(api, { ...deulli, phone: "01012345678" }); // 하이픈만 다름
  check(
    "같은 번호 재제출 → duplicate",
    dup.ok === true && dup.duplicate === true,
  );
  const d = env.sheets.find((s) => s.name === "deulli");
  check("행이 늘지 않음", d.rows.length === 2);
  const bad = post(api, { ...deulli, phone: "02-123-4567" });
  check(
    "유선번호 거절",
    bad.ok === false && bad.error === "invalid_phone",
    JSON.stringify(bad),
  );
}

console.log("4) ★ deulli 탭이 맨 앞에 있어도 dionomy가 안 섞이는가");
{
  const env = makeEnv(["deulli", "얼리어답터"]); // 일부러 앞에 배치
  const api = load(env);
  post(api, dionomy);
  const first = env.sheets[0],
    legacy = env.sheets[1];
  check("deulli 탭은 그대로 비어 있음", first.rows.length === 0);
  check(
    "dionomy는 기존 탭에 기록",
    legacy.rows.length === 1 && legacy.rows[0][1] === "홍길동",
  );
}

console.log("5) doGet 헬스체크");
{
  const env = makeEnv(["얼리어답터"]);
  const api = load(env);
  const r = JSON.parse(api.doGet());
  check("ok", r.ok === true);
}

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
