import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import process from "node:process";
import puppeteer from "puppeteer-core";
import { preview } from "vite";

const HOST = "127.0.0.1";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const ABOUT_DIALOG = '[role="dialog"][aria-label="ABOUT ME window"]';
const CLOSE_BUTTON = 'button[aria-label="Close"]';

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    process.env.PROGRAMFILES &&
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    process.env["PROGRAMFILES(X86)"] &&
      `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    process.env.LOCALAPPDATA &&
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ].filter(Boolean);

  const executable = candidates.find(existsSync);
  assert(
    executable,
    "Chrome was not found. Set CHROME_PATH to a Chrome or Chromium executable.",
  );
  return executable;
}

async function audioCount(page) {
  return page.evaluate(() => globalThis.__portfolioAudioCount);
}

async function clickFirstMenuItem(page) {
  const item = await page.$(".menu-item");
  assert(item, "The About menu item did not render.");
  await item.click();
}

async function clickMenuItem(page, label) {
  const clicked = await page.evaluate((target) => {
    const item = [...document.querySelectorAll(".menu-item")].find(
      (node) => node.textContent?.trim() === target,
    );
    item?.click();
    return Boolean(item);
  }, label);
  assert(clicked, `${label} menu item did not render.`);
}

async function waitForWindowSettled(page) {
  await page.waitForFunction(
    (selector) => {
      const button = document.querySelector(selector);
      if (!button) return false;
      const laidOut = Number.parseFloat(getComputedStyle(button).height);
      const painted = button.getBoundingClientRect().height;
      return Math.abs(painted - laidOut) < 0.5;
    },
    {},
    CLOSE_BUTTON,
  );
}

async function openAboutOnDesktop(page) {
  await clickFirstMenuItem(page);
  await page.waitForSelector(ABOUT_DIALOG, { visible: true });
  await waitForWindowSettled(page);
}

async function aboutColumnEdges(page) {
  return page.evaluate(() => {
    const edges = (selector) => {
      const node = document.querySelector(selector);
      const box = node.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left };
    };

    const photo = edges(".photo");
    const note = edges(".note");
    const text = edges(".text");
    const deck = edges(".deck");

    return {
      layout: getComputedStyle(document.querySelector(".about")).display,
      photoTopMeetsTextTop: photo.top === text.top,
      noteBottomMeetsDeckBottom: note.bottom === deck.bottom,
      photoLeftMeetsNoteLeft: photo.left === note.left,
      textLeftMeetsDeckLeft: text.left === deck.left,
    };
  });
}

async function openAboutOnMobile(page) {
  await page.click('button[aria-label="Toggle navigation"]');
  await clickFirstMenuItem(page);
  await page.waitForSelector(ABOUT_DIALOG, { visible: true });
  await waitForWindowSettled(page);
}

async function phoneChromeMetrics(page) {
  return page.evaluate(() => {
    const close = document.querySelector('button[aria-label="Close"]');
    const closeBox = close.getBoundingClientRect();
    const edge = close.querySelector(".tab.mobile .edge").getAttribute("d");
    const horizontalPoints = [...edge.matchAll(/H(\d+)/g)].map((match) =>
      Number.parseInt(match[1], 10),
    );
    const diagonalEnd = horizontalPoints.at(-2);
    const labelStart = close.querySelector("span").getBoundingClientRect().left;

    return {
      closeWidth: Math.round(closeBox.width),
      closeHeight: Math.round(closeBox.height),
      diagonalLabelGap: Math.round(labelStart - closeBox.left - diagonalEnd),
      titleSize: Number.parseFloat(
        getComputedStyle(document.querySelector("#title")).fontSize,
      ),
    };
  });
}

let browser;
let server;

try {
  server = await preview({
    logLevel: "silent",
    preview: { host: HOST, port: 0 },
  });

  const address = server.httpServer.address();
  assert(address && typeof address !== "string");
  const url = `http://${HOST}:${address.port}/`;

  browser = await puppeteer.launch({
    executablePath: chromeExecutable(),
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  const runtimeErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.evaluateOnNewDocument(() => {
    const NativeAudio = globalThis.Audio;
    let count = 0;

    function TrackedAudio(...args) {
      count += 1;
      return Reflect.construct(NativeAudio, args);
    }

    TrackedAudio.prototype = NativeAudio.prototype;
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: TrackedAudio,
    });
    Object.defineProperty(globalThis, "__portfolioAudioCount", {
      configurable: true,
      get: () => count,
    });
  });

  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const requestUrl = new URL(request.url());

    if (requestUrl.pathname === "/favicon.ico") {
      await request.respond({ status: 204 });
      return;
    }

    if (requestUrl.hostname === "itunes.apple.com") {
      const callback = requestUrl.searchParams.get("callback");
      await request.respond({
        status: 200,
        contentType: "application/javascript",
        body: callback ? `${callback}({"results":[]})` : "",
      });
      return;
    }

    await request.continue();
  });

  await page.setViewport(DESKTOP);
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".menu-item", { visible: true });

  assert.equal(await page.title(), "abdullah siddiqui");
  assert.equal(await audioCount(page), 0);
  assert.equal(await page.$("vite-error-overlay"), null);
  assert.equal(
    await page.evaluate(() => {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    }),
    true,
  );

  await openAboutOnDesktop(page);
  assert.equal(await audioCount(page), 1);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("role")),
    "dialog",
  );

  assert.deepEqual(await aboutColumnEdges(page), {
    layout: "grid",
    photoTopMeetsTextTop: true,
    noteBottomMeetsDeckBottom: true,
    photoLeftMeetsNoteLeft: true,
    textLeftMeetsDeckLeft: true,
  });

  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.classList.contains("menu-item"),
    ),
    true,
  );

  await page.setViewport(MOBILE);
  await openAboutOnMobile(page);

  assert.equal(await audioCount(page), 1);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("role")),
    "dialog",
  );
  assert.equal(
    await page.$eval(".mobile-dock", (element) => {
      return getComputedStyle(element).display !== "none";
    }),
    true,
  );
  assert.equal(await page.$("vite-error-overlay"), null);
  assert.deepEqual(runtimeErrors, []);

  for (const viewport of [
    { width: 320, height: 800 },
    { width: 344, height: 882 },
    { width: 360, height: 640 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await openAboutOnMobile(page);
    assert.deepEqual(await phoneChromeMetrics(page), {
      closeWidth: 68,
      closeHeight: 16,
      diagonalLabelGap: 3,
      titleSize: 9,
    });
  }

  await page.setViewport({ width: 375, height: 667 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  assert.equal(
    await page.evaluate(async () => {
      const body = document.querySelector(".body");
      body.scrollTop = body.scrollHeight;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return (
        document.querySelector(".note.strip").getBoundingClientRect().bottom <=
        body.getBoundingClientRect().bottom + 1
      );
    }),
    true,
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "PROJECTS");
  await page.waitForSelector('button[aria-label="Next project"]', {
    visible: true,
  });
  await page.click('button[aria-label="Next project"]');
  assert.equal(
    await page.evaluate(async () => {
      const narrative = document.querySelector(".narrative");
      narrative.scrollTop = narrative.scrollHeight;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const lastParagraph = narrative.querySelector("p:last-child");
      return (
        lastParagraph.getBoundingClientRect().bottom <=
        narrative.getBoundingClientRect().bottom + 1
      );
    }),
    true,
  );

  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "CONTACT ME");
  await page.waitForSelector(
    '[role="dialog"][aria-label="CONTACT ME window"] form',
    { visible: true },
  );
  assert.deepEqual(
    await page.$eval('[role="dialog"] .body', (element) => ({
      horizontal: element.scrollWidth > element.clientWidth + 1,
    })),
    { horizontal: false },
  );
  assert.equal(
    await page.$eval(CLOSE_BUTTON, (element) =>
      Math.round(element.getBoundingClientRect().width),
    ),
    68,
  );

  await page.setViewport({ width: 320, height: 800 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  assert.deepEqual(
    await page.evaluate(() => {
      const note = document
        .querySelector(".note.strip")
        .getBoundingClientRect();
      const tape = document
        .querySelector(".note.strip .tape")
        .getBoundingClientRect();
      const copy = document.querySelector(".text").getBoundingClientRect();
      return {
        contained:
          tape.top >= note.top &&
          tape.right <= note.right &&
          tape.bottom <= note.bottom &&
          tape.left >= note.left,
        noteClearsCopy: note.top - copy.bottom >= 20,
      };
    }),
    { contained: true, noteClearsCopy: true },
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "EXPERIENCE");
  await page.waitForSelector(".paddle", { visible: true });
  assert.deepEqual(
    await page.evaluate(() => {
      const prev = document
        .querySelector(".paddle.prev")
        .getBoundingClientRect();
      const next = document
        .querySelector(".paddle.next")
        .getBoundingClientRect();
      const narrative = document.querySelector(".page").getBoundingClientRect();
      const map = document.querySelector(".map-slot").getBoundingClientRect();
      const body = document.querySelector(".body").getBoundingClientRect();
      return {
        leftOuterInset: Math.round(prev.left - body.left),
        rightOuterInset: Math.round(body.right - next.right),
        leftGap: Math.round(narrative.left - prev.right),
        rightGap: Math.round(next.left - Math.max(narrative.right, map.right)),
        paddleWidth: Math.round(prev.width),
        paddleHeight: Math.round(prev.height),
      };
    }),
    {
      leftOuterInset: 2,
      rightOuterInset: 2,
      leftGap: 10,
      rightGap: 10,
      paddleWidth: 14,
      paddleHeight: 116,
    },
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "CONTACT ME");
  await page.waitForSelector(".contact .lede", { visible: true });
  assert.equal(
    await page.$eval(".contact .lede", (element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
    9,
  );
  assert.equal(
    await page.$eval("textarea", async (element) => {
      const value = "compact message ".repeat(50);
      element.focus();
      element.value = value;
      element.setSelectionRange(value.length, value.length);
      element.dispatchEvent(new InputEvent("input", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return Math.abs(
        element.scrollTop - (element.scrollHeight - element.clientHeight),
      );
    }),
    0,
  );

  await page.setViewport({ width: 344, height: 882 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  assert.equal(
    await page.evaluate(() => {
      const note = document
        .querySelector(".note.strip")
        .getBoundingClientRect();
      const copy = document.querySelector(".text").getBoundingClientRect();
      return note.top - copy.bottom >= 20;
    }),
    true,
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "EXPERIENCE");
  await page.waitForSelector(".paddle", { visible: true });
  assert.deepEqual(
    await page.evaluate(() => {
      const prev = document
        .querySelector(".paddle.prev")
        .getBoundingClientRect();
      const next = document
        .querySelector(".paddle.next")
        .getBoundingClientRect();
      const narrative = document.querySelector(".page").getBoundingClientRect();
      const map = document.querySelector(".map-slot").getBoundingClientRect();
      const scrollStyle = getComputedStyle(
        document.querySelector(".narrative"),
      );
      return {
        leftGap: Math.round(narrative.left - prev.right),
        rightGap: Math.round(next.left - Math.max(narrative.right, map.right)),
        paddleWidth: Math.round(prev.width),
        paddleHeight: Math.round(prev.height),
        boxShadow: scrollStyle.boxShadow,
        hasFade: scrollStyle.maskImage !== "none",
      };
    }),
    {
      leftGap: 10,
      rightGap: 10,
      paddleWidth: 16,
      paddleHeight: 88,
      boxShadow: "none",
      hasFade: true,
    },
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "CONTACT ME");
  await page.waitForSelector(".contact form", { visible: true });
  assert.deepEqual(
    await page.evaluate(() => {
      const fields = [...document.querySelectorAll(".pair input")].map((node) =>
        node.getBoundingClientRect(),
      );
      const message = document
        .querySelector("textarea")
        .getBoundingClientRect();
      const rail = document.querySelector(".rail").getBoundingClientRect();
      const body = document.querySelector(".body").getBoundingClientRect();
      return {
        fieldsHaveSeparateRows: Math.abs(fields[0].top - fields[1].top) > 40,
        messageUsesFreeHeight: message.height > 100,
        railClearsMessage: rail.top - message.bottom >= 20,
        railMeetsPanelBottom: body.bottom - rail.bottom <= 1,
        railDirection: getComputedStyle(document.querySelector(".rail"))
          .flexDirection,
      };
    }),
    {
      fieldsHaveSeparateRows: true,
      messageUsesFreeHeight: true,
      railClearsMessage: true,
      railMeetsPanelBottom: true,
      railDirection: "row",
    },
  );

  await page.setViewport({ width: 360, height: 640 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "EXPERIENCE");
  await page.waitForSelector(".paddle", { visible: true });
  assert.deepEqual(
    await page.$eval(".paddle.prev", (element) => {
      const paddle = element.getBoundingClientRect();
      return {
        width: Math.round(paddle.width),
        height: Math.round(paddle.height),
      };
    }),
    { width: 20, height: 80 },
  );

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 390, height: 900 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await openAboutOnMobile(page);
    await page.click(CLOSE_BUTTON);
    await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
    await page.click('button[aria-label="Toggle navigation"]');
    await clickMenuItem(page, "CONTACT ME");
    await page.waitForSelector(".contact form", { visible: true });
    assert.deepEqual(
      await page.evaluate(() => {
        const form = document.querySelector(".contact form");
        const body = document.querySelector(".body").getBoundingClientRect();
        const rail = document.querySelector(".rail").getBoundingClientRect();
        return {
          alignContent: getComputedStyle(form).alignContent,
          railMeetsPanelBottom: body.bottom - rail.bottom <= 1,
        };
      }),
      { alignContent: "stretch", railMeetsPanelBottom: true },
    );
  }

  await page.setViewport({ width: 556, height: 960 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "PROJECTS");
  await page.waitForSelector(".paddle", { visible: true });
  await waitForWindowSettled(page);
  assert.deepEqual(
    await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const prev = document
        .querySelector(".paddle.prev")
        .getBoundingClientRect();
      const page = document.querySelector(".page").getBoundingClientRect();
      return {
        heading: root.getPropertyValue("--panel-heading").trim(),
        narrative: root.getPropertyValue("--panel-narrative").trim(),
        paddleClearance: Math.round(page.left - prev.right),
      };
    }),
    { heading: "14px", narrative: "8px", paddleClearance: 12 },
  );

  await page.setViewport({ width: 800, height: 1200 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  assert.equal(
    await page.$eval(
      '[data-widget-id="player"]',
      (element) => getComputedStyle(element).display,
    ),
    "none",
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const content = document.querySelector(".content");
      const deck = document.querySelector(".deck");
      const body = document.querySelector(".body");
      return {
        contentBottom: getComputedStyle(content).bottom,
        deckMeetsBodyBottom:
          Math.abs(
            deck.getBoundingClientRect().bottom -
              body.getBoundingClientRect().bottom,
          ) < 0.5,
      };
    }),
    { contentBottom: "36px", deckMeetsBodyBottom: true },
  );

  await page.setViewport({ width: 768, height: 1024 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnMobile(page);
  assert.deepEqual(
    await page.evaluate(() => {
      const note = document
        .querySelector(".note.strip")
        .getBoundingClientRect();
      const deck = document.querySelector(".deck").getBoundingClientRect();
      const dock = document.querySelector('[data-widget-id="player"]');
      const close = document
        .querySelector('button[aria-label="Close"]')
        .getBoundingClientRect();
      return {
        titleSize: Number.parseFloat(
          getComputedStyle(document.querySelector("#title")).fontSize,
        ),
        headingSize: Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--panel-heading",
          ),
        ),
        narrativeSize: Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--panel-narrative",
          ),
        ),
        noteHeight: Math.round(note.height),
        deckHeight: Math.round(deck.height),
        dockHidden: getComputedStyle(dock).display === "none",
        closeWidth: Math.round(close.width),
        closeHeight: Math.round(close.height),
      };
    }),
    {
      titleSize: 13,
      headingSize: 19,
      narrativeSize: 11,
      noteHeight: 95,
      deckHeight: 248,
      dockHidden: true,
      closeWidth: 100,
      closeHeight: 24,
    },
  );
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await page.click('button[aria-label="Toggle navigation"]');
  await clickMenuItem(page, "PROJECTS");
  await page.waitForSelector(".paddle", { visible: true });
  assert.equal(
    await page.evaluate(() => {
      const prev = document
        .querySelector(".paddle.prev")
        .getBoundingClientRect();
      const content = document.querySelector(".page").getBoundingClientRect();
      return Math.round(content.left - prev.right);
    }),
    12,
  );

  await page.setViewport({ width: 1024, height: 768 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnDesktop(page);
  assert.deepEqual(
    await page.evaluate(() => {
      const body = document.querySelector(".body");
      const vu = document.querySelector(".vu");
      const presets = [...document.querySelectorAll(".preset")];
      const bar = document.querySelector(".bar");
      const transport = document.querySelector(".transport");
      const presetList = document.querySelector(".presets");
      const presetStyle = getComputedStyle(presetList);
      const presetSize = presets[0].getBoundingClientRect().width;
      const presetGap = Number.parseFloat(presetStyle.columnGap);
      const barGap = Number.parseFloat(getComputedStyle(bar).columnGap);
      return {
        bodyOverflows: body.scrollHeight > body.clientHeight + 1,
        presetSize: Math.round(presetSize),
        presetRows: new Set(
          presets.map((node) => Math.round(node.getBoundingClientRect().top)),
        ).size,
        vuWidth: Math.round(vu.getBoundingClientRect().width),
        supportsEight:
          bar.clientWidth + 1 >=
          transport.getBoundingClientRect().width +
            barGap +
            8 * presetSize +
            7 * presetGap,
      };
    }),
    {
      bodyOverflows: false,
      presetSize: 22,
      presetRows: 1,
      vuWidth: 100,
      supportsEight: true,
    },
  );
  const beforeDrag = await page.$eval(
    '[data-widget-id="menu-window"]',
    (element) => element.getBoundingClientRect().left,
  );
  await page.$eval(
    '[data-widget-id="menu-window"]',
    (element, left) => {
      element.style.left = `${left - 30}px`;
      element.style.right = "auto";
    },
    beforeDrag,
  );
  assert.equal(
    await page.$eval(
      '[data-widget-id="menu-window"]',
      (element, previous) =>
        element.getBoundingClientRect().left < previous - 20,
      beforeDrag,
    ),
    true,
  );

  await page.setViewport({ width: 1512, height: 982 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await openAboutOnDesktop(page);
  await page.click(CLOSE_BUTTON);
  await page.waitForSelector(ABOUT_DIALOG, { hidden: true });
  await clickMenuItem(page, "PROJECTS");
  await page.waitForSelector(".paddle", { visible: true });
  await waitForWindowSettled(page);
  assert.deepEqual(
    await page.evaluate(() => {
      const prev = document
        .querySelector(".paddle.prev")
        .getBoundingClientRect();
      const next = document
        .querySelector(".paddle.next")
        .getBoundingClientRect();
      const content = document.querySelector(".page").getBoundingClientRect();
      const body = document.querySelector(".body").getBoundingClientRect();
      const close = document
        .querySelector('button[aria-label="Close"]')
        .getBoundingClientRect();
      return {
        leftOuterInset: Math.round(prev.left - body.left),
        rightOuterInset: Math.round(body.right - next.right),
        paddleClearance: Math.round(content.left - prev.right),
        closeWidth: Math.round(close.width),
        closeHeight: Math.round(close.height),
      };
    }),
    {
      leftOuterInset: 2,
      rightOuterInset: 2,
      paddleClearance: 20,
      closeWidth: 108,
      closeHeight: 27,
    },
  );

  process.stdout.write(
    "Browser smoke passed: lifecycle and responsive layout assertions held.\n",
  );
} finally {
  await browser?.close();
  await server?.close();
}
