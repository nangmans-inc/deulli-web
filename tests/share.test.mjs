import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createShareService,
  isPositiveId,
  parseMetadata,
  sharePage,
  shareUrls,
  trustedImageUrl,
} from "../src/lib/share.ts";

const fallback = new Uint8Array(
  await readFile(new URL("../public/og-image.png", import.meta.url)),
);
const image = new Uint8Array([255, 216, 255, 224, 0, 0]);
const host = "d19hzt4ehho5l3.cloudfront.net";
const thumbnail = `https://${host}/images/episode.jpg?Signature=first`;
const episode = {
  id: 7,
  name: 'Title <script> & "quotes"',
  description: "Description",
  thumbnail_url: thumbnail,
};
const shorts = {
  id: 7,
  title: "Shorts title",
  summary: null,
  podcast_id: 9,
  podcast_name: "Podcast",
  thumbnail_url: null,
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const jpeg = () =>
  new Response(image, { headers: { "Content-Type": "image/jpeg" } });

function service(fetcher, extra = {}) {
  return createShareService({
    fetch: fetcher,
    fallbackImage: fallback,
    ...extra,
  });
}

test("positive IDs are canonical safe integers", () => {
  for (const id of ["1", "7", "9007199254740991"])
    assert.equal(isPositiveId(id), true);
  for (const id of [
    undefined,
    null,
    1,
    "0",
    "-1",
    "01",
    "+1",
    "1.0",
    "1e3",
    " 1",
    "1/2",
    "1?x",
    "9007199254740992",
    "1\n",
  ]) {
    assert.equal(isPositiveId(id), false, String(id));
  }
});

test("public URLs have fixed HTTPS origin, stable image paths and explicit app scheme", () => {
  assert.deepEqual(shareUrls("shorts", "7"), {
    canonical: "https://deulli.com/share/shorts/7",
    image: "https://deulli.com/share/og/shorts/7",
    app: "deulli://app/shorts/7",
  });
});

test("parses exact episode/shorts contracts, nullable summaries/images and ignores extra fields", () => {
  assert.equal(parseMetadata("episode", "7", episode).title, episode.name);
  assert.equal(
    parseMetadata("episode", "7", {
      ...episode,
      description: null,
    }).description.includes("에피소드"),
    true,
  );
  assert.equal(
    parseMetadata("shorts", "7", shorts).description.includes("쇼츠"),
    true,
  );
  assert.equal(parseMetadata("shorts", "7", shorts).podcastName, "Podcast");
  for (const invalid of [
    null,
    [],
    { ...episode, id: 8 },
    { ...episode, name: " " },
    { ...episode, thumbnail_url: 3 },
    { ...episode, description: undefined },
  ]) {
    assert.equal(parseMetadata("episode", "7", invalid), null);
  }
  for (const invalid of [
    { ...shorts, summary: undefined },
    { ...shorts, podcast_id: 0 },
    { ...shorts, podcast_name: null },
    { ...shorts, title: null },
  ]) {
    assert.equal(parseMetadata("shorts", "7", invalid), null);
  }
});

test("anonymous requests use agreed backend routes, no cookies/auth or redirects, no metadata caching", async () => {
  const seen = [];
  const api = service(async (url, init) => {
    seen.push({ url, init });
    return json(url.includes("/shorts/") ? shorts : episode);
  });
  assert.equal((await api.metadata("episode", "7")).status, "ok");
  assert.equal((await api.metadata("shorts", "7")).status, "ok");
  assert.deepEqual(
    seen.map(({ url }) => url),
    [
      "https://api.deulli.nangmans.com/podcasts/7",
      "https://api.deulli.nangmans.com/shorts/7/share",
    ],
  );
  for (const { init } of seen) {
    assert.equal(init.redirect, "manual");
    assert.equal(init.credentials, "omit");
    assert.equal(init.cache, "no-store");
    assert.deepEqual(init.headers, { Accept: "application/json" });
  }
});

test("server API_BASE supports a path prefix; invalid config fails closed", async () => {
  let called;
  const api = service(
    async (url) => {
      called = url;
      return json(episode);
    },
    { apiBase: "http://127.0.0.1:4000/api/" },
  );
  await api.metadata("episode", "7");
  assert.equal(called, "http://127.0.0.1:4000/api/podcasts/7");
  for (const apiBase of [
    "https://user:pass@api.example",
    "https://api.example?url=x",
    "http://untrusted.example",
    "file:///etc/passwd",
  ]) {
    assert.equal(
      (
        await service(() => assert.fail("must not fetch"), {
          apiBase,
        }).metadata("episode", "7")
      ).status,
      "unavailable",
    );
  }
});

test("malformed public IDs/kinds return 404 without backend calls", async () => {
  const api = service(() => assert.fail("must not fetch"));
  for (const [kind, id] of [
    ["episode", "0"],
    ["shorts", "01"],
    ["other", "7"],
  ]) {
    const page = await sharePage(api, kind, id);
    assert.equal(page.status, 404);
    assert.equal(page.cacheControl, "no-store");
    assert.equal(page.urls, null);
  }
});

for (const status of [401, 403, 404, 410, 422, 429, 500, 503, 302]) {
  test(`backend ${status}: separates inaccessible resources from upstream errors without caching`, async () => {
    const api = service(async () => json({}, status));
    const page = await sharePage(api, "episode", "7");
    assert.equal(
      page.status,
      [401, 403, 404, 410].includes(status) ? 404 : 503,
    );
    assert.equal(page.cacheControl, "no-store");
  });
}

test("invalid JSON, unexpected schema/type, oversized metadata and network failure are transient", async () => {
  for (const fetcher of [
    async () =>
      new Response("not json", {
        headers: { "Content-Type": "application/json" },
      }),
    async () =>
      new Response("<html>oops</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    async () => json({ ...episode, id: 8 }),
    async () => json({ ...episode, description: "x".repeat(128 * 1024) }),
    async () => {
      throw new Error("offline");
    },
  ]) {
    const result = await sharePage(service(fetcher), "episode", "7");
    assert.equal(result.status, 503);
    assert.equal(result.cacheControl, "no-store");
  }
});

test("metadata and stalled response bodies obey total request deadline", async () => {
  let cancelled = false;
  for (const fetcher of [
    () => new Promise(() => {}),
    async () =>
      new Response(
        new ReadableStream({
          start() {},
          cancel() {
            cancelled = true;
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
  ]) {
    const start = Date.now();
    const result = await service(fetcher, { timeoutMs: 15 }).metadata(
      "episode",
      "7",
    );
    assert.equal(result.status, "unavailable");
    assert.ok(Date.now() - start < 1000);
  }
  assert.equal(cancelled, true);
});

test("image allowlist rejects SSRF, arbitrary CloudFront, credentials, ports and lookalike hosts", () => {
  assert.equal(trustedImageUrl(thumbnail).hostname, host);
  for (const value of [
    "http://127.0.0.1/a.png",
    "https://169.254.169.254/latest/meta-data",
    "file:///etc/passwd",
    "https://evil.cloudfront.net/a",
    `https://${host}.evil.test/a`,
    `https://${host}@evil.test/a`,
    `https://user:password@${host}/a`,
    `http://${host}/a`,
    `https://${host}:444/a`,
    `https://${host}./a`,
    `https://${host}/a#fragment`,
    "data:image/png;base64,AAAA",
  ])
    assert.equal(trustedImageUrl(value), null, value);
});

test("image proxy always obtains fresh metadata/signature and serves bytes, never redirects", async () => {
  let signature = 0;
  const calls = [];
  const api = service(async (url) => {
    calls.push(url);
    if (url.includes("/podcasts/"))
      return json({ ...episode, thumbnail_url: `${thumbnail}${++signature}` });
    return jpeg();
  });
  for (let i = 0; i < 2; i++) {
    const response = await api.image("episode", "7");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), image);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=60, s-maxage=300",
    );
  }
  assert.equal(calls.length, 4);
  assert.ok(calls[1].endsWith("first1"));
  assert.ok(calls[3].endsWith("first2"));
});

test("null artwork uses exact bundled local PNG bytes", async () => {
  const response = await service(async () => json(shorts)).image("shorts", "7");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
});

test("untrusted metadata image URL is never fetched", async () => {
  let calls = 0;
  const response = await service(async () => {
    calls++;
    return json({
      ...episode,
      thumbnail_url: "http://169.254.169.254/latest/meta-data",
    });
  }).image("episode", "7");
  assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
});

for (const [label, imageResponse] of [
  [
    "redirect to private host",
    () =>
      new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/internal" },
      }),
  ],
  [
    "SVG",
    () =>
      new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } }),
  ],
  [
    "HTML disguised as PNG",
    () => new Response("<html/>", { headers: { "Content-Type": "image/png" } }),
  ],
  [
    "oversized declared image",
    () =>
      new Response(image, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": String(6 * 1024 * 1024),
        },
      }),
  ],
  [
    "oversized streamed image",
    () =>
      new Response(new Uint8Array(5 * 1024 * 1024 + 1), {
        headers: { "Content-Type": "image/jpeg" },
      }),
  ],
]) {
  test(`rejects ${label} with uncached fallback, no further fetch`, async () => {
    let calls = 0;
    const response = await service(async () =>
      ++calls === 1 ? json(episode) : imageResponse(),
    ).image("episode", "7");
    assert.equal(calls, 2);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
  });
}

test("cached fallback requires fresh public metadata, identical image path and bounded age", async () => {
  let timestamp = 0;
  let fail = false;
  let current = episode;
  const api = service(
    async (url) => {
      if (url.includes("/podcasts/")) return json(current);
      if (fail) throw new Error("offline");
      return jpeg();
    },
    { now: () => timestamp },
  );
  await api.image("episode", "7");
  fail = true;
  let response = await api.image("episode", "7");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), image);
  timestamp = 5 * 60 * 1000 + 1;
  response = await api.image("episode", "7");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
  fail = false;
  await api.image("episode", "7");
  fail = true;
  current = {
    ...episode,
    thumbnail_url: `https://${host}/different.jpg?Signature=x`,
  };
  response = await api.image("episode", "7");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
});

test("cache entry limit evicts old resources", async () => {
  let failure = false;
  const api = service(async (url) => {
    if (url.includes("/podcasts/"))
      return json({ ...episode, id: Number(url.split("/").at(-1)) });
    if (failure) throw new Error("offline");
    return jpeg();
  });
  for (let id = 1; id <= 33; id++) await api.image("episode", String(id));
  failure = true;
  assert.deepEqual(
    new Uint8Array(await (await api.image("episode", "1")).arrayBuffer()),
    fallback,
  );
  assert.deepEqual(
    new Uint8Array(await (await api.image("episode", "33")).arrayBuffer()),
    image,
  );
});

for (const upstreamStatus of [404, 503]) {
  test(`never serves previously cached resource when metadata becomes ${upstreamStatus}`, async () => {
    let status = 200;
    const api = service(async (url) =>
      url.includes("/podcasts/") ? json(episode, status) : jpeg(),
    );
    await api.image("episode", "7");
    status = upstreamStatus;
    const response = await api.image("episode", "7");
    assert.equal(response.status, upstreamStatus);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fallback);
  });
}
