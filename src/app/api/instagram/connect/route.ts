import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getInstagramAuthorizationUrl, saveOAuthState } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET || !process.env.META_REDIRECT_URI || !process.env.IG_TOKEN_ENCRYPTION_KEY) {
      return NextResponse.redirect(new URL("/?instagram=not-configured", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
    }
    const state = randomBytes(32).toString("hex");
    await saveOAuthState(state);
    return NextResponse.redirect(getInstagramAuthorizationUrl(state));
  } catch {
    return NextResponse.redirect(new URL("/?instagram=connect-error", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }
}
