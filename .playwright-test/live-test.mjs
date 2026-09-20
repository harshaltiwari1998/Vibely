import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:5173";
const rand = Math.random().toString(36).slice(2, 8);
const shotDir = path.join(process.cwd(), "screenshots");
fs.mkdirSync(shotDir, { recursive: true });

function shot(page, name) {
  return page.screenshot({ path: path.join(shotDir, name) });
}

async function registerAndLogin(page, label, username) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().startsWith("[debug]")) {
      console.log(`[${label} ${msg.type()}]`, msg.text());
    }
  });
  page.on("pageerror", (err) => console.log(`[${label} page error]`, err.message));

  await page.goto(`${BASE}/register`);
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Email"]', `${username}@example.com`);
  await page.fill('input[placeholder="Password"]', "TestPass123!");
  await page.fill('input[placeholder="Date of birth"]', "1995-01-01");
  await page.fill('input[placeholder="Country"]', "IN");
  await page.fill('input[placeholder="Language"]', "en");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/login", { timeout: 15000 });

  await page.fill('input[placeholder="Email or username"]', username);
  await page.fill('input[placeholder="Password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 15000 });
  console.log(`[${label}] logged in as ${username}`);
}

const browser = await chromium.launch({
  headless: false,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-permissions"],
});

try {
  const hostCtx = await browser.newContext({ permissions: ["camera", "microphone"] });
  const hostPage = await hostCtx.newPage();
  const hostUser = `host_${rand}`;
  await registerAndLogin(hostPage, "HOST", hostUser);

  await hostPage.goto(`${BASE}/live/go-live`);
  await hostPage.fill('input[placeholder="What\'s your live about?"]', "Playwright test stream");
  await hostPage.click('button:has-text("Start Live")');
  await hostPage.waitForTimeout(4000);
  await shot(hostPage, "01-host-golive.png");
  console.log("[HOST] go-live screenshot taken");

  const viewerCtx = await browser.newContext({ permissions: ["camera", "microphone"] });
  const viewerPage = await viewerCtx.newPage();
  const viewerUser = `viewer_${rand}`;
  await registerAndLogin(viewerPage, "VIEWER", viewerUser);

  await viewerPage.goto(`${BASE}/live`);
  await viewerPage.waitForTimeout(2000);
  await shot(viewerPage, "02-viewer-feed.png");
  console.log("[VIEWER] feed screenshot taken");

  const card = viewerPage.locator("button", { hasText: "🔴 LIVE" }).first();
  const cardCount = await card.count();
  console.log("[VIEWER] live cards found:", cardCount);
  if (cardCount > 0) {
    await card.click();
    await viewerPage.waitForTimeout(4000);
    await shot(viewerPage, "03-viewer-room.png");
    console.log("[VIEWER] room screenshot taken");

    await viewerPage.fill('input[placeholder="Say something..."]', "Hello from Playwright!");
    await viewerPage.click('button:has-text("Send")');
    await viewerPage.waitForTimeout(3000);
    await shot(viewerPage, "04-viewer-after-chat.png");

    await viewerPage.click('button:has-text("🎁")');
    await viewerPage.waitForTimeout(1000);
    await shot(viewerPage, "05-viewer-gift-picker.png");

    await hostPage.waitForTimeout(2000);
    await shot(hostPage, "06-host-after-viewer.png");
    console.log("[HOST] final screenshot taken");
  } else {
    console.log("[VIEWER] NO LIVE ROOMS FOUND IN FEED");
  }
} catch (err) {
  console.error("TEST FAILED:", err);
} finally {
  await browser.close();
}
