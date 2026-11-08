import { z } from "zod";

export const instagramUrlSchema = z.string().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["instagram.com", "www.instagram.com"].includes(url.hostname) && /^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  } catch { return false; }
});

export const directMediaUrlSchema = z.string().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    const allowed = (process.env.ALLOWED_MEDIA_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    return url.protocol === "https:" && allowed.length > 0 && allowed.includes(url.hostname.toLowerCase());
  } catch { return false; }
});

export function getMediaCapabilities() {
  return {
    localUpload: true,
    instagramOAuth: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    authorizedProvider: Boolean(process.env.MEDIA_PROVIDER_URL && process.env.MEDIA_PROVIDER_TOKEN),
    directMediaHosts: (process.env.ALLOWED_MEDIA_HOSTS || "").split(",").map((host) => host.trim()).filter(Boolean),
    instagramTypes: ["reel", "post", "video", "carousel"],
  };
}
