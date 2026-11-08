import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "instasave_ig_token";
const STATE_COOKIE = "instasave_ig_state";
const VERSION = "v26.0";

function secretKey() {
  const secret = process.env.IG_TOKEN_ENCRYPTION_KEY || process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) throw new Error("IG_TOKEN_ENCRYPTION_KEY must be configured.");
  return createHash("sha256").update(secret).digest();
}

function redirectUri() {
  const value = process.env.META_REDIRECT_URI;
  if (!value) throw new Error("META_REDIRECT_URI must be configured.");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("OAuth redirect URI must use HTTPS.");
  return url.toString();
}

export function metaGraphVersion() {
  return (process.env.META_GRAPH_API_VERSION || VERSION).replace(/[^v0-9.]/g, "");
}

export function getInstagramAuthorizationUrl(state: string) {
  const clientId = process.env.META_APP_ID;
  if (!clientId) throw new Error("META_APP_ID is missing.");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", process.env.META_INSTAGRAM_SCOPES || "instagram_business_basic");
  url.searchParams.set("state", state);
  return url.toString();
}

export function getRedirectUri() { return redirectUri(); }

export function sealToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function openToken(value: string) {
  const packed = Buffer.from(value, "base64url");
  if (packed.length < 29) throw new Error("Invalid token payload.");
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8");
}

export async function saveInstagramToken(token: string, maxAge: number) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, sealToken(token), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: Math.min(Math.max(maxAge, 60), 60 * 60 * 24 * 55),
  });
}

export async function getInstagramToken() {
  const jar = await cookies();
  const value = jar.get(TOKEN_COOKIE)?.value;
  if (!value) return null;
  try { return openToken(value); } catch { jar.delete(TOKEN_COOKIE); return null; }
}

export async function clearInstagramToken() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
}

export async function saveOAuthState(state: string) {
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 600,
  });
}

export async function consumeOAuthState(received: string) {
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value || "";
  jar.delete(STATE_COOKIE);
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export async function metaGet(path: string, token: string) {
  const url = new URL(`https://graph.instagram.com/${metaGraphVersion()}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "Meta API request failed.";
    throw new Error(message);
  }
  return data;
}

export async function exchangeInstagramCode(code: string) {
  const form = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    client_secret: process.env.META_APP_SECRET || "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code,
  });
  const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form, cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  const shortData = await shortResponse.json().catch(() => ({}));
  if (!shortResponse.ok || typeof shortData.access_token !== "string") throw new Error("Instagram authorization-code exchange failed.");

  const longUrl = new URL("https://graph.instagram.com/access_token");
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", process.env.META_APP_SECRET || "");
  longUrl.searchParams.set("access_token", shortData.access_token);
  const longResponse = await fetch(longUrl, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  const longData = await longResponse.json().catch(() => ({}));
  if (!longResponse.ok || typeof longData.access_token !== "string") throw new Error("Could not exchange for a long-lived Instagram token.");
  return { accessToken: longData.access_token as string, expiresIn: Number(longData.expires_in || 5184000) };
}
