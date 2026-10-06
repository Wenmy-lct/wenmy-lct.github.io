(() => {
  'use strict';
  const buttons = Array.from(document.querySelectorAll('[data-language]'));
  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"]');
  const localizedImages = Array.from(document.querySelectorAll('[data-alt-en][data-alt-zh]'));
  const localizedLabels = Array.from(document.querySelectorAll('[data-aria-label-en][data-aria-label-zh]'));
  const carousel = document.querySelector('.research-carousel');
  let refreshCarouselStatus = () => {};

  function applyLanguage(language, remember) {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = title.dataset[language];
    description.content = description.dataset[language];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    localizedImages.forEach(img => { img.alt = img.dataset[language === 'zh' ? 'altZh' : 'altEn']; });
    localizedLabels.forEach(element => element.setAttribute('aria-label', element.dataset[language === 'zh' ? 'ariaLabelZh' : 'ariaLabelEn']));
    refreshCarouselStatus();
    if (remember) {
      try { localStorage.setItem('wenmy-homepage-language', language); } catch (_) { /* The switch also works without storage. */ }
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language, true)));
  applyLanguage(document.documentElement.lang.startsWith('zh') ? 'zh' : 'en', false);

  if (carousel) {
    const viewport = carousel.querySelector('.research-demo-list');
    const slides = Array.from(viewport.querySelectorAll('.research-demo'));
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const indicators = Array.from(carousel.querySelectorAll('[data-slide-index]'));
    const status = carousel.querySelector('.carousel-status');
    let currentIndex = 0;
    let lastWidth = 0;
    let scrollFrame = 0;

    refreshCarouselStatus = () => {
      const language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
      const heading = slides[currentIndex].querySelector(`[data-lang="${language}"]`).textContent;
      status.textContent = language === 'zh' ? `第 ${currentIndex + 1} / ${slides.length} 张：${heading}` : `Image ${currentIndex + 1} of ${slides.length}: ${heading}`;
    };

    function fitCurrentSlide() {
      const height = Math.ceil(slides[currentIndex].getBoundingClientRect().height);
      if (height > 0 && viewport.style.height !== `${height}px`) viewport.style.height = `${height}px`;
      const width = viewport.clientWidth;
      if (width !== lastWidth) {
        lastWidth = width;
        viewport.scrollLeft = currentIndex * width;
      }
    }

    function selectSlide(index) {
      const bounded = Math.max(0, Math.min(slides.length - 1, index));
      currentIndex = bounded;
      previous.disabled = bounded === 0;
      next.disabled = bounded === slides.length - 1;
      indicators.forEach((button, i) => button.setAttribute('aria-pressed', String(i === bounded)));
      slides.forEach((slide, i) => {
        slide.inert = i !== bounded;
        slide.setAttribute('aria-hidden', String(i !== bounded));
        if (i !== bounded) slide.querySelectorAll('video').forEach(video => video.pause());
      });
      fitCurrentSlide();
      refreshCarouselStatus();
    }

    function goToSlide(index) {
      const bounded = Math.max(0, Math.min(slides.length - 1, index));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      viewport.scrollTo({ left: bounded * viewport.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    carousel.classList.add('is-enhanced');
    viewport.tabIndex = 0;
    carousel.querySelector('.carousel-controls').hidden = false;
    previous.addEventListener('click', () => goToSlide(currentIndex - 1));
    next.addEventListener('click', () => goToSlide(currentIndex + 1));
    indicators.forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.slideIndex))));
    viewport.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        // A resize can dispatch scroll before the resize observer runs.
        if (viewport.clientWidth !== lastWidth) {
          fitCurrentSlide();
          return;
        }
        const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
        if (index !== currentIndex) selectSlide(index);
      });
    }, { passive: true });
    carousel.addEventListener('keydown', event => {
      if (event.target !== viewport && !event.target.closest('.carousel-controls')) return;
      const target = { ArrowLeft: currentIndex - 1, ArrowRight: currentIndex + 1, Home: 0, End: slides.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      goToSlide(target);
    });
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(fitCurrentSlide);
      slides.forEach(slide => resizeObserver.observe(slide));
    }
    window.addEventListener('resize', fitCurrentSlide);
    viewport.querySelectorAll('img').forEach(image => image.addEventListener('load', fitCurrentSlide));
    selectSlide(0);
  }

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
