const REFERENCE_ALBUM_GRID_ORDER = [
  'kohde7',
  'kohde3',
  'kohde8',
  'kohde6',
  'kohde10',
  'kohde5',
  'kohde2',
  'kohde1',
];

const REFERENCE_ALBUMS = {
  kohde1: {
    images: ['after1', 'before1', 'before2', 'before3', 'after2'],
  },
  kohde2: {
    images: ['after2', 'before1', 'after1'],
  },
  kohde3: {
    images: ['after3', 'before3', 'before5', 'work1', 'after1'],
  },
  kohde5: {
    images: ['after2', 'before1', 'work1'],
  },
  kohde6: {
    images: ['after3', 'before1', 'work1', 'after1'],
  },
  kohde7: {
    images: [
      'after12',
      'before3',
      'before4',
      'work1',
      'work3',
      'work5',
      'work7',
      'work9',
      'work10',
      'work13',
      'after1',
      'after2',
      'after5',
      'after8',
      'after11',
      'after13',
      'after22',
      'after24',
      'after25',
    ],
  },
  kohde8: {
    images: [
      'after9',
      'before9',
      'before1',
      'after1',
      'before5',
      'after11',
      'before6',
      'after8',
      'after6',
      'before4',
      'after4',
      'before7',
      'after2',
    ],
  },
  kohde10: {
    images: ['work1', 'work2'],
  },
};

function referenceAlbumImageSrc(albumId, imageName) {
  return `images/references/albums/${albumId}/${albumId}_${imageName}.jpg`;
}

function initReferenceAlbums() {
  const grid = document.querySelector('.album-grid');
  const lightbox = document.querySelector('.album-lightbox');
  const lightboxImage = lightbox?.querySelector('.album-lightbox__image');
  const stage = lightbox?.querySelector('.album-lightbox__stage');
  const prevBtn = lightbox?.querySelector('.album-lightbox__arrow--prev');
  const nextBtn = lightbox?.querySelector('.album-lightbox__arrow--next');
  const dotsContainer = lightbox?.querySelector('.album-lightbox__dots');

  if (!grid || !lightbox || !lightboxImage || !stage || !prevBtn || !nextBtn || !dotsContainer) {
    return;
  }

  let activeAlbumId = null;
  let activeImageIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;
  let touchMoved = false;
  let suppressCloseClick = false;
  const SWIPE_THRESHOLD = 48;
  const SWIPE_DIRECTION_RATIO = 1.2;

  function getAlbumImages(albumId) {
    return REFERENCE_ALBUMS[albumId]?.images ?? [];
  }

  function wrapImageIndex(index, length) {
    if (length === 0) return 0;
    return ((index % length) + length) % length;
  }

  function isNavigationTarget(target) {
    return Boolean(
      target.closest('.album-lightbox__arrow') ||
        target.closest('.album-lightbox__dot')
    );
  }

  function buildGrid() {
    grid.replaceChildren();

    REFERENCE_ALBUM_GRID_ORDER.forEach((albumId) => {
      const images = getAlbumImages(albumId);
      if (images.length === 0) return;

      const coverSrc = referenceAlbumImageSrc(albumId, images[0]);

      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'album-tile';
      tile.setAttribute('aria-label', `Avaa referenssialbumi, ${images.length} kuvaa`);

      const stack = document.createElement('span');
      stack.className = 'album-tile__stack';

      const cover = document.createElement('img');
      cover.className = 'album-tile__cover';
      cover.src = coverSrc;
      cover.alt = '';
      cover.decoding = 'async';
      stack.appendChild(cover);

      const badge = document.createElement('span');
      badge.className = 'album-tile__badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = String(images.length);
      stack.appendChild(badge);

      tile.appendChild(stack);
      tile.addEventListener('click', () => openAlbum(albumId, 0));
      grid.appendChild(tile);
    });
  }

  function preloadImage(albumId, imageIndex) {
    const images = getAlbumImages(albumId);
    if (imageIndex < 0 || imageIndex >= images.length) return;
    const img = new Image();
    img.src = referenceAlbumImageSrc(albumId, images[imageIndex]);
  }

  function updateLightboxImage() {
    const images = getAlbumImages(activeAlbumId);
    const imageName = images[activeImageIndex];
    if (!imageName) return;

    lightboxImage.src = referenceAlbumImageSrc(activeAlbumId, imageName);
    preloadImage(activeAlbumId, wrapImageIndex(activeImageIndex - 1, images.length));
    preloadImage(activeAlbumId, wrapImageIndex(activeImageIndex + 1, images.length));
  }

  function updateDots() {
    const images = getAlbumImages(activeAlbumId);
    dotsContainer.replaceChildren();

    images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'album-lightbox__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Kuva ${index + 1}`);
      dot.setAttribute('aria-selected', index === activeImageIndex ? 'true' : 'false');
      dot.classList.toggle('is-active', index === activeImageIndex);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToImage(index);
      });
      dotsContainer.appendChild(dot);
    });

    const activeDot = dotsContainer.querySelector('.album-lightbox__dot.is-active');
    if (activeDot) {
      activeDot.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }

  function goToImage(index) {
    const images = getAlbumImages(activeAlbumId);
    if (images.length === 0) return;

    const nextIndex = wrapImageIndex(index, images.length);
    if (nextIndex === activeImageIndex) return;

    activeImageIndex = nextIndex;
    updateLightboxImage();
    updateDots();
  }

  function stepImage(direction) {
    goToImage(activeImageIndex + direction);
  }

  function openAlbum(albumId, imageIndex = 0) {
    const images = getAlbumImages(albumId);
    if (images.length === 0) return;

    activeAlbumId = albumId;
    activeImageIndex = Math.min(Math.max(imageIndex, 0), images.length - 1);

    updateLightboxImage();
    updateDots();

    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('album-lightbox-open');
    document.body.classList.add('album-lightbox-open');
    document.body.style.overflow = 'hidden';
  }

  function closeAlbum() {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.removeAttribute('src');
    document.documentElement.classList.remove('album-lightbox-open');
    document.body.classList.remove('album-lightbox-open');
    document.body.style.overflow = '';
    activeAlbumId = null;
    activeImageIndex = 0;
  }

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stepImage(-1);
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stepImage(1);
  });

  lightbox.addEventListener('click', (e) => {
    if (suppressCloseClick) {
      suppressCloseClick = false;
      return;
    }

    if (isNavigationTarget(e.target)) {
      return;
    }

    closeAlbum();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;

    if (e.key === 'Escape') {
      closeAlbum();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepImage(-1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepImage(1);
    }
  });

  stage.addEventListener(
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

  stage.addEventListener(
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

  stage.addEventListener(
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

      e.preventDefault();
      suppressCloseClick = true;
      window.setTimeout(() => {
        suppressCloseClick = false;
      }, 360);

      if (dx < 0) {
        stepImage(1);
      } else {
        stepImage(-1);
      }
    },
    { passive: false }
  );

  buildGrid();
}
