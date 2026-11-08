import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { instagramUrlSchema } from "@/lib/media";
const schema = z.object({ url: z.string().max(2048) });
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ valid: false, error: "A valid URL is required." }, { status: 400 });
    const valid = instagramUrlSchema.safeParse(parsed.data.url).success;
    const path = valid ? new URL(parsed.data.url).pathname : "";
    const mediaType = !valid ? "unsupported" : /^\/(reel|reels)\//.test(path) ? "reel" : /^\/tv\//.test(path) ? "video" : "post";
    return NextResponse.json({ valid, mediaType, supportedFormats: valid ? ["image", "video", "carousel"] : [], previewAvailable: false, reason: valid ? "URL format accepted. Actual media retrieval requires an authorized provider or eligible Meta account integration." : "Enter a complete Instagram Reel, post or video URL, including its media code." });
  } catch { return NextResponse.json({ valid: false, error: "Invalid request." }, { status: 400 }); }
}
