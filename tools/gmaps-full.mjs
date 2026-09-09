// Full Google Maps listing pull: facts, hours, reviews, all photo tabs, videos.
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { pathToFileURL } from 'url';
const PW = '/Users/user/aios/node_modules/playwright';
const { chromium } = await import(pathToFileURL(join(PW, 'index.mjs')).href);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const [URL_ARG, OUTDIR] = process.argv.slice(2);
mkdirSync(OUTDIR, { recursive: true });
function findExec() {
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) for (const sub of ['chrome-headless-shell-mac-x64/chrome-headless-shell', 'chrome-headless-shell-mac-arm64/chrome-headless-shell']) { const p = join(cache, d, sub); if (existsSync(p)) return p; }
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ executablePath: findExec() });
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto(URL_ARG, { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(6000);
try { const c = p.locator('button:has-text("Accept all"), button:has-text("Reject all")').first(); if (await c.isVisible({ timeout: 1500 })) { await c.click(); await sleep(1500); } } catch {}
await p.screenshot({ path: join(OUTDIR, '_listing-desktop.png') });

// ---------- facts ----------
const facts = await p.evaluate(() => {
  const q = (s) => document.querySelector(s); const t = (el) => (el ? el.textContent.trim() : null);
  const out = {};
  out.name = t(q('h1'));
  out.category = t(q('button[jsaction*="category"]'));
  out.ratingBlock = t(q('div.F7nice')) || t(q('[role="main"] span[aria-label*="stars"]'));
  out.address = t(q('button[data-item-id="address"]'));
  out.phone = t(q('button[data-item-id^="phone"]'));
  const web = q('a[data-item-id="authority"]'); out.website = web ? web.href : null; out.websiteLabel = t(web);
  out.plusCode = t(q('button[data-item-id="oloc"]'));
  out.appointments = [...document.querySelectorAll('a[data-item-id^="appointment"], a[data-item-id*="book"], a[href*="booksy"], a[href*="squareup"], a[href*="thecut"], a[href*="vagaro"]')].map((a) => a.href);
  out.hoursBtn = t(q('button[data-item-id="oh"]')) || t(q('[aria-label*="Hours"]'));
  out.attributes = [...document.querySelectorAll('div[aria-label][role="group"]')].map((d) => d.getAttribute('aria-label'));
  out.mainText = q('div[role="main"]')?.innerText;
  out.url = location.href;
  return out;
});
// hours table
try {
  const hb = p.locator('button[data-item-id="oh"]').first();
  if (await hb.count()) { await hb.click({ timeout: 4000 }); await sleep(1500); }
  facts.hours = await p.evaluate(() => [...document.querySelectorAll('table tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)).filter((r) => r.length));
  facts.hoursAria = await p.evaluate(() => [...document.querySelectorAll('[aria-label*="Hours"], [aria-label*="hours"]')].map((e) => e.getAttribute('aria-label')).slice(0, 8));
} catch (e) { facts.hoursErr = String(e); }
writeFileSync(join(OUTDIR, 'facts.json'), JSON.stringify(facts, null, 2));
console.log('facts:', facts.name, '|', facts.ratingBlock, '|', facts.address, '|', facts.phone, '|', facts.website);

// ---------- About tab ----------
try {
  const about = p.locator('button[role="tab"]:has-text("About")').first();
  if (await about.count()) { await about.click({ timeout: 4000 }); await sleep(2000); const txt = await p.evaluate(() => document.querySelector('div[role="main"]')?.innerText); writeFileSync(join(OUTDIR, 'about.txt'), txt || ''); }
} catch (e) { console.log('about failed', e.message); }

// ---------- Reviews ----------
try {
  const rev = p.locator('button[role="tab"]:has-text("Reviews")').first();
  await rev.click({ timeout: 8000 }); await sleep(2500);
  // scroll feed
  await p.evaluate(async () => {
    const scrollers = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 300);
    const sc = scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (!sc) return;
    let stall = 0, lastN = 0;
    for (let i = 0; i < 120 && stall < 8; i++) {
      sc.scrollTop = sc.scrollHeight; await new Promise((r) => setTimeout(r, 700));
      const n = document.querySelectorAll('div[data-review-id]').length;
      if (n === lastN) stall++; else stall = 0; lastN = n;
    }
    document.querySelectorAll('button[aria-label="See more"], button[aria-expanded="false"]:not([role="tab"])').forEach((b) => { try { b.click(); } catch {} });
    await new Promise((r) => setTimeout(r, 800));
  });
  const reviews = await p.evaluate(() => {
    const seen = new Set(); const out = [];
    document.querySelectorAll('div[data-review-id]').forEach((d) => {
      const id = d.getAttribute('data-review-id'); if (seen.has(id)) return; seen.add(id);
      const author = d.querySelector('.d4r55, [class*="d4r55"]')?.textContent.trim() || d.querySelector('button[aria-label]')?.getAttribute('aria-label');
      const stars = d.querySelector('span[role="img"][aria-label*="star"]')?.getAttribute('aria-label');
      const date = d.querySelector('.rsqaWe, [class*="rsqaWe"]')?.textContent.trim();
      const text = d.querySelector('.wiI7pd, [class*="wiI7pd"]')?.textContent.trim();
      const owner = d.querySelector('.CDe7pd, [class*="CDe7pd"]')?.textContent.trim();
      const photos = [...d.querySelectorAll('button[data-photo-index], [style*="googleusercontent"]')].map((b) => (b.style.backgroundImage || '').replace(/^url\("|"\)$/g, '')).filter(Boolean);
      const localGuide = d.querySelector('.RfnDt, [class*="RfnDt"]')?.textContent.trim();
      out.push({ id, author, stars, date, text, owner, photos, localGuide, raw: d.innerText });
    });
    return out;
  });
  writeFileSync(join(OUTDIR, 'reviews.json'), JSON.stringify(reviews, null, 2));
  console.log('reviews:', reviews.length);
  await p.screenshot({ path: join(OUTDIR, '_reviews.png') });
} catch (e) { console.log('reviews failed', e.message); }

// ---------- Photos ----------
const all = new Map(); // url -> {tabs:Set, video:boolean}
async function harvestTab(label) {
  const urls = await p.evaluate(async (label) => {
    const found = new Map();
    const collect = () => {
      document.querySelectorAll('a[data-photo-index], button[data-photo-index], div[data-photo-index]').forEach((a) => {
        const el = a.querySelector('[style*="googleusercontent"]') || a.querySelector('img[src*="googleusercontent"]');
        let s = el ? (el.src || (el.style.backgroundImage || '').replace(/^url\("|"\)$/g, '')) : '';
        if (!s.includes('googleusercontent')) return;
        if (s.startsWith('//')) s = 'https:' + s;
        if (s.includes('/a-/')) return;
        const base = s.split('=')[0];
        const isVideo = !!a.querySelector('[aria-label*="ideo"], svg, .video') || label.toLowerCase().includes('video');
        const idx = a.getAttribute('data-photo-index');
        if (!found.has(base)) found.set(base, { idx, video: isVideo });
      });
    };
    const scrollers = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 100 && d.clientHeight > 300);
    const sc = scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    collect();
    if (sc) {
      sc.scrollTop = 0; await new Promise((r) => setTimeout(r, 400));
      let stall = 0, lastN = 0;
      for (let i = 0; i < 200 && stall < 8; i++) {
        sc.scrollTop += 800; await new Promise((r) => setTimeout(r, 650)); collect();
        if (found.size === lastN) stall++; else stall = 0; lastN = found.size;
      }
    }
    return [...found.entries()].map(([u, v]) => ({ u, ...v }));
  }, label);
  for (const { u, idx, video } of urls) { const e = all.get(u) || { tabs: new Set(), video: false, idx }; e.tabs.add(label); e.video = e.video || video; all.set(u, e); }
  console.log(`tab "${label}": ${urls.length} (total ${all.size})`);
}
try {
  // back to overview & open hero
  const ov = p.locator('button[role="tab"]:has-text("Overview")').first(); if (await ov.count()) { await ov.click(); await sleep(1500); }
  const heroBtn = p.locator('button[aria-label^="Photo of"], button[jsaction*="heroHeaderImage"]').first();
  await heroBtn.click({ timeout: 15000 }); await sleep(3000);
  await p.screenshot({ path: join(OUTDIR, '_photos-viewer.png') });
  const tabs = await p.evaluate(() => [...document.querySelectorAll('button[role="tab"]')].map((b) => b.textContent.trim()).filter(Boolean));
  console.log('viewer tabs:', tabs);
  for (const label of tabs) {
    try { await p.locator(`button[role="tab"]:has-text("${label}")`).first().click({ timeout: 5000 }); await sleep(2000); await harvestTab(label); } catch (e) { console.log('tab failed', label, e.message); }
  }
  if (!tabs.length) await harvestTab('All');
} catch (e) { console.log('photos failed', e.message); }
const manifest = [...all.entries()].map(([u, v], i) => ({ n: i + 1, url: u, tabs: [...v.tabs], video: v.video, idx: v.idx }));
writeFileSync(join(OUTDIR, 'photos.json'), JSON.stringify(manifest, null, 2));
await b.close();

// ---------- download ----------
let ok = 0, fail = 0;
for (const m of manifest) {
  const base = join(OUTDIR, `p${String(m.n).padStart(3, '0')}`);
  try {
    const res = await fetch(m.url + '=s2400-k-no', { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 3000) throw new Error('small');
    writeFileSync(base + '.jpg', buf); ok++;
  } catch (e) { fail++; console.log('fail', m.n, e.message); }
  if (m.video || m.tabs.some((t) => /video/i.test(t))) {
    for (const itag of ['m37', 'm22', 'm18']) {
      try { const r = await fetch(m.url + '=' + itag, { headers: { 'User-Agent': UA } }); if (!r.ok) continue; const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 20000) continue; writeFileSync(base + `-${itag}.mp4`, buf); console.log('video', m.n, itag, buf.length); break; } catch {}
    }
  }
  await sleep(100);
}
console.log(`DONE photos: ${ok} ok, ${fail} failed`);
