/* ==========================================================================
   CORE — shared namespace (window.GB), helpers, sound, motion, modal.
   Loaded first; every other script builds on this.
   ========================================================================== */
(function () {
  'use strict';

  const GB = (window.GB = window.GB || {});

  /* ---------- DOM helpers ---------- */
  GB.$ = (selector, root = document) => root.querySelector(selector);
  GB.$$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  GB.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sound (off by default) ---------- */
  let audioCtx = null;
  GB.sound = false;

  /** Plays a short, gentle two-note chime when sound is switched on. */
  GB.tone = function tone() {
    if (!GB.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.15);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    } catch (err) {
      /* Audio is a nicety — never let it break the page. */
    }
  };

  GB.setSound = function setSound(on) {
    GB.sound = on;
    const btn = GB.$('#sound');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    GB.$('.tool-label', btn).textContent = on ? 'Sound on' : 'Sound off';
    GB.$('.tool-icon', btn).textContent = on ? '🔊' : '🔇';
    if (on) GB.tone();
  };

  /* ---------- Motion pause ---------- */
  GB.isPaused = () => document.body.classList.contains('paused');

  GB.setPaused = function setPaused(paused) {
    document.body.classList.toggle('paused', paused);
    const btn = GB.$('#motion');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(paused));
    GB.$('.tool-label', btn).textContent = paused ? 'Play' : 'Pause';
    GB.$('.tool-icon', btn).textContent = paused ? '▶' : '⏸';
  };

  /* ---------- Modal dialog ---------- */
  const modal = GB.$('#modal');
  const modalBody = GB.$('#modalbody');

  /**
   * Opens the shared dialog.
   * @param {string} title - Heading text (plain text).
   * @param {string} bodyHtml - Trusted, hard-coded HTML for the body.
   */
  GB.openModal = function openModal(title, bodyHtml) {
    if (!modal || !modalBody) return;
    modalBody.innerHTML =
      '<span class="sample">Gen Babies · Discover together</span>' +
      '<h2 id="modal-title"></h2>' +
      bodyHtml;
    GB.$('#modal-title', modalBody).textContent = title;
    if (typeof modal.showModal === 'function') modal.showModal();
  };

  if (modal) {
    GB.$('.modal-close', modal).addEventListener('click', () => modal.close());
    // Close when the backdrop (outside the dialog box) is clicked.
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      const box = modal.getBoundingClientRect();
      const outside =
        event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom;
      if (outside) modal.close();
    });
  }

  /* ---------- Sparkle burst at a screen position ---------- */
  GB.sparkle = function sparkle(x, y, count = 5) {
    if (GB.reducedMotion || GB.isPaused()) return;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'trail-star';
      star.textContent = '✦';
      star.style.left = x + (Math.random() - 0.5) * 60 + 'px';
      star.style.top = y + 'px';
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 900);
    }
  };
})();
