import type { APIRoute } from "astro";
import { isPositiveId, isShareKind } from "../../../../lib/share";
import { shareService } from "../../../../lib/share-service";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  if (!isShareKind(params.kind) || !isPositiveId(params.id)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return shareService.image(params.kind, params.id);
};
