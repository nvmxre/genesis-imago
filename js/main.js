import { initAccordion } from './accordion.js';
import { initCarousels } from './slider.js';
import { initFx, scrollToY, lenisStop, lenisStart } from './fx.js';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.screenshots-section img, .guides-section img, .app-section img').forEach((image) => {
    image.loading = 'lazy';
    image.decoding = 'async';
  });

  // 1. Initialize Components
  initAccordion();
  initCarousels();
  // Пиксели, перетекание текста, звук, scroll-spy, появление карточек — js/fx.js
  initFx();

  // 1.5. Счётчик 73 % живёт в fx.js: цифры перетекают поразрядно (torph), а не подменяются.

  // 2. Mobile Navigation Toggle
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const headerNav = document.getElementById('header-nav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = headerNav.classList.toggle('mobile-active');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });

    // Close menu when clicking a link
    headerNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('mobile-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Открыть меню');
      });
    });
  }

  // 3. Smart Header: Hide on Scroll Down, Reveal Smoothly on Scroll Up
  const siteHeader = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;
  let headerDirection = 0;
  let headerDirectionStartY = lastScrollY;
  let headerFrame = 0;

  const syncHeader = (currentScrollY) => {
    const scrollDelta = currentScrollY - lastScrollY;
    const nextDirection = Math.sign(scrollDelta);

    if (currentScrollY <= 60) {
      siteHeader.classList.remove('header-hidden');
      headerDirection = 0;
      headerDirectionStartY = currentScrollY;
      lastScrollY = currentScrollY;
      return;
    }

    // Track one continuous gesture instead of reacting to every wheel/trackpad
    // event. This prevents the fixed header from flickering on micro-bounces.
    if (nextDirection && nextDirection !== headerDirection) {
      headerDirection = nextDirection;
      headerDirectionStartY = lastScrollY;
    }

    const gestureDistance = Math.abs(currentScrollY - headerDirectionStartY);
    if (headerDirection > 0 && currentScrollY > 120 && gestureDistance >= 24) {
      siteHeader.classList.add('header-hidden');
      headerDirectionStartY = currentScrollY;
    } else if (headerDirection < 0 && gestureDistance >= 16) {
      siteHeader.classList.remove('header-hidden');
      headerDirectionStartY = currentScrollY;
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', () => {
    if (headerFrame) return;
    headerFrame = requestAnimationFrame(() => {
      headerFrame = 0;
      syncHeader(window.scrollY);
    });
  }, { passive: true });

  // Apply the initial mobile state before the first scroll event.
  syncHeader(lastScrollY);

  // 4. Smooth Anchor Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // Через Lenis (fx.js): родной smooth с ним конфликтует
        scrollToY(offsetPosition);
      }
    });
  });

  // 4.5. Payment widgets: one accessible modal for the three tariff options.
  const paymentModal = document.getElementById('payment-modal');
  const paymentDialog = paymentModal?.querySelector('.payment-modal__dialog');
  const paymentCloseButton = paymentModal?.querySelector('.payment-modal__close');
  const paymentSlots = document.querySelectorAll('[data-payment-widget]');
  const paymentTriggers = document.querySelectorAll('[data-widget-trigger="payment"]');
  const paymentLabels = {
    offline: 'Оплата программы OFFline',
    online: 'Оплата программы ONline',
    bundle: 'Оплата комплекта OFFline + ONline'
  };
  let lastPaymentTrigger = null;

  const closePaymentModal = () => {
    if (!paymentModal || paymentModal.hidden || paymentModal.classList.contains('is-closing')) return;
    // Сначала анимация ухода (класс is-closing, css/fx.css), потом hidden: display: none
    // оборвал бы её на первом кадре. Вход анимирует fx.js по снятию hidden.
    paymentModal.classList.add('is-closing');
    const finish = () => {
      paymentModal.classList.remove('is-closing');
      paymentModal.hidden = true;
      paymentModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lenisStart();
      lastPaymentTrigger?.focus();
    };
    setTimeout(finish, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 480);
  };

  const openPaymentModal = (tariff, trigger) => {
    if (!paymentModal || !paymentLabels[tariff]) return;

    lastPaymentTrigger = trigger;
    paymentDialog?.setAttribute('aria-label', paymentLabels[tariff]);
    paymentSlots.forEach(slot => {
      slot.hidden = slot.dataset.paymentWidget !== tariff;
    });
    paymentModal.hidden = false;
    paymentModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenisStop();
    paymentCloseButton?.focus();
  };

  paymentTriggers.forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openPaymentModal(trigger.dataset.tariff, trigger);
    });
  });

  paymentCloseButton?.addEventListener('click', closePaymentModal);
  paymentModal?.addEventListener('click', event => {
    if (event.target === paymentModal) closePaymentModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePaymentModal();
  });

  // 5. Intelligent Viewport-Triggered Background Video Loader & Player
  const lazyKinescopeFrames = document.querySelectorAll('.lazy-kinescope');

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const iframe = entry.target;
        const targetSrc = iframe.dataset.src;

        if (entry.isIntersecting) {
          // Mount and play video as soon as user is approaching/entering the section
          if (!iframe.getAttribute('src') && targetSrc) {
            iframe.src = targetSrc;
            iframe.addEventListener('load', () => {
              iframe.classList.add('is-loaded');
            }, { once: true });
          }
        }
      });
    }, {
      root: null,
      rootMargin: '200px 0px 200px 0px', // Buffer 200px before viewport for instantaneous start
      threshold: 0.05
    });

    lazyKinescopeFrames.forEach(frame => videoObserver.observe(frame));
  } else {
    // Fallback for non-supporting browsers
    lazyKinescopeFrames.forEach(frame => {
      if (frame.dataset.src) {
        frame.src = frame.dataset.src;
        frame.classList.add('is-loaded');
      }
    });
  }

  // 6. Inline Video Player: click swaps the muted background preview
  //    for the full Kinescope player inside the same card (no modal).
  const videoTriggers = document.querySelectorAll('.video-preview-card, .trailer-video-box');
  videoTriggers.forEach(trigger => {
    let started = false;

    const handleOpenVideo = (e) => {
      if (started) return;
      started = true;
      e.stopPropagation();

      const videoSrc = trigger.dataset.videoSrc || 'https://kinescope.io/embed/qnkaYphFo5uZ7E4rgvUBkc';
      const media = trigger.querySelector('.video-bg-media');
      const bgIframe = trigger.querySelector('.video-bg-iframe');

      const player = document.createElement('iframe');
      player.className = 'video-inline-player';
      player.src = `${videoSrc}?autoplay=1&playsinline=1`;
      player.title = 'Kinescope Video Player';
      player.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer');
      player.setAttribute('allowfullscreen', '');
      player.setAttribute('frameborder', '0');

      if (bgIframe) bgIframe.remove();
      (media || trigger).appendChild(player);

      trigger.classList.add('is-playing');
      trigger.closest('.video-section')?.classList.add('is-playing');
      trigger.removeAttribute('role');
      trigger.removeAttribute('tabindex');
      trigger.removeAttribute('aria-label');
      trigger.removeEventListener('click', handleOpenVideo);
      trigger.removeEventListener('keydown', handleKeydown);
    };

    const handleKeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpenVideo(event);
      }
    };

    trigger.addEventListener('click', handleOpenVideo);
    trigger.addEventListener('keydown', handleKeydown);
  });

  // 6.1. Курсор-плей: на устройствах с мышью кнопка Play следует за
  //      указателем над видеокарточкой (пока видео не запущено).
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches && videoTriggers.length) {
    const cursor = document.createElement('div');
    cursor.className = 'video-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5 11.7a1.5 1.5 0 0 1 0 2.6L9.25 20.8A1.5 1.5 0 0 1 7 19.5V6.5a1.5 1.5 0 0 1 2.25-1.3z" fill="#0C0D0E"/></svg>';
    document.body.appendChild(cursor);

    let cursorX = 0;
    let cursorY = 0;
    let cursorFrame = 0;
    let activeTrigger = null;

    const renderCursor = () => {
      cursorFrame = 0;
      cursor.style.transform = '';
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
    };

    const moveCursor = (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
    };

    const showCursor = (trigger, event) => {
      if (trigger.classList.contains('is-playing')) return;
      activeTrigger = trigger;
      trigger.classList.add('has-video-cursor');
      moveCursor(event);
      cursor.classList.add('is-visible');
    };

    const hideCursor = () => {
      if (activeTrigger) activeTrigger.classList.remove('has-video-cursor');
      activeTrigger = null;
      cursor.classList.remove('is-visible', 'is-pressed');
    };

    videoTriggers.forEach(trigger => {
      trigger.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') showCursor(trigger, event);
      });
      trigger.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (trigger.classList.contains('is-playing')) { hideCursor(); return; }
        if (activeTrigger !== trigger) showCursor(trigger, event);
        moveCursor(event);
      });
      trigger.addEventListener('pointerleave', hideCursor);
      trigger.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
      trigger.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
      // После запуска видео курсор больше не нужен — плеер получает клики.
      trigger.addEventListener('click', hideCursor);
    });

    window.addEventListener('blur', hideCursor);
  }

  // 6. Screenshot Zoom / Lightbox (intentional click/tap only)
  const screenshotItems = document.querySelectorAll('.screenshot-item');
  let activeScreenshotOverlay = null;

  const openScreenshotModal = (src) => {
    if (activeScreenshotOverlay) {
      if (activeScreenshotOverlay.dataset.src === src) return;
      activeScreenshotOverlay.remove();
      activeScreenshotOverlay = null;
    }
    const overlay = document.createElement('div');
    overlay.className = 'screenshot-modal-overlay';
    overlay.dataset.src = src;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.88)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.cursor = 'zoom-out';
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';

    const bigImg = document.createElement('img');
    bigImg.src = src;
    bigImg.style.maxHeight = '90vh';
    bigImg.style.maxWidth = '90vw';
    bigImg.style.borderRadius = '16px';
    bigImg.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.85)';
    bigImg.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    bigImg.style.transform = 'scale(0.96)';

    overlay.appendChild(bigImg);
    document.body.appendChild(overlay);
    activeScreenshotOverlay = overlay;

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      bigImg.style.transform = 'scale(1)';
    });

    const close = () => {
      overlay.style.opacity = '0';
      bigImg.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (activeScreenshotOverlay === overlay) activeScreenshotOverlay = null;
      }, 250);
    };

    overlay.addEventListener('click', close);
  };

  screenshotItems.forEach(item => {
    const image = item.querySelector('img');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Открыть изображение: ${image?.alt || 'отзыв'}`);

    // Open only after an intentional click/tap (or keyboard activation).
    item.addEventListener('click', () => {
      if (image) openScreenshotModal(image.src);
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (image) openScreenshotModal(image.src);
      }
    });
  });

});
