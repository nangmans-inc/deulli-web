/**
 * OG 이미지(1200×630) 생성기 — `pnpm og`
 *
 * 카피가 바뀌면 이 파일의 문구를 고치고 다시 돌린다. 결과물(public/og-image.png)은
 * 저장소에 커밋한다. 빌드 파이프라인에 넣지 않은 이유는, 이미지가 바뀌는 빈도가
 * 배포 빈도보다 훨씬 낮은데 매 배포마다 sharp를 태울 이유가 없기 때문이다.
 *
 * 색과 구도는 사전신청 페이지와 맞춘다 — 밝은 바탕에 왼쪽 슬로건, 오른쪽 목업.
 * 공유 카드와 실제 페이지가 따로 놀면 클릭한 사람이 잘못 온 줄 안다.
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

const NAVY = "#082142";
const BLUE = "#0150e5";
const MUTED = "#4c5d72";

const FONT =
  "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif";

const MOCKUP_HEIGHT = 566;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="blueGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.13"/>
      <stop offset="66%" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fbf0e6" stop-opacity="0.9"/>
      <stop offset="62%" stop-color="#fbf0e6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <ellipse cx="60" cy="20" rx="440" ry="330" fill="url(#warm)"/>
  <ellipse cx="940" cy="300" rx="520" ry="420" fill="url(#blueGlow)"/>

  <text x="88" y="216" font-family="${FONT}" font-size="72" font-weight="700" fill="${NAVY}" letter-spacing="-2.5">듣다 보면</text>
  <text x="88" y="304" font-family="${FONT}" font-size="72" font-weight="700" fill="${NAVY}" letter-spacing="-2.5">들리니까,</text>
  <text x="88" y="416" font-family="${FONT}" font-size="100" font-weight="800" fill="${BLUE}" letter-spacing="-5">들리</text>

  <text x="88" y="478" font-family="${FONT}" font-size="30" font-weight="500" fill="${MUTED}" letter-spacing="-0.8">팟캐스트로 하는 영어 공부</text>

  <rect x="88" y="518" width="252" height="52" rx="26" fill="${BLUE}"/>
  <text x="214" y="552" font-family="${FONT}" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">deulli.com</text>
</svg>`;

const mockup = await sharp(join(root, "src", "assets", "hero-mockup.png"))
  .resize({ height: MOCKUP_HEIGHT })
  .toBuffer();

const png = await sharp(Buffer.from(svg))
  .composite([{ input: mockup, left: 800, top: 32 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const out = join(root, "public", "og-image.png");
writeFileSync(out, png);
console.log(
  `og-image.png 생성 완료 — ${W}×${H}, ${(png.length / 1024).toFixed(0)}KB`,
);
