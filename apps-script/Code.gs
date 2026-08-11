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

// 디스코드 웹훅 URL (비워 두면 발송 생략).
// 저장소가 public이라 여기에는 넣지 않는다 — Apps Script 편집기에서만 채운다.
// URL을 아는 사람은 누구나 채널에 글을 쓸 수 있으므로 사실상 비밀값이다.
const DISCORD_WEBHOOK = "";

// 디스코드로 전화번호를 통째로 보낼지. 기본은 가림(010-****-5678).
// 켜기 전에 개인정보 처리방침을 먼저 고쳐야 한다 — 아래 maskPhone 주석 참고.
const DISCORD_SEND_FULL_PHONE = false;

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
    // 알림은 적재 뒤에. 알림이 실패해도 신청은 이미 저장돼 있어야 한다.
    notify(row, sheet.getLastRow() - 1);

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

/**
 * 010-1234-5678 → 010-****-5678
 *
 * 디스코드는 해외 서비스라 번호를 그대로 보내면 개인정보 국외 이전에 해당한다.
 * 지금 동의문에는 그런 내용이 없고 처리방침에도 이전 대상이 적혀 있지 않다.
 * 알림의 목적은 "새 신청이 들어왔다"를 아는 것이지 번호를 옮기는 게 아니므로,
 * 번호는 시트에만 두고 디스코드에는 가려서 보낸다.
 */
function maskPhone(formatted) {
  const parts = String(formatted || "").split("-");
  if (parts.length !== 3) return "***";
  return parts[0] + "-****-" + parts[2];
}

function notify(row, total) {
  const phone = DISCORD_SEND_FULL_PHONE ? row[1] : maskPhone(row[1]);
  notifyMail(row);
  notifyDiscord(phone, row, total);
}

function notifyMail(row) {
  if (!NOTIFY_EMAIL) return;
  try {
    const lines = HEADERS.map(function (header, i) {
      return header + ": " + row[i];
    });
    MailApp.sendEmail(NOTIFY_EMAIL, "[들리] 새 사전신청", lines.join("\n"));
  } catch (err) {
    // 알림 실패가 신청 접수를 되돌리게 두지 않는다
    console.error("메일 발송 실패: " + err);
  }
}

function notifyDiscord(phone, row, total) {
  if (!DISCORD_WEBHOOK) return;
  const payload = {
    username: "들리 사전신청",
    embeds: [
      {
        title: "새 사전신청 " + (total ? "· 누적 " + total + "명" : ""),
        color: 0x0150e5,
        fields: [
          { name: "전화번호", value: phone, inline: true },
          { name: "유입경로", value: String(row[3] || "-"), inline: true },
        ],
        footer: { text: "deulli.com" },
      },
    ],
  };
  try {
    const res = UrlFetchApp.fetch(DISCORD_WEBHOOK, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true, // 4xx·5xx에 예외를 던지지 않게
    });
    const code = res.getResponseCode();
    if (code >= 300) {
      console.error("디스코드 응답 " + code + ": " + res.getContentText());
    }
  } catch (err) {
    console.error("디스코드 발송 실패: " + err);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
