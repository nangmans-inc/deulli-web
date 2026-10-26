(() => {
  const links = document.querySelector("[data-share-redirect]");
  if (!links) return;

  const userAgent = navigator.userAgent || "";
  if (
    /bot|crawl|spider|scrap|slurp|facebookexternalhit|facebot|meta-external|whatsapp|kakaostory-og-reader|embedly|iframely|vkshare|bingpreview|googleother|google-inspectiontool|google-read-aloud|mediapartners-google|preview|headlesschrome/i.test(
      userAgent,
    )
  ) {
    return;
  }

  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = !isIOS && /Android/i.test(userAgent);
  const store = isIOS
    ? links.dataset.appStore
    : isAndroid
      ? links.dataset.googlePlay
      : null;
  if (!store) return;

  const app = links.dataset.appUrl;
  const openApp = links.querySelector("[data-open-app]");
  if (
    !openApp ||
    !/^deulli:\/\/app\/(episode|shorts|channel|series)\/[1-9]\d*$/.test(
      app || "",
    )
  ) {
    return;
  }
  if (isAndroid) {
    // Store fallback belongs to an explicit tap, not a blocked automatic launch.
    openApp.href = `intent:${app.slice("deulli:".length)}#Intent;scheme=deulli;package=com.deulli.app;S.browser_fallback_url=${encodeURIComponent(store)};end`;
  }

  // A history return must leave the fallback usable even without the bfcache.
  if (
    window.performance?.getEntriesByType?.("navigation")[0]?.type ===
    "back_forward"
  ) {
    return;
  }

  let attempted = false;
  const redirect = () => {
    if (
      attempted ||
      document.visibilityState !== "visible" ||
      document.prerendering
    ) {
      return;
    }
    attempted = true;
    document.removeEventListener("visibilitychange", redirect);
    document.removeEventListener("prerenderingchange", redirect);
    try {
      window.location.assign(app);
    } catch {
      // Manual links remain available if the browser blocks navigation.
    }
  };
  document.addEventListener("visibilitychange", redirect);
  document.addEventListener("prerenderingchange", redirect);
  redirect();
})();
