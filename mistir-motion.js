/* Vedoy Studio - gentle motion via Anime.js v4.5.0. Bundled for offline Android use. */
import { animate, stagger } from './vendor/anime.esm.min.js';

const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const hasMotion = !media.matches;
if (hasMotion) {
  document.documentElement.classList.add('anime-motion-enabled');
  const heroEls = document.querySelectorAll('.hero .eyebrow, .hero h1, .hero > p:first-of-type, .hero-actions');
  if (heroEls.length) {
    animate(heroEls, {
      opacity: { from: 0, to: 1 },
      y: { from: 16, to: 0 },
      duration: 700,
      delay: stagger(105),
      ease: 'outCubic'
    });
  }
  const ornament = document.querySelector('.hero .deco');
  if (ornament) {
    animate(ornament, {
      y: [-5, 5],
      duration: 3600,
      alternate: true,
      loop: true,
      ease: 'inOutSine'
    });
  }

  const observed = new WeakSet();
  const entrance = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entrance.unobserve(entry.target);
          const el = entry.target;
          el.setAttribute('data-motion-seen', 'true');
          const nodes = [...el.parentElement.querySelectorAll(':scope > .product, :scope > .feature')];
          const i = Math.max(0, nodes.indexOf(el));
          animate(el, {
            opacity: { from: 0, to: 1 },
            y: { from: 17, to: 0 },
            duration: 560,
            delay: Math.min(i % 4 * 55, 190),
            ease: 'outCubic'
          });
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -18px 0px' })
    : null;

  function observeCards() {
    document.querySelectorAll('.product, .feature').forEach((el) => {
      if (observed.has(el)) return;
      observed.add(el);
      if (entrance) entrance.observe(el);
      else {
        el.setAttribute('data-motion-seen', 'true');
        animate(el, {
          opacity: { from: 0, to: 1 },
          y: { from: 12, to: 0 },
          duration: 500,
          ease: 'outCubic'
        });
      }
    });
  }
  observeCards();
  const products = document.getElementById('products');
  if (products && 'MutationObserver' in window) {
    const productsObserver = new MutationObserver(observeCards);
    productsObserver.observe(products, { childList: true });
  }

  const overlay = document.getElementById('overlay');
  const body = document.getElementById('modalbody');
  if (overlay && body && 'MutationObserver' in window) {
    let queued = false;
    const showModalMotion = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (window.getComputedStyle(overlay).display === 'none') return;
        const dialog = overlay.querySelector('.modal');
        if (!dialog) return;
        animate(dialog, {
          opacity: { from: 0, to: 1 },
          y: { from: 14, to: 0 },
          scale: { from: .98, to: 1 },
          duration: 360,
          ease: 'outCubic'
        });
      });
    };
    new MutationObserver(showModalMotion).observe(overlay, { attributes: true, attributeFilter: ['style'] });
    new MutationObserver(showModalMotion).observe(body, { childList: true });
  }
}
