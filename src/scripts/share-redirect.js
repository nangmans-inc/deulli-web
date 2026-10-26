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
  if (isAndroid) {
    const openApp = links.querySelector("[data-open-app]");
    if (
      !openApp ||
      !/^deulli:\/\/app\/(episode|shorts|channel|series)\/[1-9]\d*$/.test(
        app || "",
      )
    ) {
      return;
    }
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
  let ready = isAndroid || document.readyState === "complete";
  const redirect = () => {
    if (
      attempted ||
      !ready ||
      document.visibilityState !== "visible" ||
      document.prerendering
    ) {
      return;
    }
    attempted = true;
    document.removeEventListener("visibilitychange", redirect);
    document.removeEventListener("prerenderingchange", redirect);
    window.removeEventListener("pageshow", onPageShow);
    try {
      window.location.assign(isAndroid ? app : store);
    } catch {
      // Manual links remain available if the browser blocks navigation.
    }
  };
  const onPageShow = () => {
    window.removeEventListener("pageshow", onPageShow);
    // Let the load task finish so assign() adds an entry instead of replacing it.
    window.requestAnimationFrame(() => {
      ready = true;
      redirect();
    });
  };
  document.addEventListener("visibilitychange", redirect);
  document.addEventListener("prerenderingchange", redirect);
  window.addEventListener("pageshow", onPageShow);
  redirect();
})();
