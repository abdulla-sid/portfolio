import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import process from "node:process";
import puppeteer from "puppeteer-core";
import { preview } from "vite";

const HOST = "127.0.0.1";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const ABOUT_DIALOG = '[role="dialog"][aria-label="ABOUT ME window"]';

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

async function openAboutOnDesktop(page) {
  await clickFirstMenuItem(page);
  await page.waitForSelector(ABOUT_DIALOG, { visible: true });
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

  await page.click('button[aria-label="Close"]');
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

  process.stdout.write(
    "Browser smoke passed: desktop-to-mobile About flow kept one Audio instance.\n",
  );
} finally {
  await browser?.close();
  await server?.close();
}
