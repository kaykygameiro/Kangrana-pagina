(() => {
  'use strict';
  const config = window.KANGRANA_CONFIG || {};
  const allowedParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'];
  const events = [];
  const track = (name) => {
    const event = { name, at: Date.now() };
    events.push(event);
    window.dispatchEvent(new CustomEvent('kangrana:event', { detail: event }));
  };
  window.KangranaEvents = Object.freeze({ getAll: () => [...events] });

  function httpsUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && !url.username && !url.password ? url : null;
    } catch { return null; }
  }

  function checkoutDestination() {
    const url = httpsUrl(config.CHECKOUT_URL);
    if (!url) return null;
    const incoming = new URLSearchParams(location.search);
    for (const key of allowedParams) {
      const value = incoming.get(key);
      if (value && value.length <= 100 && /^[\p{L}\p{N}_.@-]+$/u.test(value)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  const notice = document.getElementById('notice');
  let noticeTimer;
  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 4800);
  }

  document.querySelectorAll('[data-checkout]').forEach((button) => {
    button.addEventListener('click', () => {
      track('checkout_click');
      const target = checkoutDestination();
      if (target) location.assign(target);
      else showNotice('O checkout está sendo configurado. Volte em breve para acessar o Kangrana.');
    });
  });

  const appUrl = httpsUrl(config.APP_URL);
  if (appUrl) {
    document.querySelectorAll('[data-login-slot]').forEach((slot) => {
      const link = document.createElement('a');
      link.href = appUrl.toString();
      link.textContent = 'Entrar';
      link.className = slot.dataset.class || '';
      link.dataset.login = '';
      link.addEventListener('click', () => track('login_click'));
      slot.replaceWith(link);
    });
  }

  const menu = document.querySelector('.mobile-menu');
  menu?.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', () => { menu.open = false; });
  });
  menu?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });

  const bar = document.getElementById('mobile-cta');
  const hero = document.querySelector('.hero');
  const footer = document.querySelector('.site-footer');
  const mainCtas = [...document.querySelectorAll('main [data-checkout]')];
  let scheduled = false;
  function intersectsViewport(element) {
    const box = element.getBoundingClientRect();
    return box.bottom > 0 && box.top < innerHeight && box.width > 0 && box.height > 0;
  }
  function updateMobileBar() {
    scheduled = false;
    const show = innerWidth <= 800 &&
      hero.getBoundingClientRect().bottom <= 0 &&
      !intersectsViewport(footer) &&
      !mainCtas.some(intersectsViewport);
    bar.hidden = !show;
    bar.setAttribute('aria-hidden', String(!show));
    bar.inert = !show;
  }
  function scheduleMobileBar() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateMobileBar);
    }
  }
  addEventListener('scroll', scheduleMobileBar, { passive: true });
  addEventListener('resize', scheduleMobileBar);
  updateMobileBar();

  document.getElementById('year').textContent = new Date().getFullYear();
  track('page_view');
  const offer = document.getElementById('oferta');
  const demo = document.getElementById('demonstracao');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        track(entry.target === offer ? 'offer_view' : 'demo_view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    observer.observe(offer);
    observer.observe(demo);
  }
})();
