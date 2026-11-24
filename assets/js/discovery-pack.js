/* Printable pack page: personalises the pack with the baby's first name.
   The name comes from the ?name= link parameter or the box in the toolbar,
   and is only ever written with textContent (never as HTML). */
(function () {
  'use strict';

  const DEFAULT_NAME = 'Little Explorer';
  const input = document.getElementById('baby-name');
  const slots = document.querySelectorAll('[data-child]');

  function apply(value) {
    const name = value.trim() || DEFAULT_NAME;
    slots.forEach((slot) => { slot.textContent = name; });
  }

  const fromLink = new URLSearchParams(window.location.search).get('name');
  if (fromLink) {
    input.value = fromLink.slice(0, 30);
    apply(input.value);
  }

  input.addEventListener('input', () => apply(input.value));
  document.getElementById('print-btn').addEventListener('click', () => window.print());
})();
