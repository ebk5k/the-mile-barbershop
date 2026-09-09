/* The Mile barbershop — app logic. No frameworks. */
(function () {
  const M = window.MILE; const $ = (s, r) => (r || document).querySelector(s); const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const state = { lang: 'en', viewerIndex: 0 };

  /* ---------- language ---------- */
  function detectLang() {
    try { const s = localStorage.getItem('mile.lang'); if (s === 'en' || s === 'es') return s; } catch (e) {}
    const langs = navigator.languages || [navigator.language || 'en'];
    return langs.some((l) => /^es/i.test(l)) ? 'es' : 'en';
  }
  function setLang(lang) {
    state.lang = lang; document.documentElement.lang = lang;
    $$('[data-en]').forEach((el) => { const v = el.dataset[lang]; if (v != null) el.textContent = v; });
    $$('.lang [data-l]').forEach((el) => el.classList.toggle('on', el.dataset.l === lang));
    try { localStorage.setItem('mile.lang', lang); } catch (e) {}
    renderStatus(); renderHours(); renderServices(); renderReviews(); renderPhotos();
  }

  /* ---------- hours / open status ---------- */
  function nowInLA() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: M.timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { d: days.indexOf(get('weekday')), m: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  }
  const fmt = (hm, lang) => { let [h, m] = hm; const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 || 12; return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''} ${ap}`; };
  const dayName = (i, lang, short) => { const d = M.hours[i]; const n = d[lang]; return short ? n.slice(0, 3) : n; };
  function openState() {
    const { d, m } = nowInLA(); const today = M.hours[d]; const lang = state.lang;
    if (today.open) { const o = today.open[0] * 60 + today.open[1], c = today.close[0] * 60 + today.close[1];
      if (m >= o && m < c) return { open: true, text: lang === 'es' ? `Abierto · cierra ${fmt(today.close, lang)}` : `Open now · closes ${fmt(today.close, lang)}` };
      if (m < o) return { open: false, text: lang === 'es' ? `Cerrado · abre ${fmt(today.open, lang)}` : `Closed · opens ${fmt(today.open, lang)}` }; }
    for (let i = 1; i <= 7; i++) { const n = M.hours[(d + i) % 7]; if (n.open) { const dn = i === 1 ? (lang === 'es' ? 'mañana' : 'tomorrow') : dayName((d + i) % 7, lang, true);
      return { open: false, text: lang === 'es' ? `Cerrado · abre ${dn} ${fmt(n.open, lang)}` : `Closed · opens ${dn} ${fmt(n.open, lang)}` }; } }
    return { open: false, text: '' };
  }
  function renderStatus() {
    const s = openState();
    [['#status', '#status-text'], ['#status2', '#status-text2']].forEach(([c, t]) => { const chip = $(c), txt = $(t); if (!chip) return; chip.classList.toggle('closed', !s.open); txt.textContent = s.text; });
  }
  function renderHours() {
    const tbl = $('#hours'); if (!tbl) return; const { d } = nowInLA(); const lang = state.lang;
    const order = [1, 2, 3, 4, 5, 6, 0];
    tbl.innerHTML = order.map((i) => { const h = M.hours[i]; const closed = !h.open;
      return `<tr class="${i === d ? 'today' : ''} ${closed ? 'closed' : ''}"><td data-today="${lang === 'es' ? 'hoy' : 'today'}">${h[lang]}</td><td>${closed ? (lang === 'es' ? 'Cerrado' : 'Closed') : `${fmt(h.open, lang)} – ${fmt(h.close, lang)}`}</td></tr>`; }).join('');
  }

  /* ---------- services ---------- */
  const ICON = {
    cut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="m9.2 14.8 8.8-11M14.8 14.8 6 3.8"/></svg>',
    fade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="7" y="9" width="10" height="12" rx="2"/><path d="M8 9V6h8v3M9 6l-.5-3h7L15 6M10 13h4M10 16h4"/></svg>',
    kids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.4l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/></svg>',
    beard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l3 2-3 2H4zM7 12v8M11 12v4"/></svg>',
    nails: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v4H9zM8 7h8l1 6a5 5 0 0 1-10 0z"/><path d="M12 13v8"/></svg>'
  };
  function renderServices() {
    const ul = $('#service-list'); if (!ul) return; const lang = state.lang;
    ul.innerHTML = M.services.map((s) => `<li class="service"><span class="hex" aria-hidden="true">${ICON[s.id] || ICON.cut}</span><div><h3>${s[lang]}</h3><p>${lang === 'es' ? s.des : s.den}</p></div><a class="go" href="tel:${M.phone.tel}" aria-label="${lang === 'es' ? 'Llamar' : 'Call'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>`).join('');
  }

  /* ---------- reviews ---------- */
  const G = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z" fill="#EA4335"/></svg>';
  function renderReviews() {
    const rail = $('#review-rail'); if (!rail) return; const lang = state.lang;
    rail.innerHTML = M.reviews.map((r) => `<article class="review"><div class="who"><span class="avatar" aria-hidden="true">${r.author.trim()[0].toUpperCase()}</span><div><div class="name">${r.author}</div><div class="when">${r.when[lang]}${r.meta ? ' · ' + r.meta : ''}</div></div></div><div class="stars" aria-label="${r.stars} stars">${'★'.repeat(r.stars)}</div><p>${r.text}</p><div class="src">${G}<span>${lang === 'es' ? 'Reseña de Google' : 'Google review'}</span></div></article>`).join('');
    const topics = $('#topics'); if (topics) topics.innerHTML = M.reviewTopics.map((t) => `<span class="topic">${t[lang]} <b>×${t.n}</b></span>`).join('');
  }

  /* ---------- photos: feed, nails, grid, viewer ---------- */
  const EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
  const cap = (p) => (state.lang === 'es' ? p.es : p.en);
  const work = () => M.photos.filter((p) => p.kind !== 'nail');
  const allViewable = () => M.photos;
  function renderPhotos() {
    const feedEl = $('#feed-rail'), nailEl = $('#nail-grid'), gridEl = $('#grid'); const lang = state.lang;
    const w = work(); const feed = w.slice(0, 10);
    if (feedEl) feedEl.innerHTML = feed.map((p, i) => `<button class="card-photo" type="button" role="listitem" data-open-viewer="${M.photos.indexOf(p)}" aria-label="${cap(p)}"><img src="assets/img/feed/${p.id}.webp" width="864" height="1152" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" alt="${cap(p)}"><span class="expand" aria-hidden="true">${EXPAND}</span><span class="cap"><b>${cap(p)}</b><i>${i + 1}/${feed.length}</i></span></button>`).join('');
    const nails = M.photos.filter((p) => p.kind === 'nail');
    if (nailEl) nailEl.innerHTML = nails.map((p) => `<button class="tile" type="button" data-open-viewer="${M.photos.indexOf(p)}" aria-label="${cap(p)}"><img src="assets/img/feed/${p.id}.webp" width="864" height="1152" loading="lazy" decoding="async" alt="${cap(p)}"></button>`).join('');
    if (gridEl) gridEl.innerHTML = w.map((p) => `<button class="tile" type="button" data-open-viewer="${M.photos.indexOf(p)}" aria-label="${cap(p)}"><img src="assets/img/sq/${p.id}.webp" width="864" height="864" loading="lazy" decoding="async" alt="${cap(p)}"></button>`).join('');
    // viewer slides (built once; captions refreshed per language)
    const vs = $('#viewer-scroll');
    if (vs && !vs.children.length) vs.innerHTML = allViewable().map((p, i) => `<div class="slide" data-i="${i}"><img src="assets/img/feed/${p.id}.webp" loading="lazy" decoding="async" alt=""><div class="cap"><div><b data-cap="${i}"></b><i>${M.name} · Huntington Park</i></div><a class="btn primary small" href="tel:${M.phone.tel}"><span data-callcap>Call</span></a></div></div>`).join('');
    $$('[data-cap]').forEach((b) => { b.textContent = cap(allViewable()[+b.dataset.cap]); });
    $$('[data-callcap]').forEach((s) => { s.textContent = lang === 'es' ? 'Llamar para reservar' : 'Call to book'; });
    const hint = $('#viewer-hint'); if (hint) hint.textContent = hint.dataset[lang];
  }

  /* ---------- viewer ---------- */
  const viewer = $('#viewer'), vscroll = $('#viewer-scroll'), counter = $('#viewer-counter');
  function openViewer(i) {
    if (!viewer) return; viewer.hidden = false; document.body.classList.add('viewer-open');
    const slide = vscroll.children[i]; if (slide) vscroll.scrollTop = slide.offsetTop;
    updateCounter(); try { history.pushState({ viewer: true }, ''); } catch (e) {}
    $('#viewer-hint').classList.remove('off'); $('#viewer-close').focus();
  }
  function closeViewer(fromPop) {
    if (!viewer || viewer.hidden) return; viewer.hidden = true; document.body.classList.remove('viewer-open');
    if (!fromPop && history.state && history.state.viewer) history.back();
  }
  function updateCounter() { const n = vscroll.children.length; const i = Math.round(vscroll.scrollTop / Math.max(1, vscroll.clientHeight)); counter.textContent = `${Math.min(n, i + 1)} / ${n}`; if (i > 0) $('#viewer-hint').classList.add('off'); }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-open-viewer]'); if (b) { e.preventDefault(); openViewer(+b.dataset.openViewer); } });
  $('#viewer-close').addEventListener('click', () => closeViewer(false));
  document.addEventListener('keydown', (e) => { if (viewer.hidden) return; if (e.key === 'Escape') closeViewer(false); if (e.key === 'ArrowDown' || e.key === 'ArrowRight') vscroll.scrollBy({ top: vscroll.clientHeight, behavior: 'smooth' }); if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') vscroll.scrollBy({ top: -vscroll.clientHeight, behavior: 'smooth' }); });
  window.addEventListener('popstate', () => closeViewer(true));
  let vt; vscroll.addEventListener('scroll', () => { cancelAnimationFrame(vt); vt = requestAnimationFrame(updateCounter); }, { passive: true });

  /* ---------- header, dock, reveal ---------- */
  const top = $('#top'), dock = $('#dock'), hero = $('.hero');
  const reveals = [];
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    top.classList.toggle('scrolled', y > 24);
    dock.classList.toggle('on', y > hero.offsetHeight - 120);
    const vh = window.innerHeight;
    for (const el of reveals) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.92) el.classList.add('in'); }
  }
  $$('.section-head, .service-list, .review, .shot, .card, .rail-foot, .nail-grid, .grid, .note, .access').forEach((el) => { el.classList.add('reveal'); reveals.push(el); });
  let st; window.addEventListener('scroll', () => { cancelAnimationFrame(st); st = requestAnimationFrame(onScroll); }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- init ---------- */
  $('#lang').addEventListener('click', () => setLang(state.lang === 'en' ? 'es' : 'en'));
  $('#year').textContent = new Date().getFullYear();
  setLang(detectLang());
  setInterval(renderStatus, 60000);
  requestAnimationFrame(() => { onScroll(); setTimeout(onScroll, 400); });
})();
