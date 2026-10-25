import fallbackImage from "../../public/og-image.png?inline";
import { createShareService } from "./share";

// Bundle local bytes into the server: fallback must not fetch its own public URL.
export const shareService = createShareService({
  apiBase: process.env.API_BASE ?? import.meta.env.API_BASE,
  fallbackImage: new Uint8Array(
    Buffer.from(fallbackImage.split(",")[1], "base64"),
  ),
});
