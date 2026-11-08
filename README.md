# InstaSave

A Next.js 15 App Router application for saving media you own or are authorized to download.

## Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS, Framer Motion, Lucide React, Zod
- Vercel deployment target

## Run locally
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the site URL and a strong signing secret.
4. Run `npm run dev` and open http://localhost:3000.

## Media authorization
Instagram does not provide a general-purpose public endpoint for arbitrary post downloads. This app does not scrape sessions, request passwords/cookies, bypass private-account restrictions, evade rate limits, or defeat DRM. URL validation is not media authorization. Configure only a provider you are legally and contractually authorized to use. The current implementation supports local user-selected media and Instagram URL-format validation; it does not resolve arbitrary Instagram URLs to downloadable media.

## Environment
- `MEDIA_PROVIDER_URL`: reserved HTTPS endpoint for an authorized provider.
- `MEDIA_PROVIDER_TOKEN`: server-only token; never expose it in client code.
- `DOWNLOAD_SIGNING_SECRET`: long random secret.
- `NEXT_PUBLIC_SITE_URL`: canonical production origin.

Never commit `.env.local`, tokens, or secrets.

## Deploy to Vercel
Import this repository into Vercel, select `main` as the production branch, configure required environment variables, and deploy. Verify `/api/health` after deployment.

## Pages and endpoints
- `/`, `/about`, `/privacy`, `/terms`, `/contact`, `/how-to-use`
- `POST /api/validate`
- `GET /api/health`

Run `npm run typecheck` and `npm run build` before production release.
