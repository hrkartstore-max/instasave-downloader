import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInstagramToken } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function GET() {
  const token = await getInstagramToken();
  const jar = await cookies();
  let profile: { username?: string; accountType?: string } | null = null;
  try {
    const raw = jar.get("instasave_ig_profile")?.value;
    if (raw) profile = JSON.parse(raw);
  } catch { profile = null; }
  return NextResponse.json({ connected: Boolean(token), profile: token ? profile : null });
}
