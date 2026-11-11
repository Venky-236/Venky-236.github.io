// Site behaviour. Step 4 adds Lenis smooth scroll, reveals and the preloader.
// For now: highlight the nav link of the section in view.

const links = [...document.querySelectorAll('.links a')];
const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));

const setActive = (id) => {
  links.forEach((a) => {
    const on = byId.get(id) === a;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
};

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) setActive(e.target.id === 'main' ? 'top' : e.target.id);
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);

document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
const hero = document.querySelector('.hero');
if (hero) {
  new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive('top'); },
    { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
}
