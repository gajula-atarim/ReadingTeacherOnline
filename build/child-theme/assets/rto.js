/*
 * Reading Teacher Online – homepage interactions.
 * Hero slider, scroll reveal, decoration overlap check, sticky-header offset,
 * "Ollie says" reading tips and back-to-top button.
 * All slide/section content stays in Elementor; this file only adds behaviour.
 */
(function () {
	'use strict';
	var d = document, w = window;
	var cfg = w.rtoConfig || {};
	var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var inEditor = d.body.classList.contains('elementor-editor-active') || /elementor-preview/.test(w.location.search);

	function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }

	/* Sticky header: let the top bar scroll away, keep the main bar pinned */
	function setTopbar() {
		var tb = d.querySelector('.rto-topbar');
		if (tb) d.documentElement.style.setProperty('--rto-topbar-h', tb.offsetHeight + 'px');
	}

	/* Hero slider ---------------------------------------------------------- */
	function splitWords(el) {
		if (el.getAttribute('data-rto-split')) return;
		el.setAttribute('data-rto-split', '1');
		var i = 0;
		(function walk(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (n) {
				if (n.nodeType === 3) {
					var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
					parts.forEach(function (p) {
						if (!p) return;
						if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
						var o = d.createElement('span'); o.className = 'rto-w';
						var inner = d.createElement('span'); inner.className = 'rto-w-i';
						inner.style.setProperty('--rto-wd', (0.08 * i++).toFixed(2) + 's');
						inner.textContent = p; o.appendChild(inner); frag.appendChild(o);
					});
					n.parentNode.replaceChild(frag, n);
				} else if (n.nodeType === 1) { walk(n); }
			});
		})(el);
	}

	function initHero() {
		var hero = d.querySelector('.rto-hero');
		if (!hero || inEditor) return;
		var slides = $$('.rto-slide', hero);
		if (!slides.length) return;
		$$('.rto-hero-title .elementor-heading-title', hero).forEach(splitWords);
		var cur = 0, hold = false, holdT;
		function go(i) {
			cur = (i + slides.length) % slides.length;
			slides.forEach(function (s, j) {
				var on = j === cur;
				s.classList.toggle('is-active', on);
				s.setAttribute('aria-hidden', on ? 'false' : 'true');
				$$('a, button', s).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
			});
		}
		function manual(i) { hold = true; clearTimeout(holdT); holdT = setTimeout(function () { hold = false; }, 12000); go(i); }
		go(0);
		requestAnimationFrame(function () { hero.classList.add('is-ready'); });
		if (slides.length > 1) {
			[['prev', 'Previous slide', '←', -1], ['next', 'Next slide', '→', 1]].forEach(function (b) {
				var btn = d.createElement('button');
				btn.type = 'button'; btn.className = 'rto-hero-arrow rto-hero-arrow--' + b[0];
				btn.setAttribute('aria-label', b[1]); btn.textContent = b[2];
				btn.addEventListener('click', function () { manual(cur + b[3]); });
				hero.appendChild(btn);
			});
			if (!reduce) setInterval(function () { if (!hold && !d.hidden) go(cur + 1); }, 6000);
		}
	}

	/* Scroll reveal --------------------------------------------------------- */
	function initReveal() {
		if (reduce || inEditor || !('IntersectionObserver' in w)) return;
		var items = [];
		$$('.rto-section > .rto-inner').forEach(function (inner) {
			$$(':scope > *', inner).forEach(function (el, idx) {
				if (el.classList.contains('rto-decor') || getComputedStyle(el).position === 'absolute') return;
				el.style.setProperty('--rto-d', Math.min(idx, 5) * 130 + 'ms');
				el.classList.add('rto-reveal');
				items.push(el);
			});
		});
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
		}, { threshold: 0.1 });
		items.forEach(function (el) { io.observe(el); });
		setTimeout(function () {
			items.forEach(function (el) { if (el.getBoundingClientRect().top < w.innerHeight * 1.2) el.classList.add('is-in'); });
		}, 1600);
	}

	/* Hide floating decorations that would overlap content on narrow screens */
	function checkDecor() {
		$$('.rto-decor').forEach(function (el) {
			var sec = el.closest('.rto-section, .rto-hero, .rto-landscape');
			if (!sec || sec.classList.contains('rto-landscape')) return;
			el.classList.remove('is-hidden');
			var a = el.getBoundingClientRect(), pad = 20, padY = 50;
			var hit = $$('h1,h2,h3,p,a,button,input,textarea,form,img', sec).some(function (n) {
				if (n.closest('.rto-decor') || n.closest('.rto-slide:not(.is-active)') || n.closest('.rto-slide-bg')) return false;
				var b = n.getBoundingClientRect();
				if (!b.width) return false;
				return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + padY && a.bottom > b.top - padY;
			});
			el.classList.toggle('is-hidden', hit);
		});
	}

	/* Ollie the owl tips + back to top ------------------------------------ */
	function initOllie() {
		if (inEditor || !cfg.owl) return;
		var tips = cfg.tips || [];
		var wrap = d.createElement('div');
		wrap.className = 'rto-ollie';
		wrap.innerHTML = '<button type="button" class="rto-ollie__btn" aria-label="Reading tip from Ollie the owl"><img src="' + cfg.owl + '" alt="" width="78" height="78"></button>' +
			'<div class="rto-ollie__tip" role="status" hidden><strong class="rto-ollie__label">OLLIE SAYS</strong><span class="rto-ollie__text"></span><a class="rto-ollie__cta" href="#"></a>' +
			'<button type="button" class="rto-ollie__close" aria-label="Close tip">×</button></div>';
		d.body.appendChild(wrap);
		var tip = wrap.querySelector('.rto-ollie__tip'), idx = -1, shown = false;
		function render() {
			if (idx < 0) { tip.hidden = true; return; }
			var t = tips[idx % tips.length];
			wrap.querySelector('.rto-ollie__text').textContent = t.t;
			var cta = wrap.querySelector('.rto-ollie__cta'); cta.textContent = t.c; cta.href = t.h;
			tip.hidden = false;
		}
		wrap.querySelector('.rto-ollie__btn').addEventListener('click', function () { idx = (idx + 1) % tips.length; render(); });
		wrap.querySelector('.rto-ollie__close').addEventListener('click', function () { idx = -1; render(); });
		wrap.querySelector('.rto-ollie__cta').addEventListener('click', function () { idx = -1; render(); });
		setInterval(function () { if (idx >= 0) { idx = (idx + 1) % tips.length; render(); } }, 10000);

		var top = d.createElement('a');
		top.className = 'rto-totop'; top.href = '#top'; top.setAttribute('aria-label', 'Back to top'); top.textContent = '↑';
		d.body.appendChild(top);

		w.addEventListener('scroll', function () {
			var s = w.scrollY > 500;
			top.classList.toggle('is-on', s);
			if (s && !shown) { shown = true; setTimeout(function () { if (idx < 0) { idx = 0; render(); } }, 1200); }
		}, { passive: true });
	}

	function ready() {
		setTopbar(); initHero(); initReveal(); initOllie();
		checkDecor(); setTimeout(checkDecor, 1500);
		var rt;
		w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setTopbar(); checkDecor(); }, 150); });
	}
	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready); else ready();
})();
