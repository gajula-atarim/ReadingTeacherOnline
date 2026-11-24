// Animation / interaction test against a local replica of the live homepage
// (exact cached HTML + the site's real CSS/JS; images replaced by a placeholder).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2];                 // replica dir
const ORIGIN = 'https://readingteacheronline.wsdfy.com';
const results = []; const missing = new Set();
const ok = (name, pass, detail) => { results.push({ name, pass, detail }); };

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reducedMotion || 'no-preference', hasTouch: !!opts.touch });
  const page = await ctx.newPage();
  page.on('pageerror', e => { const m = 'JS error: ' + e.message.slice(0, 160); if (!results.some(r => r.name === m)) results.push({ name: m, pass: false, detail: '' }); });
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(ORIGIN)) {
      const p = decodeURIComponent(new URL(url).pathname);
      if (p === '/' ) return route.fulfill({ path: path.join(ROOT, 'index.html'), contentType: 'text/html' });
      if (/\.(webp|jpe?g|png|gif)$/i.test(p)) return route.fulfill({ path: path.join(ROOT, 'placeholder.jpg'), contentType: 'image/jpeg' });
      if (p.startsWith('/wp-json/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      const f = path.join(ROOT, 'site', p);
      if (fs.existsSync(f)) return route.fulfill({ path: f, contentType: p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'application/javascript' : undefined });
      missing.add(p); return route.fulfill({ status: 404, body: '' });
    }
    return route.abort();
  });
  await page.goto(ORIGIN + '/', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  return { ctx, page };
}

const cs = (page, sel, prop, i = 0) => page.evaluate(([s, p, i]) => { const el = document.querySelectorAll(s)[i]; return el ? getComputedStyle(el)[p] : null; }, [sel, prop, i]);
const scale = t => { if (!t || t === 'none') return 1; const m = t.match(/matrix\(([^,]+),([^,]+)/); return m ? +(+m[1]).toFixed(3) : 1; };
const ty = t => { if (!t || t === 'none') return 0; const m = t.match(/matrix\(([^)]+)\)/); return m ? +(+m[1].split(',')[5]).toFixed(1) : 0; };
const tx = t => { if (!t || t === 'none') return 0; const m = t.match(/matrix\(([^)]+)\)/); return m ? +(+m[1].split(',')[4]).toFixed(1) : 0; };
async function hoverCheck(page, hoverSel, measureSel, prop, fn, wait = 900, idx = 0) {
  const el = page.locator(hoverSel).nth(idx);
  await el.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await page.waitForTimeout(400);
  const before = await cs(page, measureSel, prop, idx);
  await el.hover(); await page.waitForTimeout(wait);
  const after = await cs(page, measureSel, prop, idx);
  await page.mouse.move(0, 0); await page.waitForTimeout(wait);
  const back = await cs(page, measureSel, prop, idx);
  return { before: fn(before), after: fn(after), back: fn(back), raw: [before, after] };
}
const animNamesDuringHover = async (page, hoverSel, idx = 0) => {
  const el = page.locator(hoverSel).nth(idx); await el.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await page.waitForTimeout(300);
  await el.hover(); await page.waitForTimeout(120);
  const names = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.animationName).map(a => a.animationName));
  await page.mouse.move(0, 0); return [...new Set(names)];
};

(async () => {
  const browser = await chromium.launch();
  // ---------- Desktop ----------
  let { page } = await newPage(browser);
  const activeIdx = () => page.evaluate(() => [...document.querySelectorAll('.rto-slide')].findIndex(s => s.classList.contains('is-active')));
  ok('Hero: slide 1 active on load', (await activeIdx()) === 0, `active=${await activeIdx()}`);
  ok('Hero: prev/next arrows injected', (await page.locator('.rto-hero-arrow').count()) === 2, '');
  const words = await page.evaluate(() => { const w = document.querySelectorAll('.rto-slide.is-active .rto-w-i'); return { n: w.length, op: w.length ? getComputedStyle(w[w.length - 1]).opacity : null }; });
  await page.waitForTimeout(1200);
  const words2 = await page.evaluate(() => { const w = document.querySelectorAll('.rto-slide.is-active .rto-w-i'); return getComputedStyle(w[w.length - 1]).opacity; });
  ok('Hero: headline split into words and animates in', words.n > 3 && +words2 === 1, `words=${words.n}, last word opacity → ${words2}`);
  const hl = await page.evaluate(() => getComputedStyle(document.querySelector('.rto-slide.is-active .hl .rto-w-i') || document.body).color);
  ok('Hero: highlighted words yellow', hl === 'rgb(255, 201, 74)', hl);
  const z1 = scale(await cs(page, '.rto-slide.is-active .rto-slide-bg img', 'transform'));
  await page.waitForTimeout(2500);
  const z2 = scale(await cs(page, '.rto-slide.is-active .rto-slide-bg img', 'transform'));
  ok('Hero: background slow zoom (Ken Burns)', z2 > z1 && z2 > 1.01, `scale ${z1} → ${z2}`);
  const textOp = await cs(page, '.rto-slide.is-active .rto-hero-text', 'opacity');
  ok('Hero: body text + button fade up', +textOp === 1 && +(await cs(page, '.rto-slide.is-active .rto-hero-cta', 'opacity')) === 1, `text opacity ${textOp}`);
  await page.waitForTimeout(2600);
  ok('Hero: autoplay advances after ~6s', (await activeIdx()) === 1, `active=${await activeIdx()}`);
  const fadeOp = await cs(page, '.rto-slide', 'opacity', 0);
  ok('Hero: previous slide fades out', +fadeOp < 1, `slide1 opacity ${fadeOp}`);
  await page.click('.rto-hero-arrow--next'); await page.waitForTimeout(300);
  ok('Hero: next arrow works', (await activeIdx()) === 2, `active=${await activeIdx()}`);
  await page.click('.rto-hero-arrow--prev'); await page.waitForTimeout(300);
  ok('Hero: prev arrow works', (await activeIdx()) === 1, `active=${await activeIdx()}`);
  await page.waitForTimeout(6500);
  ok('Hero: autoplay paused after manual click (12s hold)', (await activeIdx()) === 1, `active=${await activeIdx()}`);

  // floating decorations
  const decor = async sel => { const a = await cs(page, sel, 'transform'); await page.waitForTimeout(700); const b = await cs(page, sel, 'transform'); return [a, b]; };
  const [b1, b2] = await decor('.rto-hero .rto-bob img');
  ok('Decor: bob (float up/down) running', ty(b1) !== ty(b2), `translateY ${ty(b1)} → ${ty(b2)}`);
  const [s1, s2] = await decor('.rto-spin img');
  ok('Decor: slow spin running', s1 !== s2, `${(s1||'').slice(0,40)} → ${(s2||'').slice(0,40)}`);
  const decorAnims = await page.evaluate(() => [...document.querySelectorAll('.rto-decor img')].filter(i => getComputedStyle(i).animationName !== 'none').length);
  ok('Decor: every floating illustration animated', decorAnims === (await page.locator('.rto-decor img').count()), `${decorAnims}/${await page.locator('.rto-decor img').count()}`);

  // scroll reveal
  const rev = await page.evaluate(() => [...document.querySelectorAll('.rto-reveal')].map(e => ({ y: e.getBoundingClientRect().top, op: getComputedStyle(e).opacity })));
  const below = rev.filter(r => r.y > 1100);
  ok('Reveal: below-the-fold blocks hidden before scrolling', below.length > 5 && below.every(r => +r.op === 0), `${below.length} hidden`);
  for (let y = 0; y < 7000; y += 300) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(140); }
  await page.waitForTimeout(1400);
  const rev2 = await page.evaluate(() => [...document.querySelectorAll('.rto-reveal')].map(e => getComputedStyle(e).opacity));
  ok('Reveal: every block fades/slides in on scroll', rev2.length > 10 && rev2.every(o => +o === 1), `${rev2.filter(o => +o === 1).length}/${rev2.length} visible`);

  // Ollie + back to top
  ok('Back-to-top button appears after scrolling', await page.evaluate(() => document.querySelector('.rto-totop')?.classList.contains('is-on')), '');
  ok('Ollie tip bubble opens after scrolling', await page.evaluate(() => !document.querySelector('.rto-ollie__tip')?.hidden), '');
  ok('Ollie owl bobs', (await cs(page, '.rto-ollie__btn', 'animationName')) === 'rto-bob', await cs(page, '.rto-ollie__btn', 'animationName'));
  const tip1 = await page.textContent('.rto-ollie__text'); await page.click('.rto-ollie__btn', {force:true}); const tip2 = await page.textContent('.rto-ollie__text');
  ok('Ollie: clicking owl shows next tip', tip1 !== tip2, '');
  await page.click('.rto-ollie__close', {force:true});
  ok('Ollie: close button hides tip', await page.evaluate(() => document.querySelector('.rto-ollie__tip').hidden), '');
  const tt = await page.evaluate(() => scrollY); await page.click('.rto-totop', {force:true}); await page.waitForTimeout(2000);
  ok('Back-to-top scrolls to top', (await page.evaluate(() => scrollY)) < 50, `${tt} → ${await page.evaluate(() => scrollY)}`);

  // hovers
  let h;
  h = await hoverCheck(page, '.rto-offer .rto-btn .elementor-button', '.rto-offer .rto-btn .elementor-button', 'transform', ty);
  ok('Hover: pill button lifts', h.after < h.before && h.back === h.before, JSON.stringify(h.after) + 'px');
  h = await hoverCheck(page, '.rto-offer .rto-btn .elementor-button', '.rto-offer .rto-btn .elementor-button', 'backgroundColor', x => x);
  ok('Hover: pill button turns navy', h.after === 'rgb(23, 59, 76)', `${h.before} → ${h.after}`);
  ok('Hover: pill button wiggles', (await animNamesDuringHover(page, '.rto-offer .rto-btn .elementor-button')).includes('rto-wiggle'), '');
  h = await hoverCheck(page, '.rto-offer-card', '.rto-offer-card', 'transform', ty);
  ok('Hover: offer card lifts 8px', h.after === -8 && h.back === 0, `${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-offer-card', '.rto-offer-card .rto-card-img img', 'transform', scale, 1000);
  ok('Hover: offer card photo zooms', h.after > 1.05, `scale ${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-prog-card', '.rto-prog-card', 'transform', ty);
  ok('Hover: program card lifts 10px', h.after === -10, `${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-prog-card', '.rto-prog-card', 'boxShadow', x => x);
  ok('Hover: program card gains shadow', h.before !== h.after && h.after !== 'none', '');
  h = await hoverCheck(page, '.rto-prog-card', '.rto-prog-card .rto-prog-img img', 'transform', scale, 1000);
  ok('Hover: program card photo zooms', h.after > 1.05, `scale ${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-more a', '.rto-more a', 'color', x => x);
  ok('Hover: "Find out more" turns navy', h.after === 'rgb(23, 59, 76)', `${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-step', '.rto-step', 'transform', tx, 600);
  ok('Hover: step card slides right 8px', h.after === 8 && h.back === 0, `${h.before} → ${h.after}`);
  ok('Hover: step number badge pops', (await animNamesDuringHover(page, '.rto-step')).includes('rto-badge-pop'), '');
  h = await hoverCheck(page, '.rto-gallery .elementor-widget-image', '.rto-gallery img', 'transform', scale, 1000);
  ok('Hover: gallery photo zooms', h.after > 1.05, `scale ${h.before} → ${h.after}`);
  ok('Gallery: zoom-in cursor', (await cs(page, '.rto-gallery .elementor-widget-image a', 'cursor')) === 'zoom-in', '');
  h = await hoverCheck(page, '.rto-post', '.rto-post .rto-post-img img', 'transform', scale, 1000);
  ok('Hover: blog photo zooms', h.after > 1.05, `scale ${h.before} → ${h.after}`);
  h = await hoverCheck(page, '.rto-post', '.rto-post .rto-post-title .elementor-heading-title', 'color', x => x);
  ok('Hover: blog title turns teal', h.after === 'rgb(0, 114, 126)', `${h.before} → ${h.after}`);
  await page.evaluate(() => scrollTo(0, 0)); await page.mouse.move(0, 400); await page.waitForTimeout(500);
  const nb = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.rto-nav li.menu-item > a')[1]).backgroundSize);
  await page.hover('.rto-nav li.menu-item:nth-child(2) > a'); await page.waitForTimeout(600);
  const na = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.rto-nav li.menu-item > a')[1]).backgroundSize);
  ok('Hover: menu link yellow blob grows', nb !== na && na.startsWith('100%'), `${nb} → ${na}`);
  ok('Menu: Home shows yellow blob', (await page.evaluate(() => getComputedStyle(document.querySelector('.rto-nav li.menu-item > a')).backgroundSize)).startsWith('100%'), '');
  h = await hoverCheck(page, '.rto-header-cta .elementor-button', '.rto-header-cta .elementor-button', 'backgroundColor', x => x);
  ok('Hover: header "Free Consultation" fills teal', h.after === 'rgb(0, 114, 126)', `${h.before} → ${h.after}`);
  ok('Hover: logo wiggles', (await animNamesDuringHover(page, '.rto-brand')).includes('rto-logo-wiggle'), '');
  h = await hoverCheck(page, '.rto-footer-links .elementor-icon-list-item a', '.rto-footer-links .elementor-icon-list-text', 'backgroundSize', x => x, 500);
  ok('Hover: footer link underline grows', h.after.startsWith('100%') && h.back.startsWith('0%'), `${h.before} → ${h.after}`);
  h = await hoverCheck(page, 'form.rto-cf7 .wpcf7-submit', 'form.rto-cf7 .wpcf7-submit', 'transform', ty);
  ok('Hover: Send Message button lifts', h.after < 0, `${h.before} → ${h.after}`);
  // focus
  await page.focus('form.rto-cf7 input[type=email]'); await page.waitForTimeout(400);
  ok('Focus: form field border turns teal', (await cs(page, 'form.rto-cf7 input[type=email]', 'borderTopColor')) === 'rgb(0, 114, 126)', await cs(page, 'form.rto-cf7 input[type=email]', 'borderTopColor'));
  // sticky header
  await page.evaluate(() => scrollTo(0, 2500)); await page.waitForTimeout(300);
  const hdrTop = await page.evaluate(() => document.querySelector('.rto-topbar').getBoundingClientRect().top);
  ok('Sticky header: whole header stays pinned at top (desktop)', Math.abs(hdrTop) < 2, `top=${hdrTop}`);
  // lightbox
  await page.locator('.rto-gallery .elementor-widget-image a').nth(2).scrollIntoViewIfNeeded();
  await page.locator('.rto-gallery .elementor-widget-image a').nth(2).click();
  await page.waitForTimeout(2500);
  const lb = await page.evaluate(() => { const m = document.querySelector('.elementor-lightbox'); return m ? { vis: getComputedStyle(m.closest('.dialog-widget') || m).display, arrows: !!document.querySelector('.elementor-lightbox .elementor-swiper-button-next, .elementor-lightbox .elementor-swiper-button, .elementor-slideshow__footer, .elementor-lightbox [class*=swiper-button]'), imgs: document.querySelectorAll('.elementor-lightbox img').length } : null; });
  ok('Gallery: clicking a photo opens the lightbox', !!lb && lb.vis !== 'none', JSON.stringify(lb));
  ok('Gallery: lightbox is a 12-photo slideshow with arrows', !!lb && lb.arrows && lb.imgs >= 12, JSON.stringify(lb));
  await page.close();

  // ---------- Mobile + reduced motion ----------
  ({ page } = await newPage(browser, { viewport: { width: 390, height: 844 }, touch: true }));
  ok('Mobile: hero autoplay advances', await (async () => { const a = await page.evaluate(() => [...document.querySelectorAll('.rto-slide')].findIndex(s => s.classList.contains('is-active'))); await page.waitForTimeout(6500); const b = await page.evaluate(() => [...document.querySelectorAll('.rto-slide')].findIndex(s => s.classList.contains('is-active'))); return a === 0 && b === 1; })(), '');
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok('Mobile: no horizontal overflow from animations', ow <= 0, `overflow=${ow}px`);
  for (let y = 0; y < 9000; y += 350) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(110); }
  await page.waitForTimeout(1400);
  const mrev = await page.evaluate(() => [...document.querySelectorAll('.rto-reveal')].map(e => getComputedStyle(e).opacity));
  ok('Mobile: scroll reveal completes', mrev.every(o => +o === 1), `${mrev.filter(o => +o === 1).length}/${mrev.length}`);
  await page.close();
  ({ page } = await newPage(browser, { reducedMotion: 'reduce' }));
  const ra = await page.evaluate(() => [...document.querySelectorAll('.rto-slide')].findIndex(s => s.classList.contains('is-active'))); await page.waitForTimeout(6500);
  const rb = await page.evaluate(() => [...document.querySelectorAll('.rto-slide')].findIndex(s => s.classList.contains('is-active')));
  ok('Reduced motion: slider still advances', ra === 0 && rb === 1, `${ra} → ${rb}`);
  ok('Reduced motion: floating decor paused', (await cs(page, '.rto-bob img', 'animationName')) === 'none', '');
  ok('Reduced motion: content visible without reveal', await page.evaluate(() => [...document.querySelectorAll('.rto-section .rto-inner > *')].every(e => +getComputedStyle(e).opacity === 1)), '');
  await browser.close();

  const pad = s => (s + ' '.repeat(60)).slice(0, 60);
  for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + pad(r.name) + ' ' + (r.detail || ''));
  console.log(`\n${results.filter(r => r.pass).length}/${results.length} passed`);
  if (missing.size) console.log('Not mirrored (404 locally):', [...missing].join(', '));
})();
