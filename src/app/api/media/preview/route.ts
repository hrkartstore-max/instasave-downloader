import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { instagramUrlSchema, directMediaUrlSchema } from "@/lib/media";
import { getInstagramToken, metaGet } from "@/lib/instagram-auth";
import { getProviderPreview } from "@/lib/media-provider";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("instagram"), url: z.string().max(2048) }),
  z.object({ source: z.literal("direct"), url: z.string().max(2048) }),
]);

function normalizeInstagramUrl(value: string) {
  const url = new URL(value);
  return url.origin + url.pathname.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid preview request." }, { status: 400 });

    if (parsed.data.source === "direct") {
      if (!directMediaUrlSchema.safeParse(parsed.data.url).success) {
        return NextResponse.json({ error: "Direct media URLs must use HTTPS and an exact hostname listed in ALLOWED_MEDIA_HOSTS." }, { status: 400 });
      }
      return NextResponse.json({ source: "direct", accepted: true, previewAvailable: false, message: "Direct URL accepted. Connect a provider adapter that returns approved media URLs to enable preview and download." });
    }

    const instagramUrl = parsed.data.url;
    if (!instagramUrlSchema.safeParse(instagramUrl).success) return NextResponse.json({ error: "Unsupported Instagram URL." }, { status: 400 });

    const token = await getInstagramToken();
    if (token) {
      try {
        const data = await metaGet("me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=100", token);
        const target = normalizeInstagramUrl(instagramUrl);
        const match = Array.isArray(data.data) ? data.data.find((item: any) =>
          typeof item.permalink === "string" && normalizeInstagramUrl(item.permalink) === target
        ) : null;
        if (match && typeof match.media_url === "string") {
          return NextResponse.json({
            source: "meta", accepted: true, previewAvailable: true,
            items: [{
              id: String(match.id), source: "meta", mediaType: String(match.media_type || "UNKNOWN"),
              mimeType: String(match.media_type || "").includes("VIDEO") ? "video/mp4" : "image/jpeg",
              filename: `instasave-${String(match.id)}`,
              url: match.media_url,
              thumbnailUrl: typeof match.thumbnail_url === "string" ? match.thumbnail_url : undefined,
              caption: typeof match.caption === "string" ? match.caption : undefined,
            }],
            message: "Media found in your connected Instagram professional account.",
          });
        }
      } catch {
        // Continue to the optional provider. The user-facing message below remains explicit.
      }
    }

    if (process.env.MEDIA_PROVIDER_URL && process.env.MEDIA_PROVIDER_TOKEN) {
      try {
        const items = await getProviderPreview(instagramUrl);
        if (items?.length) return NextResponse.json({
          source: "provider", accepted: true, previewAvailable: true, items,
          message: "Media returned by your configured provider. Confirm you have permission to save it.",
        });
      } catch (error) {
        return NextResponse.json({
          source: "provider", accepted: true, previewAvailable: false,
          message: error instanceof Error ? error.message : "Configured media provider could not process this link.",
        }, { status: 502 });
      }
    }

    return NextResponse.json({
      source: "instagram", accepted: true, previewAvailable: false,
      metaConnected: Boolean(token),
      providerConfigured: Boolean(process.env.MEDIA_PROVIDER_URL && process.env.MEDIA_PROVIDER_TOKEN),
      message: token
        ? "This link was not found in the connected account's accessible media. A configured provider may support it, or connect the account that owns the content."
        : "Connect the Instagram Business or Creator account that owns this media, or configure an approved provider. Meta's API cannot retrieve arbitrary public posts from an unconnected account.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to process preview request." }, { status: 400 });
  }
}
