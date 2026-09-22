/**
 * Generic Slider / Carousel Controller
 */
import { morphText, swapText, scrollToY } from './fx.js';

export function initCarousels() {
  initGenericCarousel('feedbacks-carousel', 'feedbacks-track', 'feedbacks-prev', 'feedbacks-next');
  initGenericCarousel('guides-carousel', 'guides-track', 'guides-prev', 'guides-next');
  initSystemSlider();
  initEcosystemTabs();
}

function initGenericCarousel(containerId, trackId, prevBtnId, nextBtnId) {
  const container = document.getElementById(containerId);
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);

  if (!container || !track || !prevBtn || !nextBtn) return;

  const cards = track.children;
  if (!cards.length) return;

  const centerLastPage = container.dataset.centerLastPage === 'true';
  let currentIndex = 0;

  function update() {
    // Measure the regular (Figma) state first: three cards plus a fourth peek.
    container.classList.remove('carousel-at-end');
    const regularGap = parseFloat(getComputedStyle(track).gap) || 24;
    const regularStride = cards[0].offsetWidth + regularGap;
    const regularWidth = container.clientWidth;
    const regularMaxOffset = Math.max(0, track.scrollWidth - regularWidth);
    const visibleCards = Math.max(1, Math.floor((regularWidth + regularGap) / regularStride));
    const lastPageIndex = Math.max(0, cards.length - visibleCards);
    // Guides intentionally reveal the next card in the idle state, but every
    // navigated state must remain aligned to the left edge of the container.
    const isEdgeAlignedCarousel = containerId === 'guides-carousel' || containerId === 'feedbacks-carousel';
    const isTabletCarousel = (containerId === 'feedbacks-carousel' || containerId === 'guides-carousel')
      && window.matchMedia('(min-width: 768px) and (max-width: 1024px)').matches;
    const isTabletGuidesCarousel = containerId === 'guides-carousel' && isTabletCarousel;
    const isMobileGuidesCarousel = containerId === 'guides-carousel'
      && window.matchMedia('(max-width: 640px)').matches;
    const useEdgeAlignedPaging = isEdgeAlignedCarousel
      && (window.matchMedia('(min-width: 1025px)').matches || isTabletCarousel || isMobileGuidesCarousel);
    const maxIndex = useEdgeAlignedPaging
      ? isMobileGuidesCarousel
        ? Math.max(0, cards.length - 1)
        : Math.max(0, cards.length - 3)
      : (centerLastPage ? lastPageIndex : Math.ceil(regularMaxOffset / regularStride));

    currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
    const isLastPage = useEdgeAlignedPaging
      ? currentIndex === maxIndex
      : centerLastPage && currentIndex === lastPageIndex;
    container.classList.toggle('carousel-at-end', isLastPage);
    container.classList.toggle('carousel-has-offset', useEdgeAlignedPaging && currentIndex > 0);

    // The final page has its own geometry: exactly three full cards in the
    // primary 1120px container, with no exposed card on either side.
    // `gap` and the viewport width animate on the final step. Reading their
    // interpolated values here made the target transform drift by a few pixels
    // and cropped the first card. Use the final desktop geometry instead.
    const isDesktopFinalPage = !useEdgeAlignedPaging && isLastPage && window.matchMedia('(min-width: 1025px)').matches;
    const activeGap = isDesktopFinalPage ? 20 : regularGap;
    const desktopContainerWidth = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--container-max-width')) || 1120;
    const activeWidth = isDesktopFinalPage
      ? Math.min(desktopContainerWidth, window.innerWidth - 40)
      : regularWidth;
    const activeStride = cards[0].offsetWidth + activeGap;
    const activeVisibleCards = Math.max(1, Math.floor((activeWidth + activeGap) / activeStride));
    const finalPageIndex = Math.max(0, cards.length - activeVisibleCards);
    const endInset = Math.max(0, (activeWidth - (activeVisibleCards * cards[0].offsetWidth + (activeVisibleCards - 1) * activeGap)) / 2);
    const offset = useEdgeAlignedPaging
      ? isTabletGuidesCarousel && isLastPage
        ? -regularMaxOffset
        : -(currentIndex * regularStride)
      : isLastPage
      ? -(finalPageIndex * activeStride - endInset)
      : -Math.min(currentIndex * regularStride, regularMaxOffset);
    track.style.transform = `translateX(${offset}px)`;
    // Счётчик «1 / N» рядом со стрелками слушает это событие (fx.js)
    track.dataset.gfxIndex = String(currentIndex);
    track.dataset.gfxMax = String(maxIndex);
    track.dispatchEvent(new CustomEvent('gfx:index', { detail: { index: currentIndex, max: maxIndex } }));

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    
    // Visual states are owned by CSS: arrows stay transparent by default and
    // receive a circular background only on hover/focus, as in the component.
    prevBtn.style.removeProperty('background');
    nextBtn.style.removeProperty('background');
    prevBtn.style.removeProperty('opacity');
    nextBtn.style.removeProperty('opacity');
  }

  prevBtn.addEventListener('click', () => {
    currentIndex--;
    update();
  });

  nextBtn.addEventListener('click', () => {
    currentIndex++;
    update();
  });

  // Touch / Drag Support
  let startX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 50) {
      currentIndex++;
      update();
    } else if (diff < -50) {
      currentIndex--;
      update();
    }
  });

  window.addEventListener('resize', update, { passive: true });
  update();
}

function initSystemSlider() {
  const track = document.getElementById('system-slider-scroll-track');
  const stage = track ? track.querySelector('.system-slider-sticky-stage') : null;
  const bar1 = document.getElementById('system-bar-fill-1');
  const bar2 = document.getElementById('system-bar-fill-2');
  const numEl = document.getElementById('system-slide-num');

  const imgLayer1 = document.getElementById('system-img-layer-1');
  const imgLayer2 = document.getElementById('system-img-layer-2');
  const img1 = imgLayer1 ? imgLayer1.querySelector('img') : null;
  const img2 = imgLayer2 ? imgLayer2.querySelector('img') : null;
  const textLayer1 = document.getElementById('system-text-layer-1');
  const textLayer2 = document.getElementById('system-text-layer-2');
  const box = document.getElementById('system-slider-box');
  const prevBtn = document.getElementById('system-slider-prev');
  const nextBtn = document.getElementById('system-slider-next');

  if (!track || !box) return;

  const barItems = box.querySelectorAll('.system-bar-item');
  const SLIDE_COUNT = 2;

  // Тексты обоих слайдов перетекают в ОДНОМ слое (torph через fx.js): второй слой только
  // хранит тексты и спрятан в fx.css. Заголовок с <br> хранится с переводами строк —
  // у него white-space: pre-line; сноска про Instagram переезжает в живой слой и показывается
  // только на втором слайде.
  const slideTexts = [textLayer1, textLayer2].map((layer) => layer && {
    tag: layer.querySelector('.system-slide-tag')?.textContent.trim() ?? '',
    title: (layer.querySelector('.system-slide-title')?.innerHTML ?? '')
      .replace(/<br\s*\/?>/gi, '\n').replace(/\s*\n\s*/g, '\n').trim(),
    desc: (layer.querySelector('.system-slide-desc')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  });
  const live = {
    tag: textLayer1?.querySelector('.system-slide-tag'),
    title: textLayer1?.querySelector('.system-slide-title'),
    desc: textLayer1?.querySelector('.system-slide-desc'),
  };
  const legalNote = textLayer2?.querySelector('.legal-note');
  if (legalNote && textLayer1) {
    textLayer1.appendChild(legalNote);
    // Не hidden, а класс: место под сноску занято на обоих слайдах, высота блока не прыгает
    legalNote.classList.add('is-off');
  }
  if (slideTexts[0]) {
    if (live.title) live.title.textContent = slideTexts[0].title;
    if (live.desc) live.desc.textContent = slideTexts[0].desc;
  }
  textLayer1?.classList.add('active');

  // Живой слой держит высоту самого высокого из слайдов: тексты разной длины
  // меряются невидимой копией слоя, и блок не меняет высоту при смене слайда.
  // Пересчёт — после загрузки шрифтов и при изменении ширины окна.
  function fitTextLayer() {
    if (!textLayer1 || !textLayer1.parentNode || !slideTexts[0]) return;
    const probe = textLayer1.cloneNode(true);
    const imp = (prop, val) => probe.style.setProperty(prop, val, 'important');
    imp('position', 'absolute'); imp('top', '0'); imp('left', '0'); imp('right', '0');
    imp('min-height', '0'); imp('height', 'auto'); imp('visibility', 'hidden');
    imp('pointer-events', 'none'); imp('transition', 'none');
    probe.querySelector('.legal-note')?.classList.remove('is-off');
    const p = {
      tag: probe.querySelector('.system-slide-tag'),
      title: probe.querySelector('.system-slide-title'),
      desc: probe.querySelector('.system-slide-desc'),
    };
    textLayer1.parentNode.appendChild(probe);
    let max = 0;
    slideTexts.forEach((texts) => {
      if (!texts) return;
      if (p.tag) p.tag.textContent = texts.tag;
      if (p.title) p.title.textContent = texts.title;
      if (p.desc) p.desc.textContent = texts.desc;
      max = Math.max(max, probe.offsetHeight);
    });
    probe.remove();
    textLayer1.style.minHeight = max ? `${max}px` : '';
  }
  fitTextLayer();
  document.fonts?.ready.then(fitTextLayer);
  let fitTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitTextLayer, 150);
  });

  const STORY_DURATION = 6000; // мс на слайд в режиме сторис
  let activeIndex = 0;
  let rafId = null;

  // Два режима:
  //  - scroll: sticky-сцена, слайд переключается прокруткой трека (десктоп, планшет);
  //  - stories: сцена в потоке (мобильный), слайд переключается по таймеру,
  //    но только когда слайдер виден на экране.
  const isScrollMode = () => (
    stage && getComputedStyle(stage).position === 'sticky' && track.offsetHeight - window.innerHeight > 0
  );

  function updateSlideState(index) {
    if (activeIndex === index) return;
    activeIndex = index;
    barItems.forEach((item, itemIndex) => item.setAttribute('aria-current', String(itemIndex === index)));

    // Цифра перетекает, а не подменяется после прыжка вверх
    if (numEl) morphText(numEl, index + 1, { duration: 320 });

    const texts = slideTexts[index];
    if (texts) {
      morphText(live.tag, texts.tag, { numbers: false, duration: 360 });
      morphText(live.title, texts.title, { numbers: false, duration: 440 });
      // Абзац — кроссфейд с размытием: морф длинного текста рвёт строки внутри слов
      swapText(live.desc, texts.desc);
    }
    if (legalNote) legalNote.classList.toggle('is-off', index !== 1);
  }

  // Шторка картинки: 0 — видна первая, 1 — полностью открыта вторая.
  function renderCurtain(t) {
    const k = Math.max(0, Math.min(1, t));
    if (imgLayer2) imgLayer2.style.clipPath = `inset(${(1 - k) * 100}% 0 0 0)`;
    if (img1) img1.style.transform = `scale(${1.0 + k * 0.04})`;
    if (img2) img2.style.transform = `scale(${1.04 - k * 0.04})`;
  }

  // Визуальное состояние по прогрессу 0..1 (0.5 — граница слайдов).
  // Картинка меняется заранее, в конце первого слайда (0.3–0.5), чтобы к
  // моменту смены текста уже была новая.
  const CURTAIN_START = 0.3;
  function render(progress) {
    if (progress <= 0.5) {
      const p1 = progress / 0.5;
      if (bar1) bar1.style.width = (p1 * 100) + '%';
      if (bar2) bar2.style.width = '0%';
      renderCurtain((progress - CURTAIN_START) / (0.5 - CURTAIN_START));
      updateSlideState(0);
    } else {
      const p2 = (progress - 0.5) / 0.5;
      if (bar1) bar1.style.width = '100%';
      if (bar2) bar2.style.width = (p2 * 100) + '%';
      renderCurtain(1);
      updateSlideState(1);
    }
  }

  // ---- Режим scroll -------------------------------------------------------
  function handleScroll() {
    if (!isScrollMode()) return;
    const rect = track.getBoundingClientRect();
    const scrollDist = track.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / scrollDist));
    render(progress);
  }

  function onScroll() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(handleScroll);
  }

  function scrollToSlide(idx) {
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const scrollDist = track.offsetHeight - window.innerHeight;
    const targetScroll = idx === 0 ? trackTop : trackTop + scrollDist;
    scrollToY(targetScroll);
  }

  // ---- Режим stories ------------------------------------------------------
  let storyIndex = 0;
  let storyStart = null;
  let storyRaf = 0;
  let storyVisible = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showStory(idx, fillCurrent) {
    storyIndex = idx;
    if (idx === 0) {
      if (bar1) bar1.style.width = fillCurrent ? '100%' : '0%';
      if (bar2) bar2.style.width = '0%';
      renderCurtain(0);
    } else {
      if (bar1) bar1.style.width = '100%';
      if (bar2) bar2.style.width = fillCurrent ? '100%' : '0%';
      renderCurtain(1);
    }
    updateSlideState(idx);
    storyStart = null;
  }

  // В режиме сторис картинка меняется в последние 20% времени слайда,
  // чтобы к смене текста уже была новая (и обратно перед возвратом к первому).
  const STORY_CURTAIN_AT = 0.8;
  function storyLoop(now) {
    storyRaf = 0;
    if (!storyVisible) return;
    if (storyStart === null) storyStart = now;
    const progress = Math.min(1, (now - storyStart) / STORY_DURATION);
    const bar = storyIndex === 0 ? bar1 : bar2;
    if (bar) bar.style.width = (progress * 100) + '%';
    if (progress > STORY_CURTAIN_AT) {
      const t = (progress - STORY_CURTAIN_AT) / (1 - STORY_CURTAIN_AT);
      renderCurtain(storyIndex === 0 ? t : 1 - t);
    }
    if (progress >= 1) {
      showStory((storyIndex + 1) % SLIDE_COUNT, false);
    }
    storyRaf = requestAnimationFrame(storyLoop);
  }

  function startStories() {
    if (reducedMotion || storyRaf) return;
    storyStart = null;
    storyRaf = requestAnimationFrame(storyLoop);
  }

  function stopStories() {
    if (storyRaf) cancelAnimationFrame(storyRaf);
    storyRaf = 0;
  }

  const visibility = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          storyVisible = entry.isIntersecting;
          if (storyVisible && box.classList.contains('is-stories')) startStories();
          else stopStories();
        });
      }, { threshold: 0.5 })
    : null;

  // ---- Переключение режимов ----------------------------------------------
  let mode = null;

  function applyMode() {
    const next = isScrollMode() ? 'scroll' : 'stories';
    if (next === mode) return;
    mode = next;
    if (mode === 'scroll') {
      stopStories();
      visibility?.unobserve(box);
      box.classList.remove('is-stories');
      handleScroll();
    } else {
      box.classList.add('is-stories');
      showStory(0, false);
      if (visibility) visibility.observe(box);
      else { storyVisible = true; startStories(); }
    }
  }

  function goTo(idx) {
    const target = (idx + SLIDE_COUNT) % SLIDE_COUNT;
    if (mode === 'scroll') {
      scrollToSlide(target);
    } else {
      showStory(target, false);
      stopStories();
      if (storyVisible) startStories();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { applyMode(); onScroll(); }, { passive: true });
  applyMode();

  barItems.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(idx);
    });
  });
  prevBtn?.addEventListener('click', () => goTo(activeIndex - 1));
  nextBtn?.addEventListener('click', () => goTo(activeIndex + 1));
}


function initEcosystemTabs() {
  const box = document.getElementById('ecosystem-box');
  const tabs = document.querySelectorAll('.ecosystem-tab-item');
  const descEl = document.getElementById('ecosystem-desc');
  const progressEl = document.getElementById('ecosystem-progress');
  const visualLayers = document.querySelectorAll('.ecosystem-visual-layer');

  if (!tabs.length) return;
  // Корень описания с pre-line (fx.css): пробелы и переводы строк из разметки вокруг
  // текста стали бы пустой первой строкой
  if (descEl) descEl.textContent = descEl.textContent.replace(/\s+/g, ' ').trim();

  const descriptions = {
    chat: "Обмен опытом и обратная связь каждый день",
    streams: "Прямые эфиры каждую неделю: разборы ваших подходов, переписок, диалогов и ответы на вопросы.",
    platform: "Единая образовательная платформа с доступом ко всей базе знаний, урокам и материалам 24/7.",
    ai: "Персональный ассистент для генерации контекстных тем для диалога и проверки анкеты."
  };

  const wideDescriptions = {
    streams: "Прямые эфиры каждую неделю: разборы ваших подходов,\nпереписок, диалогов и ответы на вопросы.",
    platform: "Единая образовательная платформа с доступом ко всей базе\nзнаний, урокам и материалам 24/7.",
    ai: "Персональный ассистент для генерации контекстных тем для\nдиалога и проверки анкеты."
  };

  const getDescription = (key) => (
    window.matchMedia('(min-width: 1500px)').matches && wideDescriptions[key]
      ? wideDescriptions[key]
      : descriptions[key]
  );

  let currentTab = 0;
  const duration = 5500; // 5.5 seconds per tab
  let startTime = null;
  // Автопрокрутка идёт только пока блок виден: иначе к моменту, когда
  // пользователь доскроллит, вкладки уже успевают переключиться.
  let paused = true;
  let pausedAt = null;

  function setTab(index) {
    currentTab = index;
    const tab = tabs[index];
    const key = tab.getAttribute('data-tab');

    // Active tab text highlight
    tabs.forEach((tabItem, tabIndex) => {
      tabItem.classList.toggle('active', tabIndex === index);
      tabItem.setAttribute('aria-pressed', String(tabIndex === index));
      // Пиксели активной вкладки (fx.css)
      tabItem.toggleAttribute('data-gfx-active', tabIndex === index);
    });

    // Описание на десктопе перетекает пословно (torph): видно, что именно изменилось.
    // На узком экране — кроссфейд с размытием: там морф перекладывал строки поверх друг друга
    const description = getDescription(key);
    if (descEl && description) {
      if (window.matchMedia('(min-width: 1025px)').matches) {
        morphText(descEl, description, { numbers: false, duration: 420 });
      } else {
        swapText(descEl, description);
      }
    }

    // Visual layer cross-fade & scale
    visualLayers.forEach(layer => {
      if (layer.getAttribute('data-visual') === key) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
    });

    // Reset progress bar to 0 immediately on tab change
    if (progressEl) progressEl.style.width = '0%';
    startTime = performance.now();
  }

  function loop(now) {
    if (paused) {
      if (pausedAt === null) pausedAt = now;
      requestAnimationFrame(loop);
      return;
    }
    if (pausedAt !== null) {
      // Возобновляем с того же места: сдвигаем старт на время паузы.
      startTime = startTime ? startTime + (now - pausedAt) : now;
      pausedAt = null;
    }
    if (!startTime) startTime = now;

    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    if (progressEl) {
      progressEl.style.width = `${progress * 100}%`;
    }

    if (progress >= 1) {
      const next = (currentTab + 1) % tabs.length;
      setTab(next);
    }

    requestAnimationFrame(loop);
  }

  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'button');
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('aria-pressed', String(index === currentTab));
    tab.addEventListener('click', () => {
      setTab(index);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setTab(index);
      }
    });
  });

  const prevBtn = document.getElementById('ecosystem-prev');
  const nextBtn = document.getElementById('ecosystem-next');
  prevBtn?.addEventListener('click', () => setTab((currentTab - 1 + tabs.length) % tabs.length));
  nextBtn?.addEventListener('click', () => setTab((currentTab + 1) % tabs.length));

  setTab(0);

  if ('IntersectionObserver' in window && box) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => { paused = !entry.isIntersecting; });
    }, { threshold: 0.35 }).observe(box);
  } else {
    paused = false;
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(loop);
  }
}
