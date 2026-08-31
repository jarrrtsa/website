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
    if (trackWrapper.dataset.suppressClick === 'true') return;
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
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.insertBefore(lastClone, originalSlides[0]);
  track.appendChild(firstClone);

  const allSlides = [...track.querySelectorAll('.carousel__slide')];
  let currentIndex = 1;
  let isAnimating = false;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  originalSlides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Referenssi ${i + 1}`);
    dot.addEventListener('click', () => goToRealIndex(i));
    dotsContainer.appendChild(dot);
  });

  const dots = [...dotsContainer.querySelectorAll('.carousel__dot')];
  const slideWidthRatio = () => (window.innerWidth <= 768 ? 0.91 : 0.72);

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
    const realIndex = getRealIndex(index);

    allSlides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

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

  function finishBoundaryReset(onRestored) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        carousel.classList.remove('is-resetting');
        track.classList.remove('carousel__track--no-transition');
        if (onRestored) onRestored();
      });
    });
  }

  function applyTransformInstant(index, onRestored) {
    track.classList.add('carousel__track--no-transition');
    track.style.transform = `translateX(${getOffset(index)}px)`;
    void track.offsetHeight;
    finishBoundaryReset(onRestored);
  }

  function setTransform(index, animate = true) {
    if (animate) {
      track.classList.remove('carousel__track--no-transition');
    }
    track.style.transform = `translateX(${getOffset(index)}px)`;
  }

  function jumpToIndex(index) {
    isAnimating = true;
    carousel.classList.add('is-resetting');
    track.classList.add('carousel__track--no-transition');
    currentIndex = index;
    track.style.transform = `translateX(${getOffset(index)}px)`;
    updateUI(currentIndex);
    void track.offsetHeight;
    finishBoundaryReset(() => {
      isAnimating = false;
    });
  }

  function goTo(index, animate = true) {
    if (isAnimating) return;
    if (prefersReducedMotion) animate = false;

    if (!animate) {
      let targetIndex = index;
      if (targetIndex <= 0) targetIndex = slideCount;
      if (targetIndex >= slideCount + 1) targetIndex = 1;
      currentIndex = targetIndex;
      updateUI(currentIndex);
      applyTransformInstant(currentIndex);
      return;
    }

    currentIndex = index;
    updateUI(currentIndex);
    setTransform(currentIndex, true);
    isAnimating = true;
  }

  function goToRealIndex(realIndex) {
    goTo(realIndex + 1);
  }

  function step(direction) {
    goTo(currentIndex + direction);
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;

    if (currentIndex === 0) {
      jumpToIndex(slideCount);
      return;
    }

    if (currentIndex === slideCount + 1) {
      jumpToIndex(1);
      return;
    }

    isAnimating = false;
  });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;
  let touchMoved = false;
  const SWIPE_THRESHOLD = 48;
  const SWIPE_DIRECTION_RATIO = 1.2;

  trackWrapper.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchTracking = true;
      touchMoved = false;
    },
    { passive: true }
  );

  trackWrapper.addEventListener(
    'touchmove',
    (e) => {
      if (!touchTracking || e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 || dy > 8) {
        touchMoved = true;
      }
    },
    { passive: true }
  );

  trackWrapper.addEventListener(
    'touchend',
    (e) => {
      if (!touchTracking) return;
      touchTracking = false;

      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!touchMoved || absDx < SWIPE_THRESHOLD || absDx < absDy * SWIPE_DIRECTION_RATIO) {
        return;
      }

      trackWrapper.dataset.suppressClick = 'true';
      window.setTimeout(() => {
        delete trackWrapper.dataset.suppressClick;
      }, 320);

      if (dx < 0) {
        step(1);
      } else {
        step(-1);
      }
    },
    { passive: true }
  );

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
  const MOBILE_BREAKPOINT = 768;
  const navSections = [
    { id: 'services' },
    { id: 'references' },
    { id: 'other-services' },
    { id: 'contact' },
  ];
  const navLinks = document.querySelectorAll('.navbar__link[href^="#"]');

  if (!navLinks.length) return;

  function getActivationLine() {
    if (
      window.innerWidth <= MOBILE_BREAKPOINT &&
      document.body.classList.contains('mobile-nav--hero-hidden')
    ) {
      const toggleBtn = document.querySelector('.mobile-nav-toggle__btn');
      if (toggleBtn) {
        return toggleBtn.getBoundingClientRect().bottom + 8;
      }
    }

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

function initMobileNav() {
  const MOBILE_BREAKPOINT = 768;
  const hero = document.querySelector('.hero');
  const toggle = document.querySelector('.mobile-nav-toggle');
  const toggleBtn = document.querySelector('.mobile-nav-toggle__btn');
  const panel = document.querySelector('.mobile-nav-panel');

  if (!hero || !toggle || !toggleBtn || !panel) return;

  let menuOpen = false;
  let scrollTicking = false;

  function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function isHeroVisible() {
    return hero.getBoundingClientRect().bottom > 8;
  }

  function closeMenu() {
    if (!menuOpen) return;

    menuOpen = false;
    panel.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');

    const onCloseEnd = (e) => {
      if (e.propertyName !== 'opacity') return;
      panel.removeEventListener('transitionend', onCloseEnd);
      if (!menuOpen) {
        panel.hidden = true;
      }
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.hidden = true;
      return;
    }

    panel.addEventListener('transitionend', onCloseEnd);
    window.setTimeout(() => {
      if (!menuOpen && !panel.classList.contains('is-open')) {
        panel.hidden = true;
      }
    }, 280);
  }

  function openMenu() {
    menuOpen = true;
    panel.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => {
      panel.classList.add('is-open');
    });
  }

  function updateMobileNavState() {
    if (!isMobileViewport()) {
      document.body.classList.remove('mobile-nav--hero-visible', 'mobile-nav--hero-hidden');
      closeMenu();
      return;
    }

    if (isHeroVisible()) {
      document.body.classList.add('mobile-nav--hero-visible');
      document.body.classList.remove('mobile-nav--hero-hidden');
      closeMenu();
    } else {
      document.body.classList.remove('mobile-nav--hero-visible');
      document.body.classList.add('mobile-nav--hero-hidden');
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  panel.querySelectorAll('.navbar__link').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  function onScrollOrResize() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateMobileNavState();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  updateMobileNavState();
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initCarousel();
  initLightbox();
  initActiveNavLink();
  initMobileNav();
  initLanguageSwitcher();
});
