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
  const store = isIOS
    ? links.dataset.appStore
    : /Android/i.test(userAgent)
      ? links.dataset.googlePlay
      : null;
  if (!store) return;

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
      window.location.replace(store);
    } catch {
      // Manual links remain available if the browser blocks navigation.
    }
  };
  document.addEventListener("visibilitychange", redirect);
  document.addEventListener("prerenderingchange", redirect);
  redirect();
})();
