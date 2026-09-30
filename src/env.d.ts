/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** GA4 측정 ID (예: G-XXXXXXXXXX). 비워두면 GA 미로드. */
  readonly PUBLIC_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
