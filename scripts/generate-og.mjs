/**
 * OG 이미지(1200×630) 생성기 — `pnpm og`
 *
 * 카피가 바뀌면 이 파일의 문구를 고치고 다시 돌린다. 결과물(public/og-image.png)은
 * 저장소에 커밋한다. 빌드 파이프라인에 넣지 않은 이유는, 이미지가 바뀌는 빈도가
 * 배포 빈도보다 훨씬 낮은데 매 배포마다 sharp를 태울 이유가 없기 때문이다.
 *
 * 텍스트는 이 스크립트를 실행하는 머신의 시스템 폰트로 렌더된다(macOS: Apple SD
 * Gothic Neo). 웹 폰트인 Pretendard와 완전히 같지는 않지만 OG 썸네일 크기에서는
 * 구분되지 않는다.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200;
const H = 630;

const FONT =
  "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fefaf6"/>
      <stop offset="55%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="glowBlue" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#0150e5" stop-opacity="0.22"/>
      <stop offset="70%" stop-color="#0150e5" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowCream" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fbf0e6" stop-opacity="0.95"/>
      <stop offset="72%" stop-color="#fbf0e6" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="logoClip">
      <rect x="88" y="96" width="104" height="104" rx="26"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="700" cy="-40" rx="620" ry="420" fill="url(#glowBlue)"/>
  <ellipse cx="60" cy="640" rx="520" ry="380" fill="url(#glowCream)"/>

  <!-- 로고 (logo.svg를 1254 → 104 스케일로 옮겨 그린 것) -->
  <g clip-path="url(#logoClip)">
    <g transform="translate(88 96) scale(${104 / 1254})">
      <rect width="1254" height="1254" fill="#0150E5"/>
      <path fill="#082142" d="M83.4997 639.5C79.4997 518.5 142 424 220 382C274 351 329 341 405 348C585 359 802 393 1000 438C1090 459 1148 523 1161 616C1174 716 1134 802 1066 849C998 894 837 919 694 938C542 958 392 965 298 943C183 917 113 845 96 756C89 717 85.9463 713.5 83.4997 639.5Z"/>
      <path fill="#FBF0E6" d="M404 690C439.346 690 468 660.003 468 623C468 585.997 439.346 556 404 556C368.654 556 340 585.997 340 623C340 660.003 368.654 690 404 690Z"/>
      <path d="M808 654C863.333 618 919 618 975 654" fill="none" stroke="#FBF0E6" stroke-width="31" stroke-linecap="round"/>
    </g>
  </g>

  <text x="216" y="140" font-family="${FONT}" font-size="38" font-weight="700" fill="#041225" letter-spacing="-1">들리</text>
  <text x="302" y="140" font-family="${FONT}" font-size="30" font-weight="600" fill="#718196" letter-spacing="0">deulli</text>
  <text x="216" y="182" font-family="${FONT}" font-size="26" font-weight="600" fill="#0150e5" letter-spacing="-0.5">사전신청 접수 중</text>

  <text x="88" y="330" font-family="${FONT}" font-size="76" font-weight="700" fill="#041225" letter-spacing="-3">영어 팟캐스트,</text>
  <text x="88" y="424" font-family="${FONT}" font-size="76" font-weight="700" fill="#041225" letter-spacing="-3">끝까지 듣게 됩니다</text>

  <text x="88" y="494" font-family="${FONT}" font-size="30" font-weight="500" fill="#4c5d72" letter-spacing="-0.8">스크립트가 문장 단위로 따라 흐릅니다. 놓친 문장은 탭 한 번으로.</text>

  <rect x="88" y="540" width="270" height="52" rx="26" fill="#0150e5"/>
  <text x="223" y="574" font-family="${FONT}" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">deulli.com</text>
</svg>`;

const out = join(root, "public", "og-image.png");
const png = await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(out, png);
console.log(
  `og-image.png 생성 완료 — ${W}×${H}, ${(png.length / 1024).toFixed(0)}KB`,
);
