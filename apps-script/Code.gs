/**
 * 랜딩 폼 백엔드 — Google Sheet 적재 + 메일 알림.
 *
 * payload의 `form` 값으로 탭을 고른다. 여러 랜딩이 웹 앱 하나를 공유할 수 있고,
 * `form`이 없는 기존 요청(dionomy 폼)은 default 규칙으로 떨어져 그대로 동작한다.
 *
 * 배포: 배포 → 새 배포 → 웹 앱 / 실행 계정: 나 / 액세스 권한: 모든 사용자
 * 수정 후에는 반드시 "새 버전"으로 재배포해야 반영된다. URL은 유지된다.
 */

// 알림 받을 이메일 (비워 두면 메일 발송 생략)
const NOTIFY_EMAIL = "contact@nangmans.com";

// form 값 → 탭 이름·헤더·필드 매핑
const SHEETS = {
  deulli: {
    tab: "deulli",
    subject: "[들리] 새 사전신청",
    headers: ["접수시각", "전화번호", "동의", "유입경로", "랜딩 URL"],
    // 전화번호는 중복 검사 대상이라 컬럼 위치를 따로 잡아 둔다(1-based)
    dedupeColumn: 2,
    row: function (d) {
      return [
        new Date(),
        // 하이픈을 넣어 둔다 — 숫자만 넣으면 시트가 수로 해석해 앞의 0을 날린다
        formatPhone(d.phone),
        d.consent ? "동의" : "",
        d.referrer || "직접 유입",
        d.landing || "",
      ];
    },
  },

  // form 값이 없는 기존 dionomy 폼. 첫 번째 탭에 그대로 쌓는다.
  default: {
    tab: null, // null이면 "관리 대상이 아닌 첫 번째 시트"
    subject: "[Dionomy] 새 얼리어답터 신청",
    headers: [
      "접수시각",
      "이름",
      "스튜디오",
      "연락처",
      "카테고리",
      "기타카테고리",
      "동의",
    ],
    dedupeColumn: 0, // 0이면 중복 검사 안 함
    row: function (d) {
      return [
        new Date(),
        d.name || "",
        d.studio || "",
        d.phone || "",
        d.category || "",
        d.categoryOther || "",
        d.consent ? "동의" : "",
      ];
    },
  },
};

// 이 스크립트가 이름으로 만들고 관리하는 탭. default 폼이 여기에 잘못 쓰지 않도록
// 아래 getSheet()에서 제외 대상으로 쓴다.
const MANAGED_TABS = Object.keys(SHEETS)
  .map(function (k) {
    return SHEETS[k].tab;
  })
  .filter(function (t) {
    return !!t;
  });

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
    const config = SHEETS[data.form] || SHEETS.default;
    const sheet = getSheet(config);

    // 중복 방지 — 이미 있는 번호면 행을 늘리지 않는다
    if (config.dedupeColumn) {
      const key = normalizePhone(data.phone);
      if (key && hasValue(sheet, config.dedupeColumn, key)) {
        return json({ ok: true, duplicate: true });
      }
      if (!key) {
        return json({ ok: false, error: "invalid_phone" });
      }
    }

    sheet.appendRow(config.row(data));
    notify(config, data);

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

/** 탭을 찾고, 없으면 헤더까지 넣어 만든다 */
function getSheet(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // tab이 없는 폼(기존 dionomy)은 "관리 대상이 아닌 첫 시트"에 쓴다.
  // 그냥 getSheets()[0]으로 두면, deulli 탭이 앞쪽에 꽂히는 순간 dionomy 신청이
  // deulli 탭에 쌓인다. 조용히 섞이는 사고라 인덱스로 고르면 안 된다.
  if (!config.tab) {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      if (MANAGED_TABS.indexOf(sheets[i].getName()) === -1) return sheets[i];
    }
    return sheets[0];
  }

  let sheet = ss.getSheetByName(config.tab);
  if (!sheet) {
    // 항상 맨 끝에 만든다 — 앞에 꽂히면 위의 방어가 없을 때 순서가 뒤집힌다
    sheet = ss.insertSheet(config.tab, ss.getNumSheets());
    sheet.appendRow(config.headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, config.headers.length).setFontWeight("bold");
    // 전화번호 열은 서식을 텍스트로 고정한다(시트의 자동 수 변환 방지)
    if (config.dedupeColumn) {
      sheet
        .getRange(2, config.dedupeColumn, sheet.getMaxRows() - 1, 1)
        .setNumberFormat("@");
    }
  }
  return sheet;
}

/** 해당 컬럼에 값이 이미 있는지 */
function hasValue(sheet, column, value) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const values = sheet.getRange(2, column, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).replace(/\D/g, "") === value) return true;
  }
  return false;
}

/** 숫자만 남기고 휴대폰 형식이면 반환, 아니면 빈 문자열 */
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : "";
}

/** 010-1234-5678 형태로. 형식이 아니면 원본을 그대로 둔다 */
function formatPhone(raw) {
  const d = normalizePhone(raw);
  if (!d) return String(raw || "");
  return d.length === 11
    ? d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7)
    : d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
}

function notify(config, data) {
  if (!NOTIFY_EMAIL) return;
  const row = config.row(data);
  const lines = config.headers.map(function (header, i) {
    return header + ": " + row[i];
  });
  MailApp.sendEmail(NOTIFY_EMAIL, config.subject, lines.join("\n"));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
