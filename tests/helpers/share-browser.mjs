import { runInNewContext } from "node:vm";

export function runShareRedirect(
  code,
  {
    userAgent = "",
    platform = "",
    maxTouchPoints = 0,
    visibilityState = "visible",
    prerendering = false,
    stores = {},
    hasLinks = true,
    blockNavigation = false,
  } = {},
) {
  const destinations = [];
  const listeners = new Map();
  const document = {
    visibilityState,
    prerendering,
    querySelector: (selector) =>
      hasLinks && selector === "[data-share-redirect]"
        ? {
            dataset: {
              appStore: stores.appStore,
              googlePlay: stores.googlePlay,
            },
          }
        : null,
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener: (type, listener) =>
      listeners.get(type)?.delete(listener),
  };
  runInNewContext(code, {
    document,
    navigator: { userAgent, platform, maxTouchPoints },
    window: {
      location: {
        replace: (destination) => {
          destinations.push(destination);
          if (blockNavigation) throw new Error("Navigation blocked");
        },
      },
    },
  });
  return {
    destinations,
    document,
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
    stores: {
      appStore: attribute("app-store"),
      googlePlay: attribute("google-play"),
    },
  };
}
