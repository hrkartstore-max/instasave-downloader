# InstaSave — Hybrid Media Utility

A Next.js 15 application for saving media users own or are authorized to download. The hybrid architecture supports local uploads, eligible Meta account integrations, exact-host allowlisted direct media sources, and optional vetted provider adapters.

## Stack
- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS, Zod, Lucide React
- Vercel deployment target

## Run locally
1. Use Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure only integrations you control or are authorized to use.
4. Run `npm run dev`.

## Hybrid source paths
1. **Local upload:** browser-side file selection/download for user-owned MP4, JPG, PNG and WebP files (100 MB UI limit).
2. **Meta account integration:** future OAuth integration for eligible professional accounts and media exposed by Meta's official APIs. Add the app ID/secret and implement review, scopes, token storage, refresh, and account consent before enabling it.
3. **Direct media URL:** accepts HTTPS URLs only when their exact hostname is in `ALLOWED_MEDIA_HOSTS`. The preview route does not fetch URLs. A trusted storage/provider adapter must be added before preview/download.
4. **Vetted provider adapter:** optional server-side integration for a provider whose rights, terms, API and media permissions have been reviewed. Provider credentials must never reach the browser.
5. **oEmbed:** can be added for post embedding where permitted; it is not a media-file download API.

## Current API
- `GET /api/health` — health status.
- `POST /api/validate` — validates Instagram URL shape and media category.
- `POST /api/media/preview` — validates Instagram/direct source intent and reports capability; does not retrieve media yet.
- `POST /api/media/download` — deliberately fails closed with HTTP 501 until a provider/storage adapter is implemented.

## Security guarantees and limits
- No Instagram passwords, cookies, session scraping, private-account bypass, DRM circumvention or rate-limit evasion.
- No arbitrary server-side URL fetching. Direct URL validation uses exact HTTPS host allowlisting only; DNS/IP and redirect-safe fetching must be implemented if a future adapter fetches remote URLs.
- No media preview/download is claimed until the relevant provider adapter is implemented and tested.
- Local upload UI currently operates in the browser and does not upload files to the server.
- Do not commit `.env.local`, tokens, signing secrets or personal account data.

## Environment variables
See `.env.example`. Meta credentials alone do not enable API access; OAuth, approved permissions, secure token storage and supported API workflows must be implemented. Likewise, provider credentials alone do not enable remote downloads until a provider-specific adapter exists.

## Verification
Run `npm run typecheck` and `npm run build` before production release. Then test URL validation, local files, API error paths, host allowlisting, OAuth consent and provider-specific media rights. No production build or live provider integration is claimed by this source update.

## Deployment
Import `hrkartstore-max/instasave-downloader` into Vercel, use `main` as the production branch, configure environment variables, and verify `/api/health` after deployment.
