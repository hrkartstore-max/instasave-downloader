import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearInstagramToken } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearInstagramToken();
  const jar = await cookies();
  jar.delete("instasave_ig_profile");
  return NextResponse.json({ disconnected: true });
}
