# tinydesktop.me

Abdullah Siddiqui's personal site: one page that can be read in ink or, with one button, pixelated.

## Run it

```sh
npm install
npm run dev       # http://localhost:4330
npm run verify    # types, lint, unit tests, build + size budget, browser tests
```

Node 22.23.4 or newer.

## Where things live

- Copy and data: `src/content/`. Editing the site's text means editing only these files.
- Colours and type: `src/styles/tokens.css`, one block per skin (ink, pixel); its PIXEL RULE comment sets pixel mode's palette and type roles.
- Section order: `src/pages/index.astro`.
- How the pieces fit together: [ARCHITECTURE.md](ARCHITECTURE.md).

## Assets

- `assets-src/` holds the editable artwork and references. It is not shipped.
- `src/assets/` holds the photos the site imports; Astro resizes them at build time.
- `public/map/` holds the PMTiles for Lahore and Islamabad, regenerated with `scripts/extract-city-tiles.sh`.

## Deploy

Static output in `dist/`, served by Cloudflare Pages. `public/_headers` sets caching and the content security policy.

The contact card posts to a Cloudflare Pages Function, `functions/api/contact.ts`, which checks Cloudflare Turnstile
and sends the card through Brevo. Set these in the Pages project (`.env.example` lists them with Turnstile's test keys):

- `TURNSTILE_SITE_KEY`: read at build time. Without it the card says the postbox is closed and points to email.
- `TURNSTILE_SECRET_KEY`, `BREVO_API_KEY`, `CONTACT_RECIPIENT`, `CONTACT_SENDER`: read by the function.
