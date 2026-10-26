import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { site } from "../src/data/site.ts";
import { runShareRedirect } from "./helpers/share-browser.mjs";

const code = await readFile(
  new URL("../src/scripts/share-redirect.js", import.meta.url),
  "utf8",
);
const ios =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari";
const android =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130 Mobile Safari";
const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/17 Safari";
const app = "deulli://app/episode/7";
const androidIntent = (url) =>
  `intent:${url.slice("deulli:".length)}#Intent;scheme=deulli;package=com.deulli.app;S.browser_fallback_url=${encodeURIComponent(site.stores.googlePlay)};end`;
const run = (options) =>
  runShareRedirect(code, { stores: site.stores, ...options });

test("iPhone, iPod and iPad mobile UAs try the app and keep its manual link", () => {
  for (const userAgent of [
    ios,
    ios.replace("iPhone", "iPod"),
    "Mozilla/5.0 (iPad)",
  ]) {
    const browser = run({ userAgent });
    assert.deepEqual(browser.destinations, [app]);
    assert.equal(browser.appLink.href, app);
    assert.equal(browser.listenerCount(), 0);
    browser.dispatch("visibilitychange");
    assert.equal(browser.destinations.length, 1);
  }
});

test("Android phone and tablet UAs try the app immediately without waiting for load", () => {
  for (const userAgent of [android, android.replace(" Mobile", "")]) {
    const browser = run({ userAgent, readyState: "loading" });
    assert.deepEqual(browser.destinations, [app]);
    assert.equal(browser.appLink.href, androidIntent(app));
    assert.equal(browser.listenerCount(), 0);
    browser.dispatch("pageshow");
    browser.frame();
    assert.deepEqual(browser.destinations, [app]);
  }
});

test("all Android content routes keep Play fallback on the explicit app link only", () => {
  for (const kind of ["episode", "shorts", "channel", "series"]) {
    const appUrl = `deulli://app/${kind}/8349`;
    const browser = run({ userAgent: `${android} KAKAOTALK/26.8`, appUrl });
    assert.deepEqual(browser.destinations, [appUrl]);
    assert.equal(browser.appLink.href, androidIntent(appUrl));
    assert.ok(!browser.destinations.includes(site.stores.googlePlay));
  }
});

test("desktop-mode iPad uses MacIntel and multiple touch points without redirecting Macs", () => {
  assert.deepEqual(
    run({ userAgent: mac, platform: "MacIntel", maxTouchPoints: 5 })
      .destinations,
    [app],
  );
  for (const maxTouchPoints of [0, 1]) {
    assert.deepEqual(
      run({ userAgent: mac, platform: "MacIntel", maxTouchPoints })
        .destinations,
      [],
    );
  }
});

test("desktop, unknown and absent UAs retain manual links without navigation listeners", () => {
  for (const userAgent of [
    mac,
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "",
    "Unknown",
  ]) {
    const browser = run({ userAgent });
    assert.deepEqual(browser.destinations, []);
    assert.equal(browser.listenerCount(), 0);
  }
});

test("known preview crawlers cannot redirect even with Android, iOS or desktop iPad identities", () => {
  for (const crawler of [
    "Googlebot",
    "bingbot",
    "DuckDuckBot",
    "Applebot",
    "YandexBot",
    "facebookexternalhit/1.1",
    "Facebot",
    "meta-externalagent/1.1",
    "Twitterbot/1.0",
    "LinkedInBot",
    "Slackbot-LinkExpanding",
    "Discordbot",
    "WhatsApp/2.0",
    "TelegramBot",
    "KakaoTalk-Scrap/1.0",
    "kakaostory-og-reader",
    "Embedly/0.2",
    "Iframely/1.0",
    "vkShare/1.0",
    "Pinterestbot",
    "bingpreview",
    "GoogleOther",
    "Google-InspectionTool",
    "Google-Read-Aloud",
    "Mediapartners-Google",
    "HeadlessChrome",
    "ExampleCrawler",
  ]) {
    for (const mobile of [ios, android, mac]) {
      const browser = run({
        userAgent: `${mobile} ${crawler}`,
        platform: "MacIntel",
        maxTouchPoints: 5,
      });
      assert.deepEqual(browser.destinations, [], crawler);
      assert.equal(browser.listenerCount(), 0);
    }
  }
  // Kakao's interactive in-app browser is distinct from its preview crawler.
  assert.deepEqual(
    run({ userAgent: `${android} KAKAOTALK/11.0` }).destinations,
    [app],
  );
});

test("background documents wait for visibility and navigate only once", () => {
  const browser = run({ userAgent: android, visibilityState: "hidden" });
  assert.deepEqual(browser.destinations, []);
  browser.dispatch("visibilitychange");
  assert.deepEqual(browser.destinations, []);
  browser.document.visibilityState = "visible";
  browser.dispatch("visibilitychange");
  browser.dispatch("prerenderingchange");
  assert.deepEqual(browser.destinations, [app]);
  assert.equal(browser.listenerCount(), 0);
});

test("mobile app opening does not wait for images, pageshow or a timer", () => {
  for (const userAgent of [ios, android]) {
    const browser = run({ userAgent, readyState: "loading" });
    assert.deepEqual(browser.destinations, [app]);
    browser.document.readyState = "complete";
    browser.dispatch("pageshow");
    browser.frame();
    browser.dispatch("visibilitychange");
    assert.deepEqual(browser.destinations, [app]);
    assert.equal(browser.listenerCount(), 0);
  }
});

test("prerendered documents require activation and visibility in either event order", () => {
  for (const activationFirst of [true, false]) {
    const browser = run({
      userAgent: ios,
      visibilityState: "hidden",
      prerendering: true,
    });
    const activate = () => {
      browser.document.prerendering = false;
      browser.dispatch("prerenderingchange");
    };
    const show = () => {
      browser.document.visibilityState = "visible";
      browser.dispatch("visibilitychange");
    };
    (activationFirst ? activate : show)();
    assert.deepEqual(browser.destinations, []);
    (activationFirst ? show : activate)();
    assert.deepEqual(browser.destinations, [app]);
  }
});

test("browsers without the prerender API still navigate while visible", () => {
  const browser = run({ userAgent: ios, visibilityState: "hidden" });
  delete browser.document.prerendering;
  browser.document.visibilityState = "visible";
  browser.dispatch("visibilitychange");
  assert.deepEqual(browser.destinations, [app]);
});

test("blocked navigation is caught without retrying on return to the page", () => {
  const browser = run({ userAgent: ios, blockNavigation: true });
  browser.dispatch("visibilitychange");
  assert.deepEqual(browser.destinations, [app]);
  assert.equal(browser.listenerCount(), 0);
  assert.deepEqual(browser.history, ["https://deulli.com/share/episode/7"]);
});

test("blocked Android app opening retains the page and manual intent without a store redirect", () => {
  const browser = run({ userAgent: android, blockNavigation: true });
  assert.deepEqual(browser.destinations, [app]);
  assert.equal(browser.appLink.href, androidIntent(app));
  assert.deepEqual(browser.history, ["https://deulli.com/share/episode/7"]);
  browser.document.visibilityState = "hidden";
  browser.dispatch("visibilitychange");
  browser.document.visibilityState = "visible";
  browser.dispatch("visibilitychange");
  browser.dispatch("pageshow");
  browser.frame();
  assert.deepEqual(browser.destinations, [app]);
  assert.equal(browser.listenerCount(), 0);
});

test("Android history returns preserve the manual intent without automatically opening again", () => {
  const browser = run({ userAgent: android, navigationType: "back_forward" });
  assert.deepEqual(browser.destinations, []);
  assert.equal(browser.appLink.href, androidIntent(app));
  assert.equal(browser.listenerCount(), 0);
});

test("mobile platforms do not launch a missing or malformed app destination", () => {
  for (const options of [
    { hasAppLink: false },
    { appUrl: null },
    { appUrl: "" },
    { appUrl: "https://example.com" },
    { appUrl: "deulli://app/episode/0" },
    { appUrl: "deulli://app/episode/7#Intent;package=other;end" },
  ]) {
    for (const userAgent of [ios, android]) {
      const browser = run({ userAgent, ...options });
      assert.deepEqual(browser.destinations, []);
      assert.equal(browser.listenerCount(), 0);
    }
  }
});

test("mobile app returns and history traversals cannot open the app again", () => {
  for (const userAgent of [ios, android]) {
    const share = "https://deulli.com/share/shorts/7";
    const previous = "https://example.com/message";
    const browser = run({ userAgent, history: [previous, share] });
    // A restored bfcache document keeps the original single-attempt guard.
    browser.dispatch("visibilitychange");
    browser.dispatch("pageshow");
    browser.frame();
    assert.deepEqual(browser.destinations, [app]);
    // Without the bfcache, history traversal creates a new document instead.
    const restored = run({
      userAgent,
      navigationType: "back_forward",
      history: [previous, share],
    });
    restored.dispatch("visibilitychange");
    restored.dispatch("prerenderingchange");
    assert.deepEqual(restored.destinations, []);
    assert.deepEqual(restored.history, [previous, share]);
    assert.equal(restored.listenerCount(), 0);
  }
});

test("missing Navigation Timing support does not disable mobile routing", () => {
  assert.deepEqual(
    run({ userAgent: ios, hasNavigationTiming: false }).destinations,
    [app],
  );
});

test("error pages and missing store destinations never navigate", () => {
  for (const options of [{ hasLinks: false }, { stores: {} }]) {
    const browser = run({ userAgent: android, ...options });
    browser.dispatch("visibilitychange");
    assert.deepEqual(browser.destinations, []);
    assert.equal(browser.listenerCount(), 0);
  }
});
