(() => {
  'use strict';
  const buttons = Array.from(document.querySelectorAll('[data-language]'));
  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"]');

  function applyLanguage(language, remember) {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = title.dataset[language];
    description.content = description.dataset[language];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    if (remember) {
      try { localStorage.setItem('wenmy-homepage-language', language); } catch (_) { /* The switch also works without storage. */ }
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language, true)));
  applyLanguage(document.documentElement.lang.startsWith('zh') ? 'zh' : 'en', false);

  const links = Array.from(document.querySelectorAll('.section-nav a'));
  function markSection(id) {
    links.forEach(link => {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  markSection(location.hash.slice(1) || 'about');
  links.forEach(link => link.addEventListener('click', () => markSection(link.getAttribute('href').slice(1))));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) markSection(visible[0].target.id);
    }, { rootMargin: '-8% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
  }
})();
