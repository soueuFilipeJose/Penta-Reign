(function () {
  'use strict';
  const colors = {penta: '#473329', ferro: '#69737e', chuva: '#24618e', fogo: '#b84535', trigo: '#fff0a6', eco: '#b499cf'};
  const storageKey = 'penta_reign_theme';
  function apply(theme) {
    const selected = Object.hasOwn(colors, theme) ? theme : 'penta';
    document.documentElement.dataset.theme = selected;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = colors[selected];
    return selected;
  }
  let theme = 'penta';
  try { theme = localStorage.getItem(storageKey) || theme; } catch (error) { /* Theme selection still works without storage. */ }
  theme = apply(theme);
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    if (header) {
      const measureHeader = () => document.documentElement.style.setProperty('--topbar-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
      measureHeader();
      if ('ResizeObserver' in window) new window.ResizeObserver(measureHeader).observe(header);
      else window.addEventListener('resize', measureHeader);
    }
    const select = document.getElementById('realmTheme');
    if (!select) return;
    select.value = theme;
    select.addEventListener('change', () => {
      theme = apply(select.value);
      try { localStorage.setItem(storageKey, theme); } catch (error) { /* Keep the selected theme for this page. */ }
    });
    window.addEventListener('storage', event => {
      if (event.key === storageKey) { theme = apply(event.newValue); select.value = theme; }
    });
  });
})();
