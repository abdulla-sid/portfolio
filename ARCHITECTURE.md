# Architecture

tinydesktop.me is one static page. Astro renders the HTML at build time; every interactive part is a small,
framework-free TypeScript module. There is no UI framework at runtime.

## Stack

| Concern           | Choice                                     | Why                                                                                                    |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Pages, components | Astro 7 (static output)                    | One `.astro` file per section and component, so sections can be reordered or moved freely. Scoped CSS. |
| Language          | TypeScript 6, strict                       | `astro check` does not support TypeScript 7 yet. Upgrade when it does.                                 |
| Styling           | Plain CSS with custom properties           | Every colour lives in `src/styles/tokens.css`, per mode.                                               |
| Map               | MapLibre GL 6 + PMTiles (HTTP range reads) | Loaded only when the Work section comes near the viewport.                                             |
| Fonts             | Astro Fonts API, Fontsource provider       | Self-hosted, preloaded where it matters.                                                               |
| Images            | `astro:assets`                             | AVIF/WebP at the sizes the layout uses.                                                                |
| Lint and format   | Biome                                      | One tool for lint and format.                                                                          |
| Unit tests        | Vitest                                     | Pure logic only (geometry, quantising, formatting).                                                    |
| Browser tests     | Playwright                                 | Smoke tests on desktop and phone viewports.                                                            |

## Layout of the code

```
src/
  pages/index.astro        the page: picks sections and their order
  layouts/Base.astro       <head>, fonts, the pre-paint skin script, global CSS
  sections/                one file per page section (TopBar, Hero, About, Work, Projects, Contact)
  components/              pieces used inside sections (Device, Ipod, Thread, WorkMap, Shelf, ...)
  content/                 all copy and data, typed. Editing the site's text means editing only these files.
  styles/                  tokens.css (colours, fonts, sizes), base.css (reset and shared primitives)
  lib/                     client-side behaviour, one folder per feature, no DOM framework
  lib/canvas/              drawing primitives shared by every pixel canvas
  lib/namehover/           movement-driven wet ink and pixel scatter; motion.ts holds sampling and return maths
  lib/thread/              the page line: geometry.ts (path maths), depth.ts (how much line reaches a scroll depth), thread.ts (DOM)
functions/api/contact.ts   Cloudflare Pages Function behind the contact card
e2e/                       Playwright tests
public/map/                PMTiles for Lahore and Islamabad
```

## The two skins

`<html data-mode="ink|pixel">`. CSS reads these through tokens. Canvases and the map
cannot read CSS directly, so they call `token('--name')` from `lib/skin.ts` and redraw when the skin changes.

`lib/skin.ts` owns the state:
- `getSkin()` returns `{ mode }`.
- `setSkin(partial)` writes the attributes, persists them, and notifies subscribers.
- `onSkinChange(fn)` subscribes. Every canvas, the map, the portrait and the thread subscribe.
- `#pixel` in the URL opens pixel mode; changing the hash to `#pixel` or to nothing (Back, Forward) switches mode, other hashes do not.
- The one inline script, in `Base.astro`, applies the saved skin and sets up the hero's intro before first paint. Astro's CSP
  does not hash `is:inline` scripts, so Base.astro adds its hash with `Astro.csp.insertScriptHash`. Do not add others.

## Contracts between features

Features never import each other's internals. They meet through these:

| Contract | Provided by | Used by |
|---|---|---|
| `onSkinChange` / `setSkin` / `token` (`lib/skin.ts`) | skin | everything that paints |
| Music store (`lib/music/store.ts`): `{ track, playing, position }` | music | top-bar mini player, LCD music app, iPod |
| Music previews: one `<script type="application/json" id="music-previews">` resolved at build time | `MusicData.astro` | music player |
| `data-thread="..."` anchors: `start` (the full stop), `device-in` (red button), `device-out` (device body), `heading` (headings the line passes), `map` (map area), `jack` (the iPod's earbud jack, where its cable joins), `copy` (the About copy: under it, the cable branches off the gutter), `clear` (the hero text the line must pass under), `shelf` (the projects shelf's objects), `shelf-cap` (their captions), `shelf-text` (the Projects heading and intro, whose text ink's line keeps clear of), `panel` (the open project panel), `note` (the contact clock note, measured without its tilt: ink's line ends in a full stop beside it, pixel's trace too when it sits right of the card), `end` (the contact card's send button) | each section | thread |
| `data-morph="object"` / `data-morph="text"` on elements that animate in the mode switch; `data-morph-name` on the hero name | each section | morph |
| `layoutChanged()` / `onLayoutChange()` (`lib/layout.ts`): call after anything changes height; `perFrame(fn)` coalesces calls to one per frame | tabs, shelf, thread | thread |
| `LINE`, `PHONE_MAX`, `PHONE_QUERY` (`lib/metrics.ts`, no side effects, safe in tests): where the line meets the map and device, the reveal point, the phone breakpoint and its media query | metrics | thread, map |
| `byId`, `boxIn` (`lib/dom.ts`): an element by id, an element's or range's box relative to another | dom | device, iPod, music, thread, map, shelf |
| Work selection store (`lib/work/selection.ts`): the selected work entry | work tabs | map (pins write it too) |
| `thread` controller (`lib/thread/thread.ts`): `setDrawn(len)`, `length()`, `rebuild()` | thread | morph, ink-in |
| `lcd` controller (`lib/lcd/controller.ts`): `reboot()` | device | morph |
| Canvas primitives (`lib/canvas/`): pixel font, sprite painting, play/pause icons, colour reading, palette quantising, the frame loop (`whileVisible(el, (now, ticked) => …)`, `ticked` true once per tick) | canvas | LCD, iPod, portrait |
| `eachLetter` (`lib/letters.ts`): measures real glyph positions and baselines without changing the text | letters | ink-in, namehover |
| `data-ink-in="name"`, `INK_IN` (`lib/ink-in/keys.ts`): hero heading and intro state; heading text mutations and running animations hand it to replay/morph | Hero, ink-in, morph | namehover (cancels its overlay immediately) |
| Contact rules (`lib/contact/contact.ts`): `LIMITS`, `EMAIL_SHAPE` | contact card | contact card, `functions/api/contact.ts` |
| Clock (`lib/clock/`): cached Lahore time formatters | clock | LCD, contact line |

## Mode switch

`lib/morph/morph.ts` runs the choreography (letters deleted, page goes quiet, skin swaps, name retyped, thread
redrawn, LCD reboots). It calls `setSkin({ mode })` at the swap point. Everything else reacts through
`onSkinChange`. Under `prefers-reduced-motion` it swaps instantly.

## Name hover

`lib/namehover/namehover.ts` loads when a mouse or pen first enters the heading. It samples the heading on pointer movement: ink drags strokes and a few droplets;
pixel scatters glyph cells and steps them home. It uses token colours and `onSkinChange`, leaves the full-stop
anchor alone, and removes its layers to restore real selectable text at rest. Intro/replay, heading mutations,
running name animations, resize, scrolling and reduced motion cancel the effect. Touch input is ignored.
There is no idle frame loop; geometry is rebuilt on the next eligible movement.

## Rules

- No feature knows about the morph except through the contracts above.
- No colour literals outside `tokens.css` (canvas palettes included). Pixel mode's palette and type roles: the PIXEL RULE comment in `tokens.css`.
- No copy in components: text comes from `src/content/`.
- Pure logic (path maths, quantising, formatting) lives in plain functions with tests next to them.
