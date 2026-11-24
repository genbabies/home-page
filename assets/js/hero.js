/* ==========================================================================
   HERO — crossfading scene slider with clickable dots
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  const slider = $('#hero-slider');
  if (!slider) return;

  const slides = $$('.hero-slide', slider);
  const dots = $$('.hero-dots button', slider);
  const INTERVAL = 4500;
  let index = 0;
  let timer = null;

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });
  }

  function start() {
    stop();
    timer = setInterval(() => {
      if (document.hidden || GB.isPaused() || GB.reducedMotion) return;
      show(index + 1);
    }, INTERVAL);
  }
  function stop() { clearInterval(timer); }

  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));

  // Warm the cache so crossfades never flash empty frames
  slides.forEach((slide) => { slide.loading = 'eager'; });

  start();
})();
