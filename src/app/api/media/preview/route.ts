import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { directMediaUrlSchema, getMediaCapabilities, instagramUrlSchema } from "@/lib/media";

const schema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("instagram"), url: z.string() }),
  z.object({ source: z.literal("direct"), url: z.string() }),
]);

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid preview request." }, { status: 400 });
    const capabilities = getMediaCapabilities();
    if (parsed.data.source === "instagram") {
      if (!instagramUrlSchema.safeParse(parsed.data.url).success) return NextResponse.json({ error: "Unsupported Instagram URL." }, { status: 400 });
      return NextResponse.json({ source: "instagram", accepted: true, previewAvailable: false, mediaTypes: capabilities.instagramTypes, message: "Instagram URL is valid. A Meta-authorized account integration or a vetted provider is required to retrieve media metadata and files.", capabilities });
    }
    if (!directMediaUrlSchema.safeParse(parsed.data.url).success) return NextResponse.json({ error: "Direct media URLs must use HTTPS and a hostname explicitly listed in ALLOWED_MEDIA_HOSTS." }, { status: 400 });
    return NextResponse.json({ source: "direct", accepted: true, previewAvailable: false, message: "The URL is allowlisted. A trusted storage/provider adapter must be configured to inspect and serve this file. This endpoint does not fetch arbitrary URLs.", capabilities });
  } catch { return NextResponse.json({ error: "Unable to process preview request." }, { status: 400 }); }
}
