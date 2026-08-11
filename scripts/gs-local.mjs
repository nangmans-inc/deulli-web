/**
 * 복붙용 Apps Script 파일 생성기 — `pnpm gs:local`
 *
 * apps-script/Code.gs의 비밀값 자리를 .env 값으로 채워
 * apps-script/Code.local.gs를 만든다. 이 파일은 .gitignore 대상이다.
 *
 * 왜 이렇게 하나 — 이 저장소는 public이다. 디스코드 웹훅 URL을 아는 사람은 누구나
 * 그 채널에 글을 쓸 수 있으므로 사실상 비밀번호다. 저장소에 커밋하면 git 기록에
 * 영구히 남고 GitHub 캐시에도 퍼진다. 그래서 Code.gs에는 빈 문자열을 두고,
 * 붙여넣을 때만 이 스크립트로 채운 사본을 쓴다.
 *
 * .env에 넣을 값 (PUBLIC_ 접두사를 붙이지 않는다 — 붙이면 클라이언트 번들에
 * 인라인돼서 사이트 소스에 그대로 노출된다):
 *
 *   DISCORD_WEBHOOK=https://discord.com/api/webhooks/…
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "apps-script", "Code.gs");
const OUT = join(root, "apps-script", "Code.local.gs");
const ENV = join(root, ".env");

function readEnv() {
  if (!existsSync(ENV)) return {};
  const out = {};
  for (const line of readFileSync(ENV, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = readEnv();
const webhook = env.DISCORD_WEBHOOK || "";

let src = readFileSync(SRC, "utf8");
src = src.replace(
  'const DISCORD_WEBHOOK = "";',
  "const DISCORD_WEBHOOK = " + JSON.stringify(webhook) + ";",
);

writeFileSync(OUT, src);

console.log(
  "apps-script/Code.local.gs 생성 — 이 파일을 통째로 복사해 붙여넣으세요.",
);
console.log(
  "  디스코드 웹훅: " +
    (webhook
      ? webhook.slice(0, 42) + "…"
      : "(비어 있음 — .env에 DISCORD_WEBHOOK을 넣으세요)"),
);
console.log("  이 파일은 .gitignore 대상이라 커밋되지 않습니다.");
