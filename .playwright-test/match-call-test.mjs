import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:5173";
const API = "http://localhost:4000/api";
const rand = Math.random().toString(36).slice(2, 8);
const shotDir = path.join(process.cwd(), "screenshots-match");
fs.mkdirSync(shotDir, { recursive: true });

function shot(page, name) {
  return page.screenshot({ path: path.join(shotDir, name) });
}

async function register(page, label, username, gender) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("[debug]")) {
      console.log(`[${label} ${msg.type()}]`, msg.text());
    }
  });
  page.on("pageerror", (err) => console.log(`[${label} page error]`, err.message));

  await page.goto(`${BASE}/register`);
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Email"]', `${username}@example.com`);
  await page.fill('input[placeholder="Password"]', "TestPass123!");
  await page.fill('input[placeholder="Date of birth"]', "1995-01-01");
  await page.selectOption("select", gender);
  await page.fill('input[placeholder="Country"]', "IN");
  await page.fill('input[placeholder="Language"]', "en");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/login", { timeout: 15000 });

  await page.fill('input[placeholder="Email or username"]', username);
  await page.fill('input[placeholder="Password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 15000 });
  console.log(`[${label}] logged in as ${username} (${gender})`);
}

async function topUpWallet(username, amount) {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: username, password: "TestPass123!" }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.accessToken;
  const res = await fetch(`${API}/wallet/coins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
  const json = await res.json();
  console.log(`[wallet] topped up ${username} -> balance ${json.data?.wallet?.balance ?? "?"}`);
}

const browser = await chromium.launch({
  headless: false,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-permissions"],
});

try {
  const aCtx = await browser.newContext({ permissions: ["camera", "microphone"] });
  const aPage = await aCtx.newPage();
  const userA = `matcha_${rand}`;
  await register(aPage, "A(girl)", userA, "FEMALE");
  await topUpWallet(userA, 1000);

  const bCtx = await browser.newContext({ permissions: ["camera", "microphone"] });
  const bPage = await bCtx.newPage();
  const userB = `matchb_${rand}`;
  await register(bPage, "B(boy)", userB, "MALE");

  // B needs to be online (connected) before A requests, so the broadcast reaches him.
  await bPage.goto(`${BASE}/home`);
  await bPage.waitForTimeout(1500);

  await aPage.goto(`${BASE}/match`);
  await aPage.waitForTimeout(1000);
  await aPage.click('button:has-text("Random match")');
  await aPage.waitForTimeout(2000);
  await shot(aPage, "01-a-searching.png");
  console.log("[A] requested random match");

  // B should see the incoming request modal, wherever he is in the app.
  await bPage.waitForSelector("text=wants a random video call", { timeout: 10000 });
  await shot(bPage, "02-b-incoming-request.png");
  console.log("[B] saw incoming request modal");

  await bPage.click('button:has-text("Accept")');
  console.log("[B] accepted");
  await bPage.waitForTimeout(5000);

  await shot(aPage, "03-a-call.png");
  await shot(bPage, "04-b-call.png");

  console.log("[A] url:", aPage.url());
  console.log("[B] url:", bPage.url());
} catch (err) {
  console.error("TEST FAILED:", err);
} finally {
  await browser.close();
}
