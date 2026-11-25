/* ==========================================================================
   CONTACT PAGE
   - Mobile nav + header shadow (this page doesn't load ui.js)
   - Sends the form to support@gen-babies.com through FormSubmit
     (https://formsubmit.co) — a free relay that works on static hosting.
     The very first submission makes FormSubmit email an activation link to
     the support address; click it once and every later message is delivered.
   - If anything fails, a prefilled mailto: link is offered instead.
   ========================================================================== */
(function () {
  'use strict';

  const SUPPORT_EMAIL = 'support@gen-babies.com';
  const ENDPOINT = 'https://formsubmit.co/ajax/' + SUPPORT_EMAIL;

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
  const sendBtn = document.getElementById('send-btn');

  function setStatus(text, kind) {
    status.className = 'form-status' + (kind ? ' ' + kind : '');
    status.textContent = text;
  }

  function mailtoLink(data) {
    const body = `Name: ${data.name}\nEmail: ${data.email}\nTopic: ${data.topic}\n\n${data.message}`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Gen Babies website: ' + data.topic)}&body=${encodeURIComponent(body)}`;
  }

  function showFallback(data) {
    status.className = 'form-status err';
    status.textContent = 'We couldn’t send that just now. ';
    const link = document.createElement('a');
    link.href = mailtoLink(data);
    link.textContent = 'Email us instead';
    status.appendChild(link);
    status.appendChild(document.createTextNode('.'));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Spam trap
    if (form.elements._honey.value) return;

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
      setStatus('Please fill in your name, a valid email and a message.', 'err');
      return;
    }

    sendBtn.disabled = true;
    setStatus('Sending…');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          _subject: 'Gen Babies website: ' + data.topic,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && String(result.success) !== 'false') {
        form.reset();
        setStatus('Thank you! Your message is on its way. 💛', 'ok');
      } else {
        showFallback(data);
      }
    } catch (err) {
      showFallback(data);
    } finally {
      sendBtn.disabled = false;
    }
  });

  form.addEventListener('input', (event) => event.target.classList.remove('invalid'));
})();
