// Site behaviour: preloader, smooth scroll (Lenis), reveals, active nav link.
// Nothing here is required to read the page: with JS off, everything is visible.

const root = document.documentElement;
const reduced = root.classList.contains('rm');

/* ---------- 1. preloader ("Routing… 100%"), once per visit ---------- */
function runPreloader() {
  const pl = document.querySelector('.preloader');
  if (!pl || root.classList.contains('no-pl')) return Promise.resolve();
  // Opened in a background tab: animation frames are paused, so skip the intro.
  if (document.hidden) { root.classList.add('no-pl'); return Promise.resolve(); }

  const num = pl.querySelector('.pl-num');
  const DURATION = 1000; // ms for the count; the wipe adds ~0.55 s
  // A timer (not requestAnimationFrame) drives the count, so it always ends on
  // time even when the browser throttles frames (battery saver, busy tab).
  return new Promise((resolve) => {
    const t0 = performance.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / DURATION);
      num.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) return;
      clearInterval(timer);
      try { sessionStorage.setItem('mv-preloaded', '1'); } catch (e) { /* private mode: fine */ }
      pl.classList.add('done');
      setTimeout(resolve, 250); // start the hero intro while the wipe is still moving
    }, 33);
  });
}

/* ---------- 2. smooth scroll ---------- */
const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';
let lenis = null;
async function startLenis() {
  if (reduced) return;
  let Lenis;
  try { ({ default: Lenis } = await import(LENIS_URL)); }
  catch (e) { return; } // CDN blocked or offline → normal browser scrolling
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  root.style.scrollBehavior = 'auto'; // Lenis handles smoothing; avoid double easing

  // in-page links go through Lenis so the offset and easing match
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
      if (id !== '#top' && target.focus) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
}

/* ---------- 3. scroll reveals (once) ---------- */
function startReveals() {
  const items = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

/* ---------- 4. active nav link ---------- */
function startNavSpy() {
  const links = [...document.querySelectorAll('.links a')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const setActive = (id) => links.forEach((a) => {
    const on = byId.get(id) === a;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) setActive(e.target.classList.contains('hero') ? 'top' : e.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.hero, main > section[id]').forEach((s) => io.observe(s));
}

/* ---------- go ---------- */
startNavSpy();
startLenis(); // loads in parallel; never blocks the page
runPreloader().then(() => {
  root.classList.add('ready');
  startReveals();
});
