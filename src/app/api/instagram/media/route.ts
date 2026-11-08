import { NextResponse } from "next/server";
import { getInstagramToken, metaGet } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function GET() {
  const token = await getInstagramToken();
  if (!token) return NextResponse.json({ error: "Connect an eligible Instagram professional account first." }, { status: 401 });
  try {
    const data = await metaGet("me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=50", token);
    const items = Array.isArray(data.data) ? data.data.filter((item: any) =>
      typeof item.media_url === "string" && typeof item.permalink === "string"
    ).map((item: any) => ({
      id: String(item.id),
      mediaType: String(item.media_type || "UNKNOWN"),
      mediaUrl: String(item.media_url),
      permalink: String(item.permalink),
      thumbnailUrl: typeof item.thumbnail_url === "string" ? item.thumbnail_url : undefined,
      caption: typeof item.caption === "string" ? item.caption : undefined,
      timestamp: typeof item.timestamp === "string" ? item.timestamp : undefined,
      source: "meta",
    })) : [];
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not retrieve connected account media." }, { status: 502 });
  }
}
