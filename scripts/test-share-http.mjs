import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { site } from "../src/data/site.ts";
import {
  imageHost,
  signedImage,
} from "../tests/helpers/share-image-fixture.mjs";
import {
  runShareRedirect,
  shareRedirectFromHtml,
} from "../tests/helpers/share-browser.mjs";

const built = process.argv.includes("--built");
const kinds = ["episode", "shorts", "channel", "series"];
const labels = {
  episode: "에피소드",
  shorts: "쇼츠",
  channel: "채널",
  series: "시리즈",
};
const descriptions = {
  episode: "Episode description",
  shorts: "Shorts summary",
  channel: "Channel description",
  series: "Series description",
};
const aasaPath = "/.well-known/apple-app-site-association";
const assetlinksPath = "/.well-known/assetlinks.json";
const fingerprints = [
  "34:70:39:F3:3D:0B:5D:D4:C8:DA:03:EB:48:A4:7F:B0:78:69:70:68:52:0C:78:B1:5F:62:7C:24:25:FC:01:FE",
  "BA:C1:F8:5B:95:15:3F:7D:1D:3C:D6:BF:9A:6C:EB:36:B9:CD:22:2F:C1:BC:90:D0:B7:5F:AC:0D:35:9D:1B:DA",
  "D7:AE:9C:AC:18:9A:37:CF:57:1A:06:6D:F4:76:4B:E7:AD:A6:7D:59:28:C8:95:66:30:7C:38:FD:A0:17:31:89",
];
const hosting = JSON.parse(await readFile("vercel.json", "utf8"));
const assetlinksRules = hosting.headers.filter(
  (rule) => rule.source === assetlinksPath,
);
assert.equal(assetlinksRules.length, 1);
const assetlinksHeaders = Object.fromEntries(
  assetlinksRules[0].headers.map(({ key, value }) => [
    key.toLowerCase(),
    value,
  ]),
);
assert.deepEqual(assetlinksHeaders, {
  "content-type": "application/json",
  "cache-control": "public, max-age=3600",
});
const assetlinksBody = await readFile(
  `${built ? ".vercel/output/static" : "public"}${assetlinksPath}`,
  "utf8",
);
const aasaBody = await readFile(
  `${built ? ".vercel/output/static" : "public"}${aasaPath}`,
  "utf8",
);
const aasaHeaders = Object.fromEntries(
  hosting.headers
    .find((rule) => rule.source === aasaPath)
    .headers.map(({ key, value }) => [key.toLowerCase(), value]),
);
assert.deepEqual(aasaHeaders, {
  "content-type": "application/json",
  "cache-control": "public, max-age=3600",
});

// Exercise Astro's real SSR renderer and HTML escaping, with no production API mutation.
const calls = [];
const attack = 'A "quote" & <script id="injected">alert(1)</script>';
let signature = 0;
const backend = createServer((req, res) => {
  calls.push(req.url);
  res.setHeader("Content-Type", "application/json");
  const match = req.url.match(
    /^\/(podcasts|shorts|channels|series)\/(\d+)(\/share)?$/,
  );
  if (!match || (match[1] === "podcasts" ? !!match[3] : !match[3])) {
    res.writeHead(404).end("{}");
    return;
  }
  const id = match[2];
  if (id === "404" || id === "403") {
    res.writeHead(Number(id)).end("{}");
  } else if (id === "503") {
    res.writeHead(503).end("{}");
  } else if (match[1] === "channels" || match[1] === "series") {
    const kind = match[1] === "channels" ? "channel" : "series";
    res.end(
      JSON.stringify({
        id: Number(id),
        [kind === "channel" ? "name" : "title"]: attack,
        description: id === "8" ? null : `${descriptions[kind]} ${attack}`,
        cover_url:
          id === "8"
            ? null
            : `https://${imageHost}/share-fixture/${kind}.jpg?Signature=fixture-${++signature}&Key-Pair-Id=fixture-key`,
      }),
    );
  } else if (req.url.startsWith("/shorts/")) {
    res.end(
      JSON.stringify({
        id: Number(id),
        title: attack,
        summary: `Shorts summary ${attack}`,
        podcast_id: 9,
        podcast_name: `Podcast ${attack}`,
        thumbnail_url: null,
      }),
    );
  } else {
    res.end(
      JSON.stringify({
        id: Number(id),
        name: attack,
        description: `Episode description ${attack}`,
        thumbnail_url: null,
      }),
    );
  }
});
backend.listen(0, "127.0.0.1");
await once(backend, "listening");
const portProbe = createServer();
portProbe.listen(0, "127.0.0.1");
await once(portProbe, "listening");
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
let builtServer;
let child;
if (built) {
  process.env.API_BASE = `http://127.0.0.1:${backend.address().port}`;
  const { default: handler } =
    await import("../.vercel/output/functions/_render.func/dist/server/entry.mjs");
  builtServer = createServer((req, res) => {
    // The local adapter handler only serves SSR; Vercel serves static files first.
    if (req.url === assetlinksPath) {
      res.writeHead(200, assetlinksHeaders).end(assetlinksBody);
      return;
    }
    if (req.url === aasaPath) {
      res.writeHead(200, aasaHeaders).end(aasaBody);
      return;
    }
    void handler(req, res).catch((error) => {
      console.error(error);
      res.writeHead(500).end();
    });
  });
  builtServer.listen(port, "127.0.0.1");
  await once(builtServer, "listening");
} else {
  child = spawn(
    process.execPath,
    [
      "--import",
      new URL("../tests/helpers/share-image-fixture.mjs", import.meta.url).href,
      "node_modules/astro/astro.js",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        API_BASE: `http://127.0.0.1:${backend.address().port}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}
let output = "";
child?.stdout.on("data", (chunk) => {
  output += chunk;
});
child?.stderr.on("data", (chunk) => {
  output += chunk;
});
const base = `http://127.0.0.1:${port}`;

function checkBrandAndStores(html) {
  assert.match(html, /<header\b[\s\S]*?aria-label="들리 홈"/);
  assert.match(html, /<footer\b[^>]*>듣다 보면 들리니까, 들리<\/footer>/);
  for (const [store, label, badge] of [
    [site.stores.appStore, "App Store", "/badges/app-store-ko.svg"],
    [site.stores.googlePlay, "Google Play", "/badges/google-play-ko.png"],
  ]) {
    assert.match(
      html,
      new RegExp(
        `<a\\b[^>]*href="${store.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*aria-label="${label}에서 들리 다운로드 \\(새 창\\)"[^>]*>[\\s\\S]*?<img\\b[^>]*src="${badge}"`,
      ),
    );
  }
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (child && child.exitCode !== null) throw new Error(output);
    try {
      ready = (await fetch(`${base}/share/episode/7`)).ok;
    } catch {
      /* starting */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, output);
  const assetlinksResponse = await fetch(`${base}${assetlinksPath}`, {
    redirect: "manual",
  });
  assert.equal(assetlinksResponse.status, 200);
  assert.equal(assetlinksResponse.headers.get("location"), null);
  assert.equal(assetlinksResponse.headers.get("www-authenticate"), null);
  assert.match(
    assetlinksResponse.headers.get("content-type"),
    /^application\/json(?:\s*;|$)/i,
  );
  if (built) {
    assert.equal(
      assetlinksResponse.headers.get("cache-control"),
      "public, max-age=3600",
    );
    assert.equal(
      assetlinksBody,
      await readFile(`public${assetlinksPath}`, "utf8"),
    );
  }
  const assetlinksText = await assetlinksResponse.text();
  assert.equal(assetlinksText, assetlinksBody);
  const assetlinks = JSON.parse(assetlinksText);
  assert.deepEqual(assetlinks, [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.deulli.app",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
  for (const fingerprint of assetlinks[0].target.sha256_cert_fingerprints) {
    assert.match(fingerprint, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  }
  for (const kind of kinds) {
    const response = await fetch(
      `${base}/share/${kind}/7?image=http://127.0.0.1/private`,
      { headers: { "User-Agent": "Twitterbot/1.0" } },
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    const html = await response.text();
    assert.ok(html.includes(`href="https://deulli.com/share/${kind}/7"`));
    assert.ok(html.includes(`content="https://deulli.com/share/og/${kind}/7"`));
    checkBrandAndStores(html);
    assert.match(
      html,
      new RegExp(
        `<div class="artwork"[^>]*>\\s*<img[^>]*src="/share/og/${kind}/7"[^>]*width="630"[^>]*height="630"`,
      ),
    );
    assert.match(
      html,
      /<h1 id="share-title"[^>]*>A &quot;quote&quot; &amp; &lt;script/,
    );
    assert.match(
      html,
      new RegExp(`<p class="eyebrow"[^>]*>함께 듣는 들리 ${labels[kind]}</p>`),
    );
    assert.match(
      html,
      new RegExp(
        `<p class="description"[^>]*>${descriptions[kind]} A &quot;quote&quot; &amp; &lt;script`,
      ),
    );
    assert.equal(/<p class="podcast"/.test(html), kind === "shorts");
    if (kind === "shorts")
      assert.match(html, /<p class="podcast"[^>]*>Podcast A &quot;quote&quot;/);
    assert.match(
      html,
      new RegExp(
        `<a class="open-app" href="deulli://app/${kind}/7"[^>]*>\\s*들리 앱에서 듣기\\s*</a>`,
      ),
    );
    assert.ok(html.includes("앱이 없다면 지금 들리를 다운로드하세요."));
    for (const tag of [
      "og:type",
      "og:site_name",
      "og:locale",
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "og:image:alt",
      "twitter:card",
      "twitter:title",
      "twitter:description",
      "twitter:image",
      "twitter:image:alt",
    ]) {
      assert.match(
        html,
        new RegExp(`<meta (?:property|name)="${tag}" content="[^"]+"`),
      );
    }
    assert.ok(html.includes("&lt;script"));
    assert.ok(!html.includes('<script id="injected">'));
    assert.ok(!html.includes('http-equiv="refresh"'));
    assert.ok(!html.includes(imageHost));
    assert.ok(!html.includes("Signature="));
    assert.ok(!html.includes("Key-Pair-Id="));
    assert.ok(html.includes(`href="${site.stores.appStore}"`));
    assert.ok(html.includes(`href="${site.stores.googlePlay}"`));
    const { code, stores, appUrl } = shareRedirectFromHtml(html);
    assert.deepEqual(stores, site.stores);
    assert.equal(appUrl, `deulli://app/${kind}/7`);
    for (const [userAgent, platform, maxTouchPoints, expected] of [
      ["Mozilla/5.0 (iPhone) Mobile Safari", "iPhone", 5, stores.appStore],
      ["Mozilla/5.0 (Android 14) Mobile Chrome", "Linux armv8l", 5, appUrl],
      ["Mozilla/5.0 (Macintosh) Safari", "MacIntel", 5, stores.appStore],
      ["Mozilla/5.0 (Macintosh) Safari", "MacIntel", 0, null],
      ["Unknown", "", 0, null],
      ["Mozilla/5.0 (Android 14) Googlebot", "Linux armv8l", 5, null],
      ["Mozilla/5.0 (iPhone) facebookexternalhit/1.1", "iPhone", 5, null],
    ]) {
      const browser = runShareRedirect(code, {
        userAgent,
        platform,
        maxTouchPoints,
        stores,
        appUrl,
        history: [`https://deulli.com/share/${kind}/7`],
      });
      assert.deepEqual(browser.destinations, expected ? [expected] : []);
      if (/Android/.test(userAgent) && expected) {
        assert.match(browser.appLink.href, /^intent:\/\/app\//);
        assert.ok(browser.appLink.href.includes("package=com.deulli.app;"));
        assert.ok(
          browser.appLink.href.includes(
            `S.browser_fallback_url=${encodeURIComponent(stores.googlePlay)};`,
          ),
        );
      }
      assert.deepEqual(
        browser.history,
        expected
          ? [`https://deulli.com/share/${kind}/7`, expected]
          : [`https://deulli.com/share/${kind}/7`],
      );
    }
    const returned = runShareRedirect(code, {
      userAgent: "iPhone",
      stores,
      navigationType: "back_forward",
    });
    returned.dispatch("visibilitychange");
    assert.deepEqual(returned.destinations, []);
    assert.equal(returned.listenerCount(), 0);
    const loading = runShareRedirect(code, {
      userAgent: "iPhone",
      stores,
      readyState: "loading",
    });
    assert.deepEqual(loading.destinations, []);
    loading.document.readyState = "complete";
    loading.dispatch("pageshow");
    loading.dispatch("visibilitychange");
    assert.deepEqual(loading.destinations, []);
    loading.frame();
    loading.dispatch("pageshow");
    loading.dispatch("visibilitychange");
    assert.deepEqual(loading.destinations, [stores.appStore]);
    assert.equal(loading.listenerCount(), 0);
    const background = runShareRedirect(code, {
      userAgent: "iPhone",
      stores,
      visibilityState: "hidden",
      prerendering: true,
    });
    assert.deepEqual(background.destinations, []);
    background.document.visibilityState = "visible";
    background.dispatch("visibilitychange");
    assert.deepEqual(background.destinations, []);
    background.document.prerendering = false;
    background.dispatch("prerenderingchange");
    assert.deepEqual(background.destinations, [stores.appStore]);
    const image = await fetch(`${base}/share/og/${kind}/7`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("location"), null);
    const hasCover = kind === "channel" || kind === "series";
    assert.equal(
      image.headers.get("content-type"),
      hasCover ? "image/jpeg" : "image/png",
    );
    assert.ok(!JSON.stringify([...image.headers]).includes("Signature="));
    assert.deepEqual(
      Buffer.from(await image.arrayBuffer()),
      hasCover
        ? Buffer.from(signedImage)
        : await readFile("public/og-image.png"),
    );
    if (hasCover) {
      const nullable = await fetch(`${base}/share/${kind}/8`);
      assert.equal(nullable.status, 200);
      const nullableHtml = await nullable.text();
      checkBrandAndStores(nullableHtml);
      assert.ok(
        nullableHtml.includes(
          `들리에서 이 ${labels[kind]}의 이야기를 듣고 영어를 공부해 보세요.`,
        ),
      );
      assert.ok(nullableHtml.includes(`href="deulli://app/${kind}/8"`));
      const fallback = await fetch(`${base}/share/og/${kind}/8`);
      assert.equal(fallback.status, 200);
      assert.equal(fallback.headers.get("content-type"), "image/png");
      assert.deepEqual(
        Buffer.from(await fallback.arrayBuffer()),
        await readFile("public/og-image.png"),
      );
    }
  }
  const previousCalls = calls.length;
  for (const path of [
    "episode/0",
    "episode/01",
    "shorts/-1",
    "channel/01",
    "series/9007199254740992",
    "channels/7",
    "other/7",
    "og/episode/0",
    "og/channel/0",
    "og/series/1e3",
    "og/other/7",
  ]) {
    const response = await fetch(`${base}/share/${path}`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("location"), null);
    if (!path.startsWith("og/")) {
      const html = await response.text();
      checkBrandAndStores(html);
      assert.ok(!html.includes("data-share-redirect"));
      assert.ok(!html.includes('http-equiv="refresh"'));
      assert.ok(html.includes("찾을 수 없어요"));
      assert.ok(html.includes("들리 홈으로"));
      assert.ok(!html.includes("다시 시도하기"));
      assert.ok(!html.includes("deulli://"));
    }
  }
  assert.equal(calls.length, previousCalls);
  for (const kind of kinds) {
    for (const id of ["403", "404", "503"]) {
      for (const prefix of ["", "og/"]) {
        const response = await fetch(`${base}/share/${prefix}${kind}/${id}`);
        assert.equal(response.status, id === "503" ? 503 : 404);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.headers.get("location"), null);
        if (id === "503")
          assert.equal(response.headers.get("retry-after"), "30");
        if (!prefix) {
          const html = await response.text();
          checkBrandAndStores(html);
          assert.ok(!html.includes("data-share-redirect"));
          assert.ok(!html.includes('http-equiv="refresh"'));
          assert.ok(
            html.includes(
              id === "503"
                ? "잠시 후 다시 열어 주세요"
                : `공유한 ${kind === "channel" ? "채널을" : kind === "series" ? "시리즈를" : "콘텐츠를"} 찾을 수 없어요`,
            ),
          );
          assert.equal(html.includes("다시 시도하기"), id === "503");
          assert.ok(html.includes("들리 홈으로"));
          assert.ok(!html.includes("deulli://"));
          if (id === "503")
            assert.ok(html.includes(`href="/share/${kind}/503"`));
        }
      }
    }
  }
  const associationResponse = await fetch(`${base}${aasaPath}`, {
    redirect: "manual",
  });
  assert.equal(associationResponse.status, 200);
  assert.equal(associationResponse.headers.get("location"), null);
  // Astro dev does not apply Vercel headers to this extensionless static file.
  if (built) {
    assert.match(
      associationResponse.headers.get("content-type"),
      /^application\/json(?:\s*;|$)/i,
    );
    assert.equal(
      associationResponse.headers.get("cache-control"),
      "public, max-age=3600",
    );
  }
  assert.equal(await associationResponse.text(), aasaBody);
  assert.deepEqual(JSON.parse(aasaBody), {
    applinks: {
      apps: [],
      details: [
        {
          appID: "GT75SU9T79.com.deulli.app",
          paths: kinds.map((kind) => `/share/${kind}/*`),
        },
      ],
    },
  });
  for (const kind of kinds) {
    const upstream =
      kind === "episode"
        ? "/podcasts/7"
        : `/${kind === "channel" ? "channels" : kind}/7/share`;
    assert.ok(calls.includes(upstream), `missing upstream ${upstream}`);
  }
  if (built) {
    const home = await readFile(".vercel/output/static/index.html", "utf8");
    assert.ok(home.includes("https://deulli.com/og-image.png"));
    assert.ok(!home.includes("함께 듣는 들리"));
    assert.equal(aasaBody, await readFile(`public${aasaPath}`, "utf8"));
    const config = JSON.parse(
      await readFile(".vercel/output/config.json", "utf8"),
    );
    const filesystemIndex = config.routes.findIndex(
      (route) => route.handle === "filesystem",
    );
    assert.ok(filesystemIndex >= 0);
    for (const path of [assetlinksPath, aasaPath]) {
      assert.ok(
        config.routes
          .slice(0, filesystemIndex)
          .every(
            (route) =>
              !route.src ||
              !new RegExp(route.src).test(path) ||
              (!route.dest && !route.status),
          ),
        `${path} must reach the static filesystem without redirects or rewrites`,
      );
    }
    assert.ok(
      config.routes.some(
        (route) => route.src?.includes("share/og/") && route.dest === "_render",
      ),
    );
  }
  console.log(
    `${built ? "Built Vercel" : "Astro dev"} SSR/static HTTP checks passed: episode/shorts/channel/series full fallback content/artwork/app/store links, OG/Twitter, escaping, canonical, shipped redirect behavior, signed cover byte proxy without URL exposure, nullable metadata/local PNG, ID/status/cache/retry, AASA four exact paths and unchanged assetlinks three Play SHA-256 fingerprints.`,
  );
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (child && child.exitCode === null) {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
  if (builtServer) await new Promise((resolve) => builtServer.close(resolve));
  await new Promise((resolve) => backend.close(resolve));
}
