// Preloaded only by the HTTP harness, including its Astro child process.
export const signedImage = new Uint8Array([255, 216, 255, 224, 0, 0]);
export const imageHost = "d19hzt4ehho5l3.cloudfront.net";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname === imageHost) {
    if (
      !/^\/share-fixture\/(?:channel|series)\.jpg$/.test(url.pathname) ||
      !url.searchParams.get("Signature")
    ) {
      throw new Error("Unexpected image fixture request");
    }
    return new Response(signedImage, {
      headers: { "Content-Type": "image/jpeg" },
    });
  }
  return originalFetch(input, init);
};
