// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

const fontsource = fontProviders.fontsource();

// Every face is self-hosted at build time. Ink mode uses the first three; pixel mode the last three,
// which the browser only downloads when pixel mode is on (or when the morph warms them up).
export default defineConfig({
  site: 'https://tinydesktop.me',
  // No markdown on the site; turning highlighting off also drops Shiki's CSP-incompatible inline styles.
  markdown: { syntaxHighlight: false },
  // MapLibre is one ~1 MB chunk by design. It loads lazily, after first paint, so the warning is noise.
  vite: { build: { chunkSizeWarningLimit: 1200 } },
  // Public, so it ships in the page. Unset (local dev) means the contact card can't post; see .env.example.
  env: {
    schema: {
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  // Astro hashes every inline script and style into a CSP <meta>; the rest of the policy is here.
  security: {
    csp: {
      // Cloudflare Turnstile, the contact card's bot check: its script, and the iframe it runs in
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'none'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "media-src 'self' https://audio-ssl.itunes.apple.com",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        'frame-src https://challenges.cloudflare.com',
        'upgrade-insecure-requests',
      ],
    },
  },
  fonts: [
    {
      provider: fontsource,
      name: 'Instrument Serif',
      cssVariable: '--font-instrument',
      weights: ['400'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontsource,
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      weights: ['400 500'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontsource,
      name: 'Caveat',
      cssVariable: '--font-caveat',
      weights: ['400 500'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['cursive'],
    },
    {
      provider: fontsource,
      name: 'Pixelify Sans',
      cssVariable: '--font-pixelify',
      weights: ['500 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      provider: fontsource,
      name: 'Silkscreen',
      cssVariable: '--font-silkscreen',
      weights: ['400'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      provider: fontsource,
      name: 'Schibsted Grotesk',
      cssVariable: '--font-schibsted',
      weights: ['400 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
