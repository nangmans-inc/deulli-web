// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    // 빌드 산출물·생성물·Astro 자동생성 타입은 린트 대상에서 제외
    ignores: ["dist/", ".astro/", "node_modules/", "**/*.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // .astro 프론트매터(---)·<script>를 TypeScript 파서로 읽게 명시.
    // (플러그인 자동감지는 @typescript-eslint/parser를 CWD에서 resolve할 때만
    //  동작해서, IDE ESLint 확장처럼 해석 컨텍스트가 다르면 non-null `!` 등
    //  TS 문법에서 "Unexpected token" 파싱 에러가 났다.)
    files: ["**/*.astro"],
    languageOptions: {
      // parser(astro-eslint-parser)는 astro.configs.recommended가 이미 지정.
      // 여기선 프론트매터/<script>를 읽을 내부 파서만 TS로 명시한다.
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
