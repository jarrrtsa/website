const BUSINESS_NAME = 'Eetu Lamberg';

const DEFAULT_LOCALE = 'fi';
const LOCALE_STORAGE_KEY = 'locale';
const SUPPORTED_LOCALES = ['fi', 'en', 'sv'];

function getStoredLocale() {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  return SUPPORTED_LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
}

function updateLangSwitcher(lang) {
  document.querySelectorAll('.lang-switcher__btn').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('lang-switcher__btn--active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function applyLocale(lang) {
  const strings = content[lang];
  if (!strings) return;

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = strings[key];
    if (value !== undefined) {
      el.textContent = value;
    }
  });

  const footer = document.querySelector('[data-i18n-footer]');
  if (footer && strings['footer.copyright']) {
    footer.textContent = strings['footer.copyright']
      .replace('{year}', new Date().getFullYear())
      .replace('{name}', BUSINESS_NAME);
  }

  updateLangSwitcher(lang);
}

function setLocale(lang) {
  if (!content[lang]) return;
  localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  applyLocale(lang);
}

function initLanguageSwitcher() {
  document.querySelectorAll('.lang-switcher__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLocale(btn.getAttribute('data-lang'));
    });
  });

  setLocale(getStoredLocale());
}
function initSmoothScroll() {
  document.querySelectorAll('.navbar__link[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('.lightbox__image');
  const trackWrapper = document.querySelector('.carousel__track-wrapper');

  if (!lightbox || !lightboxImage || !trackWrapper) return;

  function openLightbox(src) {
    lightboxImage.src = src;
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.style.overflow = '';
  }

  trackWrapper.addEventListener('click', (e) => {
    const img = e.target.closest('.carousel__slide.is-active img');
    if (!img) return;
    openLightbox(img.currentSrc || img.src);
  });

  lightbox.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) {
      closeLightbox();
    }
  });
}

function initCarousel() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel__track');
  const trackWrapper = carousel.querySelector('.carousel__track-wrapper');
  const prevBtn = carousel.querySelector('.carousel__arrow--prev');
  const nextBtn = carousel.querySelector('.carousel__arrow--next');
  const caption = carousel.querySelector('.carousel__caption');
  const dotsContainer = carousel.querySelector('.carousel__dots');

  const originalSlides = [...track.querySelectorAll('.carousel__slide')];
  const slideCount = originalSlides.length;
  if (slideCount === 0) return;

  const firstClone = originalSlides[0].cloneNode(true);
  const lastClone = originalSlides[slideCount - 1].cloneNode(true);
  track.insertBefore(lastClone, originalSlides[0]);
  track.appendChild(firstClone);

  const allSlides = [...track.querySelectorAll('.carousel__slide')];
  let currentIndex = 1;
  let isAnimating = false;

  originalSlides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Referenssi ${i + 1}`);
    dot.addEventListener('click', () => goTo(i + 1));
    dotsContainer.appendChild(dot);
  });

  const dots = [...dotsContainer.querySelectorAll('.carousel__dot')];
  const slideWidthRatio = () => (window.innerWidth <= 768 ? 0.84 : 0.72);

  function setSlideWidths() {
    const slideWidth = trackWrapper.clientWidth * slideWidthRatio();
    allSlides.forEach((slide) => {
      slide.style.width = `${slideWidth}px`;
    });
  }

  function getRealIndex(index) {
    if (index === 0) return slideCount - 1;
    if (index === slideCount + 1) return 0;
    return index - 1;
  }

  function updateCaption(index) {
    const slide = originalSlides[getRealIndex(index)];
    const key = slide.getAttribute('data-caption-key');
    if (!key || !caption) return;

    caption.setAttribute('data-i18n', key);
    const lang = document.documentElement.lang || DEFAULT_LOCALE;
    const strings = content[lang];
    if (strings && strings[key]) {
      caption.textContent = strings[key];
    }
  }

  function updateUI(index) {
    allSlides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    const realIndex = getRealIndex(index);
    dots.forEach((dot, i) => {
      const isActive = i === realIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    updateCaption(index);
  }

  function getOffset(index) {
    const slide = allSlides[index];
    return (
      trackWrapper.offsetWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2)
    );
  }

  function restoreTransitions(onRestored) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.classList.remove('carousel__track--no-transition');
        if (onRestored) onRestored();
      });
    });
  }

  function applyTransformInstant(index, onRestored) {
    track.classList.add('carousel__track--no-transition');
    track.style.transform = `translateX(${getOffset(index)}px)`;
    void track.offsetHeight;
    restoreTransitions(onRestored);
  }

  function setTransform(index, animate = true) {
    if (animate) {
      track.classList.remove('carousel__track--no-transition');
    }
    track.style.transform = `translateX(${getOffset(index)}px)`;
  }

  function jumpToIndex(index) {
    currentIndex = index;
    updateUI(currentIndex);
    applyTransformInstant(index, () => {
      isAnimating = false;
    });
  }

  function goTo(index, animate = true) {
    if (animate && isAnimating) return;

    currentIndex = index;
    updateUI(currentIndex);
    setTransform(currentIndex, animate);

    if (animate) {
      isAnimating = true;
    }
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;

    if (currentIndex === 0) {
      jumpToIndex(slideCount);
    } else if (currentIndex === slideCount + 1) {
      jumpToIndex(1);
    } else {
      isAnimating = false;
    }
  });

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  function initPosition() {
    setSlideWidths();
    updateUI(currentIndex);
    applyTransformInstant(currentIndex);
  }

  if (document.readyState === 'complete') {
    requestAnimationFrame(initPosition);
  } else {
    window.addEventListener('load', initPosition, { once: true });
  }

  window.addEventListener(
    'resize',
    () => {
      setSlideWidths();
      applyTransformInstant(currentIndex);
    },
    { passive: true }
  );
}

function initActiveNavLink() {
  const navSections = [
    { id: 'services' },
    { id: 'references' },
    { id: 'other-services' },
    { id: 'contact' },
  ];
  const navLinks = document.querySelectorAll('.navbar__link[href^="#"]');

  if (!navLinks.length) return;

  function getActivationLine() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return 96;
    return navbar.getBoundingClientRect().bottom + 8;
  }

  function updateActiveNav() {
    const activationLine = getActivationLine();
    let activeId = navSections[0].id;

    navSections.forEach(({ id }) => {
      const section = document.getElementById(id);
      const heading = section?.querySelector('.section__heading');
      if (!heading) return;

      if (heading.getBoundingClientRect().top <= activationLine) {
        activeId = id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle(
        'navbar__link--active',
        link.getAttribute('href') === `#${activeId}`
      );
    });
  }

  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveNav();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateActiveNav();
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initCarousel();
  initLightbox();
  initActiveNavLink();
  initLanguageSwitcher();
});