/* ==========================================================================
   CONTACT PAGE
   - Mobile nav + header shadow (this page doesn't load ui.js)
   - "Send" opens a ready-written email to support@gen-babies.com:
     Gmail compose in a new tab on computers, or the phone's mail app
     (mailto:) on touch devices. Nothing is sent from the website itself,
     so no form service or account is needed.
   ========================================================================== */
(function () {
  'use strict';

  const SUPPORT_EMAIL = 'support@gen-babies.com';
  /* ---------- Header: shadow + mobile nav ---------- */
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setNav(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* ---------- Form ---------- */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  function buildEmail(data) {
    return {
      subject: 'Gen Babies website: ' + data.topic,
      body: `Name: ${data.name}\nEmail: ${data.email}\nTopic: ${data.topic}\n\n${data.message}`,
    };
  }

  const mailtoUrl = (mail) =>
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;

  const gmailUrl = (mail) =>
    'https://mail.google.com/mail/?view=cm&fs=1' +
    `&to=${encodeURIComponent(SUPPORT_EMAIL)}` +
    `&su=${encodeURIComponent(mail.subject)}` +
    `&body=${encodeURIComponent(mail.body)}`;

  function showOpened(mail, usedGmail) {
    status.className = 'form-status ok';
    status.textContent = usedGmail
      ? 'Your email is ready in Gmail — press Send there to finish. 💛 Didn’t open? '
      : 'Your email app should open with the message ready — press Send to finish. 💛 Didn’t open? ';
    const link = document.createElement('a');
    link.href = usedGmail ? mailtoUrl(mail) : gmailUrl(mail);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = usedGmail ? 'Use your email app instead' : 'Open in Gmail instead';
    status.appendChild(link);
    status.appendChild(document.createTextNode('.'));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      topic: form.elements.topic.value,
      message: form.elements.message.value.trim(),
    };

    // Simple validation
    let valid = true;
    ['name', 'email', 'message'].forEach((field) => {
      const input = form.elements[field];
      const bad = !data[field] || (field === 'email' && !input.validity.valid);
      input.classList.toggle('invalid', bad);
      if (bad) valid = false;
    });
    if (!valid) {
      status.className = 'form-status err';
      status.textContent = 'Please fill in your name, a valid email and a message.';
      return;
    }

    const mail = buildEmail(data);

    if (isTouchDevice) {
      // Phones/tablets: hand over to the mail app (Gmail app if it's the default)
      window.location.href = mailtoUrl(mail);
      showOpened(mail, false);
    } else {
      // Computers: Gmail compose in a new tab
      window.open(gmailUrl(mail), '_blank', 'noopener');
      showOpened(mail, true);
    }
  });

  form.addEventListener('input', (event) => event.target.classList.remove('invalid'));
})();
