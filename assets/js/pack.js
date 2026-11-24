/* ==========================================================================
   PRINTABLE PACK — opens discovery-pack.html in a new tab with the
   baby's first name passed along (it never leaves the device).
   ========================================================================== */
(function () {
  'use strict';
  const { $ } = GB;

  const openBtn = $('#open-pack');
  const nameInput = $('#pack-child');
  if (!openBtn || !nameInput) return;

  function openPack() {
    const name = nameInput.value.trim();
    const url = 'discovery-pack.html' + (name ? '?name=' + encodeURIComponent(name) : '');
    window.open(url, '_blank', 'noopener');
  }

  openBtn.addEventListener('click', openPack);
  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); openPack(); }
  });
})();
