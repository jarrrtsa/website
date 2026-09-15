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

    const inner = modal.querySelector('.feature-modal__inner');

    function openModal() {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('feature-modal-open');
      document.body.classList.add('feature-modal-open');
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('feature-modal-open');
      document.body.classList.remove('feature-modal-open');
    }

    trigger.addEventListener('click', openModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    inner?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    modal.querySelector('.feature-modal__cta')?.addEventListener('click', () => {
      closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initReferenceAlbums();
  initFeatureModals();
  initActiveNavLink();
  initMobileNav();
  initLanguageSwitcher();
});
