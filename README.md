# InstaSave — Hybrid Instagram Media Utility

A Next.js 15 application for media users own or are authorized to save. It includes an official Instagram Login integration for eligible professional accounts and a pluggable, server-side provider adapter. It does not bypass private accounts or use Instagram passwords/cookies.

## Stack
- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS, Zod, Lucide React
- Vercel deployment target

## Local setup
1. Use Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure Meta app credentials, redirect URI and `IG_TOKEN_ENCRYPTION_KEY`.
5. Run `npm run dev`.

## Official Meta Instagram Login
The OAuth flow uses:
- `GET /api/instagram/connect` — creates a one-time state cookie and redirects to Instagram authorization.
- `GET /api/instagram/callback` — validates state, exchanges the authorization code, requests a long-lived token and encrypts it into an HttpOnly cookie.
- `GET /api/instagram/status` — reports whether this browser has a connected account.
- `GET /api/instagram/media` — lists media exposed by the connected professional account.
- `POST /api/instagram/disconnect` — removes the local encrypted token cookie.

The configured default scope is `instagram_business_basic`. The app must be configured in Meta for Developers, the exact callback URL must be registered, and required access/App Review must be granted before accounts outside app roles can connect. This API is for eligible Instagram professional (Business/Creator) accounts. It does not provide universal access to arbitrary public posts or consumer accounts.

## Hybrid preview strategy
1. Validate the Instagram URL.
2. If an Instagram professional account is connected, search its accessible media list for the exact permalink.
3. If no matching owner media is available, call the optional configured provider adapter.
4. Return a clear unsupported message if neither source can serve the media.

### Provider adapter contract
Configure `MEDIA_PROVIDER_URL`, `MEDIA_PROVIDER_TOKEN` and exact comma-separated `MEDIA_PROVIDER_MEDIA_HOSTS`. The endpoint must accept a server-side POST request with JSON `{ "url": "<Instagram URL>" }` and a Bearer token. It must return:
```json
{
  "success": true,
  "items": [
    {
      "id": "provider-media-id",
      "url": "https://cdn.example.com/path/file.mp4",
      "mediaType": "VIDEO",
      "mimeType": "video/mp4",
      "filename": "clip.mp4",
      "thumbnailUrl": "https://cdn.example.com/path/thumb.jpg"
    }
  ]
}
```
Only HTTPS media URLs on the exact approved provider host list or supported Instagram CDN suffixes are accepted. Provider selection, rights, terms, API reliability and data handling must be reviewed before adding credentials. No third-party provider has been selected or credentialed in this repository yet.

## Download endpoint
- `POST /api/media/download` accepts `{ "source": "meta" | "provider", "url": "...", "filename": "..." }`.
- Meta downloads are checked against the connected account's accessible media list.
- Provider downloads require provider configuration and an approved media host.
- Redirects are rejected; only JPEG, PNG, WebP and MP4 are served; file size is capped at 100 MB.
- Never accept user-supplied arbitrary hosts or disable these checks.

## Important Meta limitation
Instagram oEmbed is an embedding feature, not a general media-download API. Do not use oEmbed metadata or embed HTML as a way to extract media files. Official Instagram APIs are scoped to eligible account and media permissions. See Meta's official Instagram API documentation and oEmbed policy.

## Security notes
- OAuth state is one-time and checked using constant-time comparison.
- Access tokens are encrypted with AES-256-GCM and stored in an HttpOnly, SameSite=Lax cookie.
- Keep all Meta/provider secrets server-side.
- No password collection, cookie scraping, private-account bypass, DRM circumvention or rate-limit evasion.
- Review production cookie/token storage, consent, data retention, rate limiting, provider contracts and App Review before public launch.

## Environment variables
See `.env.example`. Do not commit `.env.local`, access tokens or secrets.

## Verification
Run `npm run typecheck` and `npm run build`, then test OAuth with an eligible test account, callback state rejection, token expiry/revocation, owner-media matching, provider response validation, download host restrictions and file-size limits. A successful GitHub commit is not a successful build or live Meta/provider test.

## Deploy
Import `hrkartstore-max/instasave-downloader` into Vercel, use `main` as production branch, add the environment variables and register the deployed OAuth callback URL in Meta for Developers.
