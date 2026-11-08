import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthState, exchangeInstagramCode, metaGet, saveInstagramToken } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") || "";
  if (error || !code || !(await consumeOAuthState(state))) {
    return NextResponse.redirect(new URL("/?instagram=authorization-failed", site));
  }
  try {
    const { accessToken, expiresIn } = await exchangeInstagramCode(code);
    const profile = await metaGet("me?fields=user_id,username,account_type", accessToken);
    await saveInstagramToken(accessToken, expiresIn);
    const response = NextResponse.redirect(new URL("/?instagram=connected", site));
    response.cookies.set("instasave_ig_profile", JSON.stringify({
      userId: String(profile.user_id || ""),
      username: String(profile.username || ""),
      accountType: String(profile.account_type || ""),
    }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: Math.min(expiresIn, 60 * 60 * 24 * 55),
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?instagram=authorization-failed", site));
  }
}
