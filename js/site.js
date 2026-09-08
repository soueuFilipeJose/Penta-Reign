/* Navigation shared by the presentation and the separate character page. */
(function () {
  'use strict';
  const landing = document.body.classList.contains('landing-page');
  const legacyViews = new Set(['ficha', 'overview', 'skills', 'gifts', 'combat', 'content', 'library']);

  function routeLegacyLink() {
    const id = window.location.hash.slice(1);
    if (!landing || !legacyViews.has(id)) return false;
    const destination = new URL('fichas.html', window.location.href);
    destination.hash = id === 'ficha' ? 'overview' : id;
    window.location.replace(destination.href);
    return true;
  }

  if (landing) {
    if (routeLegacyLink()) return;
    const links = [...document.querySelectorAll('.main-nav [data-section]')];
    function markSection(id) {
      links.forEach(link => {
        const active = link.dataset.section === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function revealReference() {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target?.matches('details')) target.open = true;
    }
    revealReference();
    markSection(window.location.hash.slice(1) || 'inicio');
    links.forEach(link => link.addEventListener('click', () => markSection(link.dataset.section)));
    window.addEventListener('hashchange', () => {
      if (!routeLegacyLink()) revealReference();
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) markSection(entry.target.id);
      }, {rootMargin: '-22% 0px -60% 0px', threshold: 0});
      document.querySelectorAll('#inicio, #universo, #sistema').forEach(section => observer.observe(section));
    }
  }

  const dialog = document.getElementById('rulesDialog');
  if (dialog) {
    document.querySelector('.main-nav [aria-current="page"]').addEventListener('click', event => event.preventDefault());
    document.querySelectorAll('[data-open-rules]').forEach(button => {
      button.addEventListener('click', () => dialog.showModal());
    });
    dialog.querySelector('[data-close-rules]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }
})();
