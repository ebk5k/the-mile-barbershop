import { writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { pathToFileURL } from 'url';
const { chromium } = await import(pathToFileURL(join('/Users/user/aios/node_modules/playwright', 'index.mjs')).href);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
const d = readdirSync(cache).filter((x) => x.startsWith('chromium_headless_shell-')).sort().pop();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ executablePath: join(cache, d, 'chrome-headless-shell-mac-x64/chrome-headless-shell') });
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 1100 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(6000);
let clicked=false; for (const sel of ["button[role=\"tab\"][aria-label*=\"Reviews\"]", "button[aria-label*=\"reviews\"]", "button:has-text(\"More reviews\")", "span:has-text(\"reviews\")"]) { try { const l = p.locator(sel).first(); if (await l.count()) { await l.click({ timeout: 4000 }); clicked = sel; break; } } catch {} } console.log("clicked", clicked);
await sleep(3000);
const progress = await p.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let el = document.querySelector('div[data-review-id]');
  while (el && !(el.scrollHeight > el.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY))) el = el.parentElement;
  const log = [];
  if (!el) return ['no scroller'];
  let stall = 0, last = 0;
  for (let i = 0; i < 80 && stall < 8; i++) {
    el.scrollTop = el.scrollHeight; await sleep(900);
    const n = document.querySelectorAll('div[data-review-id]').length;
    log.push(n); if (n === last) stall++; else stall = 0; last = n;
  }
  document.querySelectorAll('button[aria-label="See more"]').forEach((b) => { try { b.click(); } catch {} });
  await sleep(1000);
  return log;
});
console.log('load progress:', progress.join(','));
const data = await p.evaluate(() => {
  const seen = new Set(); const out = [];
  document.querySelectorAll('div[data-review-id]').forEach((d) => {
    const id = d.getAttribute('data-review-id'); if (seen.has(id)) return; seen.add(id);
    out.push({ id,
      author: d.querySelector('.d4r55')?.textContent.trim() || d.querySelector('button[aria-label]')?.getAttribute('aria-label'),
      stars: d.querySelector('span[role="img"][aria-label*="star"]')?.getAttribute('aria-label'),
      date: d.querySelector('.rsqaWe')?.textContent.trim(),
      text: d.querySelector('.wiI7pd')?.textContent.trim(),
      owner: d.querySelector('.CDe7pd')?.textContent.trim(),
      photos: [...d.querySelectorAll('[style*="googleusercontent"]')].map((b) => (b.style.backgroundImage || '').replace(/^url\("|"\)$/g, '')).filter(Boolean),
      meta: d.querySelector('.RfnDt')?.textContent.trim(),
      avatar: d.querySelector('img[src*="googleusercontent"]')?.src,
      raw: d.innerText });
  });
  const head = document.querySelector('div[role="main"]')?.innerText.slice(0, 700);
  return { reviews: out, head };
});
writeFileSync('gbp/reviews.json', JSON.stringify(data.reviews, null, 2));
console.log('reviews captured:', data.reviews.length);
for (const r of data.reviews) console.log('-', r.author, '|', r.stars, '|', r.date, '|', (r.text || '').replace(/\n/g, ' ').slice(0, 200), r.photos.length ? `| ${r.photos.length} photos` : '', r.owner ? '| OWNER REPLY' : '');
await b.close();
