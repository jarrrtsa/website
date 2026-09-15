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
function initServiceCardHeights() {
  const DESKTOP_BREAKPOINT = 769;
  const grid = document.querySelector('.services-grid');
  if (!grid) return;

  function equalizeServiceCards() {
    const cards = [...grid.querySelectorAll('.service-card')];
    cards.forEach((card) => {
      card.style.minHeight = '';
    });

    if (window.innerWidth < DESKTOP_BREAKPOINT || cards.length < 5) {
      return;
    }

    const targetHeight = Math.max(
      ...cards.slice(0, 3).map((card) => card.offsetHeight)
    );

    cards.forEach((card) => {
      card.style.minHeight = `${targetHeight}px`;
    });
  }

  window.addEventListener('resize', equalizeServiceCards, { passive: true });
  equalizeServiceCards();
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

function initFeatureModals() {
  document.querySelectorAll('[data-feature-modal]').forEach((trigger) => {
    const modalId = trigger.getAttribute('data-feature-modal');
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const DESKTOP_BREAKPOINT = 769;
    const scrollEl = modal.querySelector('.feature-modal__scroll');
    const closeBtn = modal.querySelector('.feature-modal__close');
    const video = modal.querySelector('.feature-modal__video');
    const videoWrap = modal.querySelector('.feature-modal__video-wrap');
    const videoEnded = modal.querySelector('.feature-modal__video-ended');
    const replayBtn = modal.querySelector('.feature-modal__video-replay');
    const gallery = modal.querySelector('.feature-modal__gallery');
    const galleryImages = gallery
      ? [...gallery.querySelectorAll('.feature-modal__gallery-image')]
      : [];
    const galleryDots = gallery
      ? [...gallery.querySelectorAll('.feature-modal__gallery-dot')]
      : [];
    const galleryPrevBtn = gallery?.querySelector(
      '.feature-modal__gallery-arrow--prev'
    );
    const galleryNextBtn = gallery?.querySelector(
      '.feature-modal__gallery-arrow--next'
    );
    let galleryIndex = 0;

    function setGalleryIndex(nextIndex) {
      if (!galleryImages.length) return;

      const total = galleryImages.length;
      galleryIndex = ((nextIndex % total) + total) % total;

      galleryImages.forEach((image, index) => {
        image.classList.toggle('is-active', index === galleryIndex);
      });

      galleryDots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === galleryIndex);
        dot.setAttribute('aria-selected', index === galleryIndex ? 'true' : 'false');
      });
    }

    function stepGallery(delta) {
      setGalleryIndex(galleryIndex + delta);
    }

    function resetGallery() {
      setGalleryIndex(0);
    }

    function isAlbumLightboxOpen() {
      const albumLightbox = document.querySelector('.album-lightbox');
      return albumLightbox && !albumLightbox.hidden;
    }

    function loadVideo() {
      return new Promise((resolve) => {
        if (!video) {
          resolve();
          return;
        }

        const src = video.getAttribute('data-src');
        if (!src) {
          resolve();
          return;
        }

        const onReady = () => {
          video.removeEventListener('loadeddata', onReady);
          video.removeEventListener('error', onReady);
          resolve();
        };

        if (video.dataset.featureVideoSrc !== src) {
          video.src = src;
          video.dataset.featureVideoSrc = src;
          video.load();
        }

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          resolve();
          return;
        }

        video.addEventListener('loadeddata', onReady, { once: true });
        video.addEventListener('error', onReady, { once: true });
      });
    }

    function clearVideoEndedState() {
      if (videoEnded) {
        videoEnded.hidden = true;
      }
      videoWrap?.classList.remove('is-ended');
    }

    function showVideoEndedState() {
      if (videoEnded) {
        videoEnded.hidden = false;
      }
      videoWrap?.classList.add('is-ended');
    }

    async function playVideo() {
      if (!video) return;
      clearVideoEndedState();
      await loadVideo();
      video.currentTime = 0;
      try {
        await video.play();
      } catch {
        /* Autoplay blocked — video remains visible and user-playable */
      }
    }

    function resetVideo() {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
      clearVideoEndedState();
    }

    function openModal() {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('feature-modal-open');
      document.body.classList.add('feature-modal-open');

      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }

      resetGallery();
      playVideo();
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('feature-modal-open');
      document.body.classList.remove('feature-modal-open');
      resetVideo();
      resetGallery();
    }

    trigger.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);

    galleryPrevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      stepGallery(-1);
    });

    galleryNextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      stepGallery(1);
    });

    galleryDots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setGalleryIndex(index);
      });
    });

    video?.addEventListener('ended', showVideoEndedState);

    replayBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!video) return;
      clearVideoEndedState();
      video.currentTime = 0;
      try {
        await video.play();
      } catch {
        /* Autoplay blocked */
      }
    });

    modal.querySelectorAll('.feature-modal__cta').forEach((cta) => {
      cta.addEventListener('click', () => {
        closeModal();
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (
        window.innerWidth >= DESKTOP_BREAKPOINT &&
        !isAlbumLightboxOpen() &&
        galleryImages.length > 1
      ) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepGallery(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepGallery(1);
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initServiceCardHeights();
  initReferenceAlbums();
  initFeatureModals();
  initActiveNavLink();
  initMobileNav();
  initLanguageSwitcher();
});
