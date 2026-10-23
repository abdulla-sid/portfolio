import { expect, type Page, test } from '@playwright/test';
import { ipod } from '../src/content/ipod';
import { player } from '../src/content/music';
import { chrome, contact } from '../src/content/site';
import { SWAP } from '../src/lib/morph/timing';
import { STORAGE_KEYS } from '../src/lib/skin-keys';

const { ink, pixel } = chrome.modeSwitch;
const mode = (page: Page) => page.evaluate(() => document.documentElement.dataset.mode);
const introOver = (page: Page) =>
  page.waitForFunction(() => !document.documentElement.classList.contains('ink-in'));
// the name is back to plain text once the morph is over; a switch asked for mid-morph is ignored
const morphOver = (page: Page) => expect(page.locator('[data-morph-name] span span')).toHaveCount(0);
const nameAtRest = (page: Page) =>
  page.waitForFunction(() =>
    document
      .querySelector('h1')
      ?.getAnimations({ subtree: true })
      .every((a) => a.playState !== 'running'),
  );

// the previews live on Apple's CDN; failing them keeps the tests offline (the player then simulates playback)
test.beforeEach(({ page }) => page.route('https://audio-ssl.itunes.apple.com/**', (r) => r.abort()));

for (const url of ['/', '/#pixel']) {
  test(`${url} loads with no console errors or CSP violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        console.error(`CSP: ${e.violatedDirective}`),
      );
    });
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await introOver(page);
    expect(errors).toEqual([]);
  });
}

test('the mode switch offers the other mode and swaps the skin', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: ink.action }).click();
  const back = page.getByRole('button', { name: pixel.action });
  await expect(back).toHaveText(pixel.label, { useInnerText: true });
  expect(await mode(page)).toBe('pixel');
  await expect(page).toHaveURL(/#pixel$/);

  await morphOver(page);
  await back.click();
  await expect(page.getByRole('button', { name: ink.action })).toHaveText(ink.label, { useInnerText: true });
  expect(await mode(page)).toBe('ink');
});

test('#pixel opens in pixel mode', async ({ page }) => {
  await page.goto('/#pixel');
  expect(await mode(page)).toBe('pixel');
});

test('#pixel follows the hash both ways; other hashes leave the mode alone', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    location.hash = '#pixel';
  });
  await expect.poll(() => mode(page)).toBe('pixel');
  await morphOver(page);

  await page.getByRole('link', { name: chrome.skip }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  expect(await mode(page)).toBe('pixel');

  // leaving #work for no hash keeps the mode; leaving #pixel for no hash is the way back to ink
  await page.evaluate(() => {
    location.hash = '';
  });
  // a check that nothing happens needs a window: a morph started by the hash change would have swapped by then
  await page.waitForTimeout(SWAP + 300);
  expect(await mode(page)).toBe('pixel');
  await page.evaluate(() => {
    location.hash = '#pixel';
  });
  await page.evaluate(() => {
    location.hash = '';
  });
  await expect.poll(() => mode(page)).toBe('ink');
});

test('a saved pixel skin shows as #pixel, and Back from #work keeps it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => localStorage.setItem(key, 'pixel'), STORAGE_KEYS.mode);
  await page.goto('/');
  await expect(page).toHaveURL(/#pixel$/);
  await page.getByRole('link', { name: chrome.skip }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  await page.goBack();
  await expect(page).toHaveURL(/#pixel$/);
  expect(await mode(page)).toBe('pixel');
});

test('the skip link is the first tab stop', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: chrome.skip })).toBeFocused();
});

test('work tabs follow Arrow, Home and End', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tab');
  const last = (await tabs.count()) - 1;
  const selected = (i: number) => expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await selected(1);
  await expect(tabs.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await selected(last);
  await page.keyboard.press('ArrowRight');
  await selected(0);
  await page.keyboard.press('ArrowLeft');
  await selected(last);
  await page.keyboard.press('Home');
  await selected(0);
});

test('the map loads when Work comes near', async ({ page }) => {
  await page.goto('/');
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-map]')).toHaveClass(/\bready\b/, { timeout: 20_000 });
});

test('the top-bar player and the iPod share one music state', async ({ page }) => {
  await page.goto('/');
  const mini = page.locator('[data-mini]').getByRole('button', { name: player.play });
  await mini.click();
  await expect(mini).toHaveAttribute('aria-pressed', 'true');

  // pausing on the iPod pauses the top bar, and the iPod says so
  await page.getByRole('button', { name: ipod.keys.play }).click();
  await expect(mini).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#ipod-say')).toHaveText(/paused\.$/);
});

test('double-click replays the name on every load', async ({ page }) => {
  await page.goto('/');
  await introOver(page);
  await page.reload();
  await nameAtRest(page);
  await page.getByRole('heading', { level: 1 }).dblclick();
  await expect(page.locator('html')).toHaveClass(/\bink-in\b/);
  await introOver(page);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('swaps the skin at once, with no intro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/\bink-in\b/);
    await page.getByRole('button', { name: ink.action }).click();
    expect(await mode(page)).toBe('pixel');
    await morphOver(page);
  });
});

test('the postcard asks for what is missing before it posts', async ({ page }) => {
  await page.goto('/');
  const send = page.getByRole('button', { name: contact.card.send });
  const status = page.getByRole('status');
  await send.click();
  await expect(status).toHaveText(contact.status.message);
  await expect(page.getByRole('textbox', { name: contact.card.message.label })).toBeFocused();

  await page.getByRole('textbox', { name: contact.card.message.label }).fill('Hi!');
  await send.click();
  await expect(status).toHaveText(contact.status.name);
  await page.getByRole('textbox', { name: contact.card.name.label }).fill('Sara');
  await page.getByRole('textbox', { name: contact.card.email.label }).fill('sara@example');
  await send.click();
  await expect(status).toHaveText(contact.status.emailShape);

  // the test build has no Turnstile site key, so a good card finds the postbox closed (and says so)
  await page.getByRole('textbox', { name: contact.card.email.label }).fill('sara@example.com');
  await send.click();
  await expect(status).toHaveText(contact.status.closed);
});

test('a heading pad lights as soon as the trace passes it, not at the end of the line', async ({ page }) => {
  await page.goto('/#pixel');
  await introOver(page);
  // the last heading pad (the one with a stub; vias have none) just past the reveal line, the page bottom out of view.
  // On desktop the trace ends beside the clock note and skips Say hi., so that pad is Work's.
  const pad = page.locator('.thread .pad:has(.stub)').last();
  await pad.evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.55));
  expect(await page.evaluate(() => scrollY + innerHeight < document.documentElement.scrollHeight - 4)).toBe(
    true,
  );
  await expect(pad).toHaveClass(/\bon\b/);
});

test('the first screen is the hero alone', async ({ page }) => {
  for (const [width, height] of [
    [1000, 680],
    [1440, 900],
    [390, 844],
    [375, 667],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const top = await page.locator('#about').evaluate((el) => el.getBoundingClientRect().top);
    expect(top, `${width}x${height}`).toBeGreaterThanOrEqual(height);
  }
});

test('no horizontal scroll at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/', '/#pixel']) {
    await page.goto(url);
    await introOver(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

for (const url of ['/', '/#pixel']) {
  test(`${url} phone controls take a 44px tap and the work tabs stay on one row`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(url);
    await introOver(page);
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        '.mini .pp, .pixelate, .red, .dots button, .key, [role="tab"]',
      )) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        const [x, y] = [r.x + r.width / 2, r.y + r.height / 2];
        const hits = (dx: number, dy: number) => el.contains(document.elementFromPoint(x + dx, y + dy));
        // how far the hit area reaches from the centre, 1px at a time (a ring key's area is off-centre)
        const reach = (dx: number, dy: number) => {
          let n = 0;
          while (n < 60 && hits(dx * (n + 1), dy * (n + 1))) n++;
          return n;
        };
        // 43: whole-pixel probing from a fractional centre can lose a pixel of an exactly 44px area
        if (reach(-1, 0) + reach(1, 0) + 1 < 43 || reach(0, -1) + reach(0, 1) + 1 < 43)
          out.push(el.outerHTML.slice(0, 60));
      }
      return out;
    });
    expect(small).toEqual([]);
    const tops = await page
      .locator('[role="tab"]')
      .evaluateAll((t) => t.map((e) => e.getBoundingClientRect().bottom));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(4);
  });
}

test('the link preview image is declared and served', async ({ page, request }) => {
  await page.goto('/');
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(image).toMatch(/^https:\/\//);
  // the tag points at the live domain; the same path must exist in this build
  expect((await request.get(new URL(image ?? '').pathname)).status()).toBe(200);
});
