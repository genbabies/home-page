/* ==========================================================================
   UI — header behaviour, mobile nav, header tool buttons, scroll reveal,
   card tilt, bedtime mode.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  /* ---------- Header shadow on scroll ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  const nav = $('#main-nav');
  const navToggle = $('#nav-toggle');

  function setNav(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  $$('a', nav).forEach((link) => link.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setNav(false); });

  /* ---------- Header tool buttons ---------- */
  $('#sound').addEventListener('click', () => GB.setSound(!GB.sound));
  $('#motion').addEventListener('click', () => GB.setPaused(!GB.isPaused()));

  /* ---------- Bedtime mode ---------- */
  const bedtimeBtn = $('#bedtime');

  GB.setBedtime = function setBedtime(on) {
    document.body.classList.toggle('night', on);
    GB.setPaused(on);
    bedtimeBtn.textContent = on ? 'Return to daytime ☀' : 'Enter bedtime mode ☾';
  };
  bedtimeBtn.addEventListener('click', () => GB.setBedtime(!document.body.classList.contains('night')));

  /* ---------- Scroll reveal ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item, index) => {
      // Light stagger for siblings revealed together (cards in a row)
      item.style.transitionDelay = (index % 5) * 60 + 'ms';
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('in'));
  }

  /* ---------- Card tilt (mouse / pen only) ---------- */
  if (!GB.reducedMotion) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || GB.isPaused()) return;
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        card.style.setProperty('--lift', '-6px');
        card.style.transitionDelay = '0ms';
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
        card.style.removeProperty('--lift');
      });
    });
  }

  /* ---------- Sparkles on character buttons ---------- */
  $$('.character button').forEach((btn) =>
    btn.addEventListener('click', (event) => GB.sparkle(event.clientX, event.clientY)));
})();
