export type ShareKind = "episode" | "shorts" | "channel" | "series";

export const SHARE_LABELS: Record<ShareKind, string> = {
  episode: "에피소드",
  shorts: "쇼츠",
  channel: "채널",
  series: "시리즈",
};

export interface ShareMetadata {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  podcastName?: string;
}

export type MetadataResult =
  | { status: "ok"; metadata: ShareMetadata }
  | { status: "missing" | "unavailable" };

export const DEFAULT_API_BASE = "https://api.deulli.nangmans.com";
export const SHARE_ORIGIN = "https://deulli.com";
// Anonymous production GET /podcasts/105948, verified 2026-10-25.
export const IMAGE_HOSTS = new Set(["d19hzt4ehho5l3.cloudfront.net"]);
const NO_STORE = "no-store";
const IMAGE_CACHE_CONTROL = "public, max-age=60, s-maxage=300";
const PAGE_CACHE_CONTROL = "public, max-age=0, s-maxage=60";
const MAX_METADATA_BYTES = 128 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_BYTES = 16 * 1024 * 1024;
const CACHE_MAX_ENTRIES = 32;

export function isShareKind(value: unknown): value is ShareKind {
  return (
    value === "episode" ||
    value === "shorts" ||
    value === "channel" ||
    value === "series"
  );
}

export function isPositiveId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[1-9]\d{0,15}$/.test(value) &&
    Number.isSafeInteger(Number(value))
  );
}

export function shareUrls(kind: ShareKind, id: string) {
  return {
    canonical: `${SHARE_ORIGIN}/share/${kind}/${id}`,
    image: `${SHARE_ORIGIN}/share/og/${kind}/${id}`,
    app: `deulli://app/${kind}/${id}`,
  };
}

export function trustedImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      IMAGE_HOSTS.has(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function text(value: string, max: number): string {
  return value
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function parseMetadata(
  kind: ShareKind,
  id: string,
  data: unknown,
): ShareMetadata | null {
  if (!record(data) || data.id !== Number(id)) {
    return null;
  }
  if (kind === "channel" || kind === "series") {
    const title = kind === "channel" ? data.name : data.title;
    if (
      typeof title !== "string" ||
      !title.trim() ||
      !nullableString(data.description) ||
      !nullableString(data.cover_url)
    ) {
      return null;
    }
    return {
      title: text(title, 240),
      description:
        text(data.description ?? "", 400) ||
        `들리에서 이 ${SHARE_LABELS[kind]}의 이야기를 듣고 영어를 공부해 보세요.`,
      thumbnailUrl: data.cover_url,
    };
  }
  if (!nullableString(data.thumbnail_url)) return null;
  if (kind === "episode") {
    if (
      typeof data.name !== "string" ||
      !data.name.trim() ||
      !nullableString(data.description)
    ) {
      return null;
    }
    return {
      title: text(data.name, 240),
      description:
        text(data.description ?? "", 400) ||
        "들리에서 이 에피소드를 듣고 영어를 공부해 보세요.",
      thumbnailUrl: data.thumbnail_url,
    };
  }
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    !nullableString(data.summary) ||
    !Number.isSafeInteger(data.podcast_id) ||
    Number(data.podcast_id) <= 0 ||
    typeof data.podcast_name !== "string" ||
    !data.podcast_name.trim()
  ) {
    return null;
  }
  return {
    title: text(data.title, 240),
    description:
      text(data.summary ?? "", 400) ||
      "들리에서 이 쇼츠를 듣고 영어를 공부해 보세요.",
    thumbnailUrl: data.thumbnail_url,
    podcastName: text(data.podcast_name, 240),
  };
}

async function readBounded(
  response: Response,
  limit: number,
  controller: AbortController,
) {
  controller.signal.throwIfAborted();
  const length = response.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) {
    controller.abort();
    throw new Error("Response body too large");
  }
  if (!response.body) throw new Error("Missing response body");
  const reader = response.body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  controller.signal.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        controller.abort();
        throw new Error("Response body too large");
      }
      chunks.push(value);
    }
  } finally {
    controller.signal.removeEventListener("abort", cancel);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

interface ServiceOptions {
  apiBase?: string;
  fetch?: typeof fetch;
  fallbackImage: Uint8Array;
  now?: () => number;
  timeoutMs?: number;
}

interface CachedImage {
  bytes: Uint8Array;
  type: string;
  expires: number;
  identity: string;
}

function imageContentType(
  bytes: Uint8Array,
  contentType: string,
): string | null {
  const type = contentType.split(";")[0].trim().toLowerCase();
  const starts = (...values: number[]) =>
    values.every((value, index) => bytes[index] === value);
  if (type === "image/png" && starts(137, 80, 78, 71, 13, 10, 26, 10))
    return type;
  if (type === "image/jpeg" && starts(255, 216, 255)) return type;
  if (
    type === "image/gif" &&
    /^GIF8[79]a/.test(new TextDecoder().decode(bytes.slice(0, 6)))
  )
    return type;
  if (
    type === "image/webp" &&
    starts(82, 73, 70, 70) &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return type;
  return null;
}

export function createShareService(options: ServiceOptions) {
  const fetcher = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const cache = new Map<string, CachedImage>();
  const timeoutMs = options.timeoutMs ?? 5000;

  async function request(url: string, limit: number, accept: string) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(url, {
            method: "GET",
            redirect: "manual",
            credentials: "omit",
            cache: "no-store",
            headers: { Accept: accept },
            signal: controller.signal,
          });
          // Do not follow redirects, even to another allowed host.
          if (!response.ok) {
            void response.body?.cancel().catch(() => {});
            return { response, bytes: new Uint8Array() };
          }
          const bytes = await readBounded(response, limit, controller);
          return { response, bytes };
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Upstream timeout"));
          }, timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function metadata(
    kind: ShareKind,
    id: string,
  ): Promise<MetadataResult> {
    if (!isShareKind(kind) || !isPositiveId(id)) return { status: "missing" };
    try {
      const base = new URL(options.apiBase ?? DEFAULT_API_BASE);
      if (
        base.username ||
        base.password ||
        base.search ||
        base.hash ||
        (base.protocol !== "https:" &&
          !(
            base.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
          ))
      ) {
        return { status: "unavailable" };
      }
      const paths: Record<ShareKind, string> = {
        episode: `podcasts/${id}`,
        shorts: `shorts/${id}/share`,
        channel: `channels/${id}/share`,
        series: `series/${id}/share`,
      };
      const path = paths[kind];
      const url = `${base.href.replace(/\/$/, "")}/${path}`;
      const { response, bytes } = await request(
        url,
        MAX_METADATA_BYTES,
        "application/json",
      );
      if ([401, 403, 404, 410].includes(response.status))
        return { status: "missing" };
      if (
        !response.ok ||
        response.redirected ||
        response.headers.get("content-type")?.split(";")[0].trim() !==
          "application/json"
      ) {
        return { status: "unavailable" };
      }
      const parsed = parseMetadata(
        kind,
        id,
        JSON.parse(new TextDecoder().decode(bytes)),
      );
      return parsed
        ? { status: "ok", metadata: parsed }
        : { status: "unavailable" };
    } catch {
      // Never log the response or URL: they may contain signed credentials.
      return { status: "unavailable" };
    }
  }

  function imageResponse(
    bytes: Uint8Array,
    type: string,
    cacheControl: string,
    status = 200,
  ) {
    return new Response(new Uint8Array(bytes), {
      status,
      headers: {
        "Content-Type": type,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
        ...(status === 503 ? { "Retry-After": "30" } : {}),
      },
    });
  }

  function pruneCache() {
    for (const [key, value] of cache) {
      if (value.expires <= now()) cache.delete(key);
    }
    let size = [...cache.values()].reduce(
      (total, value) => total + value.bytes.byteLength,
      0,
    );
    for (const [key, value] of cache) {
      if (cache.size <= CACHE_MAX_ENTRIES && size <= CACHE_MAX_BYTES) break;
      cache.delete(key);
      size -= value.bytes.byteLength;
    }
  }

  async function image(kind: ShareKind, id: string): Promise<Response> {
    const key = `${kind}/${id}`;
    pruneCache();
    const result = await metadata(kind, id);
    if (result.status !== "ok") {
      cache.delete(key);
      return imageResponse(
        options.fallbackImage,
        "image/png",
        NO_STORE,
        result.status === "missing" ? 404 : 503,
      );
    }
    const thumbnail = result.metadata.thumbnailUrl;
    if (!thumbnail) {
      cache.delete(key);
      return imageResponse(
        options.fallbackImage,
        "image/png",
        IMAGE_CACHE_CONTROL,
      );
    }
    const url = trustedImageUrl(thumbnail);
    if (!url) {
      cache.delete(key);
      return imageResponse(options.fallbackImage, "image/png", NO_STORE);
    }
    // Ignore rotating signatures, but never reuse bytes for a different image path.
    const identity = `${url.origin}${url.pathname}`;
    try {
      const { response, bytes } = await request(
        url.href,
        MAX_IMAGE_BYTES,
        "image/png,image/jpeg,image/webp,image/gif",
      );
      const type = imageContentType(
        bytes,
        response.headers.get("content-type") ?? "",
      );
      if (!response.ok || response.redirected || !type)
        throw new Error("Invalid image response");
      cache.delete(key);
      cache.set(key, { bytes, type, expires: now() + CACHE_TTL_MS, identity });
      pruneCache();
      return imageResponse(bytes, type, IMAGE_CACHE_CONTROL);
    } catch {
      const cached = cache.get(key);
      if (cached && cached.expires > now() && cached.identity === identity) {
        return imageResponse(cached.bytes, cached.type, NO_STORE);
      }
      cache.delete(key);
      return imageResponse(options.fallbackImage, "image/png", NO_STORE);
    }
  }

  return { metadata, image };
}

export async function sharePage(
  service: Pick<ReturnType<typeof createShareService>, "metadata">,
  kind: unknown,
  id: unknown,
) {
  const result =
    isShareKind(kind) && isPositiveId(id)
      ? await service.metadata(kind, id)
      : { status: "missing" as const };
  if (result.status === "ok" && isShareKind(kind) && isPositiveId(id)) {
    return {
      status: 200,
      cacheControl: PAGE_CACHE_CONTROL,
      title: `${result.metadata.title} | 들리`,
      description: result.metadata.description,
      metadata: result.metadata,
      urls: shareUrls(kind, id),
    };
  }
  const content =
    kind === "channel"
      ? { object: "채널을", subject: "채널이에요" }
      : kind === "series"
        ? { object: "시리즈를", subject: "시리즈예요" }
        : { object: "콘텐츠를", subject: "콘텐츠예요" };
  return {
    status: result.status === "missing" ? 404 : 503,
    cacheControl: NO_STORE,
    title:
      result.status === "missing"
        ? `공유한 ${content.object} 찾을 수 없어요 | 들리`
        : "잠시 후 다시 열어 주세요 | 들리",
    description:
      result.status === "missing"
        ? `삭제되었거나 공개되지 않은 ${content.subject}. 들리에서 다른 이야기를 만나 보세요.`
        : `지금은 ${content.object} 불러올 수 없어요. 잠시 후 다시 시도해 주세요.`,
    metadata: null,
    urls: null,
  };
}
