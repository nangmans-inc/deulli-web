import { runInNewContext } from "node:vm";

export function runShareRedirect(
  code,
  {
    userAgent = "",
    platform = "",
    maxTouchPoints = 0,
    visibilityState = "visible",
    readyState = "complete",
    prerendering = false,
    stores = {},
    appUrl = "deulli://app/episode/7",
    hasAppLink = true,
    hasLinks = true,
    blockNavigation = false,
    navigationType = "navigate",
    hasNavigationTiming = true,
    history = ["https://deulli.com/share/episode/7"],
  } = {},
) {
  const destinations = [];
  const entries = [...history];
  const frames = [];
  const listeners = new Map();
  const addListener = (type, listener) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(listener);
  };
  const removeListener = (type, listener) =>
    listeners.get(type)?.delete(listener);
  const appLink = { href: appUrl };
  const links = {
    dataset: {
      appUrl,
      appStore: stores.appStore,
      googlePlay: stores.googlePlay,
    },
    querySelector: (selector) =>
      hasAppLink && selector === "[data-open-app]" ? appLink : null,
  };
  const document = {
    visibilityState,
    readyState,
    prerendering,
    querySelector: (selector) =>
      hasLinks && selector === "[data-share-redirect]" ? links : null,
    addEventListener: addListener,
    removeEventListener: removeListener,
  };
  runInNewContext(code, {
    document,
    navigator: { userAgent, platform, maxTouchPoints },
    window: {
      addEventListener: document.addEventListener,
      removeEventListener: document.removeEventListener,
      requestAnimationFrame: (callback) => frames.push(callback),
      performance: hasNavigationTiming
        ? { getEntriesByType: () => [{ type: navigationType }] }
        : undefined,
      location: {
        assign: (destination) => {
          destinations.push(destination);
          if (blockNavigation) throw new Error("Navigation blocked");
          entries.push(destination);
        },
        replace: (destination) => {
          destinations.push(destination);
          if (blockNavigation) throw new Error("Navigation blocked");
          entries[entries.length - 1] = destination;
        },
      },
    },
  });
  return {
    destinations,
    appLink,
    history: entries,
    back: () => {
      if (entries.length > 1) entries.pop();
      return entries.at(-1);
    },
    document,
    frame: () => {
      for (const callback of frames.splice(0)) callback();
    },
    dispatch: (type) => {
      for (const listener of listeners.get(type) ?? []) listener();
    },
    listenerCount: () =>
      [...listeners.values()].reduce((count, values) => count + values.size, 0),
  };
}

export function shareRedirectFromHtml(html) {
  const code = html.match(
    /<script\b[^>]*\bdata-share-redirect-script[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  const nav = html.match(/<nav\b[^>]*\bdata-share-redirect\s[^>]*>/)?.[0];
  if (!code || !nav) throw new Error("Missing share redirect script or links");
  const attribute = (name) =>
    nav.match(new RegExp(`data-${name}="([^"]+)"`))?.[1].replace(/&amp;/g, "&");
  return {
    code,
    appUrl: attribute("app-url"),
    stores: {
      appStore: attribute("app-store"),
      googlePlay: attribute("google-play"),
    },
  };
}
