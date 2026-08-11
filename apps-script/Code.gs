/**
 * 들리 사전신청 폼 백엔드 — Google Sheet 적재 + 메일 알림.
 *
 * 배포: 배포 → 새 배포 → 웹 앱 / 실행 계정: 나 / 액세스 권한: 모든 사용자
 * 수정 후에는 반드시 "새 버전"으로 재배포해야 반영된다. URL은 유지된다.
 *
 * 들리 폼만 받는다. `form`이 "deulli"가 아닌 요청은 거절한다 — 같은 웹 앱 URL을
 * 쓰던 dionomy 폼이 여기로 들어와 신청자 번호가 들리 명단에 섞이면, 들리와
 * 무관한 사람에게 출시 문자가 나간다.
 */

// 알림 받을 이메일 (비워 두면 메일 발송 생략)
const NOTIFY_EMAIL = "contact@nangmans.com";

const TAB = "deulli";
const HEADERS = ["접수시각", "전화번호", "동의", "유입경로", "랜딩 URL"];
const PHONE_COL = 2; // 중복 검사할 열 (1-based) — B열 전화번호

function doPost(e) {
  const lock = LockService.getScriptLock();
  // 동시 제출이 같은 행에 겹쳐 쓰이는 것을 막는다
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ ok: false, error: "busy" });
  }

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.form !== "deulli") {
      return json({ ok: false, error: "unknown_form" });
    }

    const digits = normalizePhone(data.phone);
    if (!digits) {
      return json({ ok: false, error: "invalid_phone" });
    }

    const sheet = getSheet();

    // 이미 있는 번호면 행을 늘리지 않는다
    if (hasPhone(sheet, digits)) {
      return json({ ok: true, duplicate: true });
    }

    const row = [
      new Date(),
      // 하이픈을 넣어 둔다 — 숫자만 넣으면 시트가 수로 해석해 앞의 0을 날린다
      formatPhone(data.phone),
      data.consent ? "동의" : "",
      data.referrer || "직접 유입",
      data.landing || "",
    ];
    sheet.appendRow(row);
    notify(row);

    return json({ ok: true, duplicate: false });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// GET 으로 배포 상태 확인용
function doGet() {
  return json({ ok: true, msg: "deulli form endpoint alive" });
}

/** deulli 탭을 찾고, 없으면 헤더까지 넣어 만든다 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TAB);
  if (sheet) return sheet;

  // 기존 탭들 뒤에 붙인다
  sheet = ss.insertSheet(TAB, ss.getNumSheets());
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  // 전화번호 열 서식을 텍스트로 고정한다(시트의 자동 수 변환 방지)
  sheet
    .getRange(2, PHONE_COL, sheet.getMaxRows() - 1, 1)
    .setNumberFormat("@");
  return sheet;
}

/** 이미 등록된 번호인지 (하이픈 유무와 무관하게 비교) */
function hasPhone(sheet, digits) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const values = sheet.getRange(2, PHONE_COL, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).replace(/\D/g, "") === digits) return true;
  }
  return false;
}

/** 숫자만 남기고 휴대폰 형식이면 반환, 아니면 빈 문자열 */
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : "";
}

/** 010-1234-5678 형태로 */
function formatPhone(raw) {
  const d = normalizePhone(raw);
  if (!d) return String(raw || "");
  return d.length === 11
    ? d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7)
    : d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
}

function notify(row) {
  if (!NOTIFY_EMAIL) return;
  const lines = HEADERS.map(function (header, i) {
    return header + ": " + row[i];
  });
  MailApp.sendEmail(NOTIFY_EMAIL, "[들리] 새 사전신청", lines.join("\n"));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
