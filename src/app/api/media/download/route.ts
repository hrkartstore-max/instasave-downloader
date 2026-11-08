import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isApprovedMediaUrl } from "@/lib/media-provider";
import { getInstagramToken, metaGet } from "@/lib/instagram-auth";

export const runtime = "nodejs";

const requestSchema = z.object({
  source: z.enum(["meta", "provider"]),
  url: z.string().url().max(4096),
  filename: z.string().max(120).optional(),
});

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "instasave-media";
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
  const { source, url, filename } = parsed.data;

  if (!isApprovedMediaUrl(url)) return NextResponse.json({ error: "Media URL host is not on the approved CDN allowlist." }, { status: 403 });

  if (source === "meta") {
    const token = await getInstagramToken();
    if (!token) return NextResponse.json({ error: "Connect your Instagram account before downloading its media." }, { status: 401 });
    try {
      const data = await metaGet("me/media?fields=id,media_url&limit=100", token);
      const owned = Array.isArray(data.data) && data.data.some((item: any) => item.media_url === url);
      if (!owned) return NextResponse.json({ error: "This media URL is not present in the connected account's accessible media list." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Could not verify this media against your connected Instagram account." }, { status: 502 });
    }
  } else if (!process.env.MEDIA_PROVIDER_URL || !process.env.MEDIA_PROVIDER_TOKEN) {
    return NextResponse.json({ error: "The vetted media provider is not configured." }, { status: 503 });
  }

  try {
    const upstream = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
    if (!upstream.ok) return NextResponse.json({ error: "The media host could not serve this file." }, { status: 502 });
    const mime = (upstream.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(mime)) {
      return NextResponse.json({ error: "The media host returned an unsupported file type." }, { status: 415 });
    }
    const declaredSize = Number(upstream.headers.get("content-length") || "0");
    if (declaredSize > 100 * 1024 * 1024) return NextResponse.json({ error: "Files larger than 100 MB are not supported." }, { status: 413 });
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > 100 * 1024 * 1024) return NextResponse.json({ error: "Files larger than 100 MB are not supported." }, { status: 413 });
    const extension = mime === "video/mp4" ? "mp4" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${safeFilename(filename || `instasave-media.${extension}`)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed. The media host may have expired the URL or blocked the request." }, { status: 502 });
  }
}
