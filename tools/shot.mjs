import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { pathToFileURL } from 'url';
const { chromium } = await import(pathToFileURL(join('/Users/user/aios/node_modules/playwright', 'index.mjs')).href);
const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
const d = readdirSync(cache).filter((x) => x.startsWith('chromium-')).sort().pop();
const exec = ['chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-x64/Chromium.app/Contents/MacOS/Chromium'].map((s) => join(cache, d, s)).find(existsSync);
const URL_ = process.argv[2] || 'http://127.0.0.1:4520/';
const b = await chromium.launch({ executablePath: exec, headless: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// ---- mobile ----
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
await p.evaluate(() => document.fonts.ready); await sleep(1200);
const info = await p.evaluate(() => ({ innerW: innerWidth, scrollW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, h: document.documentElement.scrollHeight, status: document.querySelector('#status-text')?.textContent, lang: document.documentElement.lang, fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).filter((v, i, a) => a.indexOf(v) === i), heroNat: [document.querySelector('.hero-media img').naturalWidth, document.querySelector('.hero-media img').naturalHeight], wide: [...document.querySelectorAll('body *')].filter((e) => !e.closest('.chips,.rail,.viewer,.grid') && e.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map((e) => e.tagName + '.' + e.className) }));
console.log(JSON.stringify(info));
await p.screenshot({ path: 'shots/m-00-hero.png' });
const H = info.h; let i = 1;
for (let y = 760; y < H - 100 && i < 14; y += 760, i++) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(500); await p.screenshot({ path: `shots/m-${String(i).padStart(2, '0')}.png` }); }
await p.screenshot({ path: 'shots/m-full.png', fullPage: true });
// viewer
await p.evaluate(() => window.scrollTo(0, 0)); await sleep(300);
const card = p.locator('.card-photo').first(); await card.scrollIntoViewIfNeeded(); await card.click(); await sleep(800);
await p.screenshot({ path: 'shots/m-viewer.png' });
await p.evaluate(() => { const v = document.querySelector('#viewer-scroll'); v.scrollTo(0, v.clientHeight * 3); }); await sleep(600);
await p.screenshot({ path: 'shots/m-viewer-4.png' });
await p.keyboard.press('Escape'); await sleep(300);
// spanish
await p.click('#lang'); await sleep(400); await p.screenshot({ path: 'shots/m-es-hero.png' });
await p.evaluate(() => document.querySelector('#visit').scrollIntoView()); await sleep(500); await p.screenshot({ path: 'shots/m-es-visit.png' });
await ctx.close();
// ---- desktop ----
const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p2 = await ctx2.newPage(); await p2.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 }); await p2.evaluate(() => document.fonts.ready); await sleep(1000);
await p2.screenshot({ path: 'shots/d-00-hero.png' });
const H2 = await p2.evaluate(() => document.documentElement.scrollHeight);
for (let y = 850, j = 1; y < H2 - 100 && j < 10; y += 850, j++) { await p2.evaluate((y) => window.scrollTo(0, y), y); await sleep(500); await p2.screenshot({ path: `shots/d-${String(j).padStart(2, '0')}.png` }); }
await ctx2.close(); await b.close();
console.log('errors:', JSON.stringify(errs)); console.log('shots done');
