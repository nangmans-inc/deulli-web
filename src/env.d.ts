/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** GA4 측정 ID (예: G-XXXXXXXXXX). 비워두면 GA 미로드. */
  readonly PUBLIC_GA_ID?: string;
  /** 사전신청 폼 백엔드 — Apps Script 웹 앱 URL. 비워두면 폼 제출 비활성(콘솔 스텁). */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
