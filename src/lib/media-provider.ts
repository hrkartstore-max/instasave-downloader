import "server-only";
import { z } from "zod";

const providerItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]).optional(),
  mimeType: z.string().optional(),
  filename: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(2000).optional(),
});

const providerResponseSchema = z.object({
  success: z.literal(true),
  items: z.array(providerItemSchema).min(1).max(20),
});

function providerHosts() {
  return (process.env.MEDIA_PROVIDER_MEDIA_HOSTS || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
}

export function isApprovedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    const allowed = providerHosts().some(item => host === item);
    const instagramCdn = host.endsWith(".cdninstagram.com") || host === "cdninstagram.com" || host.endsWith(".fbcdn.net");
    return allowed || instagramCdn;
  } catch { return false; }
}

export async function getProviderPreview(instagramUrl: string) {
  const endpoint = process.env.MEDIA_PROVIDER_URL;
  const token = process.env.MEDIA_PROVIDER_TOKEN;
  if (!endpoint || !token) return null;
  const target = new URL(endpoint);
  if (target.protocol !== "https:") throw new Error("Provider endpoint must use HTTPS.");
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: instagramUrl }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Media provider returned HTTP ${response.status}.`);
  const parsed = providerResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Provider response does not match the InstaSave adapter contract.");
  const items = parsed.data.items.filter(item => isApprovedMediaUrl(item.url));
  if (!items.length) throw new Error("Provider returned no media URLs from an approved media host.");
  return items.map((item, index) => ({
    id: item.id || `provider-${index}`,
    source: "provider" as const,
    mediaType: item.mediaType || "VIDEO",
    mimeType: item.mimeType || "application/octet-stream",
    filename: item.filename || `instasave-${index + 1}`,
    url: item.url,
    thumbnailUrl: item.thumbnailUrl && isApprovedMediaUrl(item.thumbnailUrl) ? item.thumbnailUrl : undefined,
    caption: item.caption,
  }));
}
