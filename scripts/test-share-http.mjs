import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";

// Exercise Astro's real SSR renderer and HTML escaping, with no production API mutation.
const calls = [];
const attack = 'A "quote" & <script id="injected">alert(1)</script>';
const backend = createServer((req, res) => {
  calls.push(req.url);
  res.setHeader("Content-Type", "application/json");
  const id = req.url.match(/\/(\d+)(?:\/share)?$/)?.[1];
  if (id === "404" || id === "403") {
    res.writeHead(Number(id)).end("{}");
  } else if (id === "503") {
    res.writeHead(503).end("{}");
  } else if (req.url.startsWith("/shorts/")) {
    res.end(
      JSON.stringify({
        id: Number(id),
        title: attack,
        summary: null,
        podcast_id: 9,
        podcast_name: "Podcast",
        thumbnail_url: null,
      }),
    );
  } else {
    res.end(
      JSON.stringify({
        id: Number(id),
        name: attack,
        description: attack,
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
const built = process.argv.includes("--built");
let builtServer;
let child;
if (built) {
  process.env.API_BASE = `http://127.0.0.1:${backend.address().port}`;
  const { default: handler } =
    await import("../.vercel/output/functions/_render.func/dist/server/entry.mjs");
  builtServer = createServer((req, res) => {
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
  for (const kind of ["episode", "shorts"]) {
    const response = await fetch(
      `${base}/share/${kind}/7?image=http://127.0.0.1/private`,
    );
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`href="https://deulli.com/share/${kind}/7"`));
    assert.ok(html.includes(`content="https://deulli.com/share/og/${kind}/7"`));
    assert.ok(html.includes(`src="/share/og/${kind}/7"`));
    assert.ok(html.includes(`href="deulli://app/${kind}/7"`));
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
    assert.ok(html.includes("https://apps.apple.com/kr/app/id6798545609"));
    assert.ok(
      html.includes(
        "https://play.google.com/store/apps/details?id=com.deulli.app",
      ),
    );
    const image = await fetch(`${base}/share/og/${kind}/7`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("location"), null);
    assert.equal(image.headers.get("content-type"), "image/png");
    assert.deepEqual(
      Buffer.from(await image.arrayBuffer()),
      await readFile("public/og-image.png"),
    );
  }
  const previousCalls = calls.length;
  for (const path of [
    "episode/0",
    "episode/01",
    "shorts/-1",
    "other/7",
    "og/episode/0",
  ]) {
    const response = await fetch(`${base}/share/${path}`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls.length, previousCalls);
  for (const id of ["403", "404", "503"]) {
    for (const prefix of ["", "og/"]) {
      const response = await fetch(`${base}/share/${prefix}episode/${id}`);
      assert.equal(response.status, id === "503" ? 503 : 404);
      assert.equal(response.headers.get("cache-control"), "no-store");
      if (id === "503") assert.equal(response.headers.get("retry-after"), "30");
    }
  }
  const association = built
    ? JSON.parse(
        await readFile(
          ".vercel/output/static/.well-known/apple-app-site-association",
          "utf8",
        ),
      )
    : await (
        await fetch(`${base}/.well-known/apple-app-site-association`)
      ).json();
  assert.equal(
    association.applinks.details[0].appID,
    "GT75SU9T79.com.deulli.app",
  );
  if (built) {
    const home = await readFile(".vercel/output/static/index.html", "utf8");
    assert.ok(home.includes("https://deulli.com/og-image.png"));
    assert.ok(!home.includes("함께 듣는 들리"));
    const config = JSON.parse(
      await readFile(".vercel/output/config.json", "utf8"),
    );
    assert.ok(
      config.routes.some(
        (route) => route.src?.includes("share/og/") && route.dest === "_render",
      ),
    );
  }
  console.log(
    `${built ? "Built Vercel" : "Astro dev"} SSR HTTP checks passed: episode/shorts OG, escaping, canonical, app/store links, local PNG, ID/status/cache and AASA.`,
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
