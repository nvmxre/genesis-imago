/**
 * GENESĪS · FX
 *
 * Слой эффектов поверх авторской страницы и полировка отклика
 * по принципам Emil Kowalski. Всё живёт ПОВЕРХ авторской разметки: слои absolute с
 * pointer-events: none, раскладка не меняется, копирайт не трогается.
 *
 *  1. Пиксельное поле — дышащие клетки на фоне hero, тарифов, FAQ и футера; карточки над
 *     ним — стекло с backdrop-filter, рекомендованный тариф — с матовым слоем внутри.
 *  2. Квадратики активной вкладки — заготовка (squares), сейчас не используется:
 *     под текстом они мешали читать.
 *  3. Свет и летящие вверх пиксели на кнопках при наведении.
 *  4. Перетекание текста — torph (MIT): слайдер модулей целиком, описание вкладки экосистемы,
 *     счётчик 73 %, «01 / 05» в сценариях, «1 / 3» у каруселей, «Показать больше».
 *  5. Lenis (MIT) — плавная прокрутка; якоря и слайдер ездят через неё.
 *
 * Звук — @rexa-developer/tiks (MIT): щелчки синтезируются в Web Audio, ни одного mp3 и ни
 * одного запроса. Тема crisp, громкость 0.22 — на грани слышимости, замечают, когда пропадает.
 * Один и тот же щелчок на всё, что нажимается (двухтоновые переключатели убраны по просьбе заказчика).
 * Переключатель в хедере, выбор в localStorage. prefers-reduced-motion пакеты уважают сами.
 */
import { TextMorph } from './vendor/torph.mjs';
import { tiks } from './vendor/tiks/index.js';
import Lenis from './vendor/lenis.mjs';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const MINT = '108, 217, 217';
/** Есть ли у браузера scroll-driven анимации: тогда уроки и IDM едут по CSS (fx.css §7). */
const SCROLL_DRIVEN = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

/* ---------------------------------------------------------------------------
   1. Пиксельное поле
   Раскладка задана таблицей, а не случайными числами: картинка одинакова при
   каждой загрузке. x/y — % ширины и высоты, size — px, peak — пиковая
   прозрачность, dur/delay — цикл и сдвиг в секундах, accent — мятная клетка.
   --------------------------------------------------------------------------- */
const PIXELS = [
  { x: 4, y: 18, size: 14, peak: 0.07, dur: 9, delay: 0 },
  { x: 11, y: 62, size: 10, peak: 0.05, dur: 11, delay: 1.5 },
  { x: 17, y: 34, size: 18, peak: 0.06, dur: 8, delay: 3.2, accent: true },
  { x: 23, y: 78, size: 12, peak: 0.04, dur: 12, delay: 0.8 },
  { x: 29, y: 12, size: 10, peak: 0.08, dur: 7, delay: 2.4 },
  { x: 35, y: 52, size: 16, peak: 0.05, dur: 13, delay: 4.1 },
  { x: 41, y: 26, size: 12, peak: 0.06, dur: 10, delay: 1.1, accent: true },
  { x: 47, y: 70, size: 14, peak: 0.04, dur: 9, delay: 5.3 },
  { x: 53, y: 40, size: 10, peak: 0.09, dur: 6, delay: 2.7 },
  { x: 59, y: 16, size: 18, peak: 0.05, dur: 14, delay: 0.4 },
  { x: 64, y: 58, size: 12, peak: 0.07, dur: 8, delay: 3.9, accent: true },
  { x: 70, y: 30, size: 14, peak: 0.05, dur: 11, delay: 1.9 },
  { x: 76, y: 74, size: 10, peak: 0.06, dur: 9, delay: 4.6 },
  { x: 81, y: 22, size: 16, peak: 0.04, dur: 12, delay: 2.2 },
  { x: 87, y: 48, size: 12, peak: 0.08, dur: 7, delay: 5.8, accent: true },
  { x: 92, y: 66, size: 14, peak: 0.05, dur: 10, delay: 0.9 },
  { x: 96, y: 28, size: 10, peak: 0.06, dur: 13, delay: 3.4 },
  { x: 8, y: 44, size: 12, peak: 0.05, dur: 8, delay: 6.2 },
  { x: 44, y: 84, size: 10, peak: 0.04, dur: 11, delay: 2.9 },
  { x: 67, y: 88, size: 12, peak: 0.05, dur: 9, delay: 4.8 },
];

/* Плотный слой — для широких полотен (hero, футер): редкие точки там теряются */
const DENSE = [
  { x: 2, y: 8, size: 10, peak: 0.06, dur: 10, delay: 1.2 },
  { x: 6, y: 32, size: 8, peak: 0.05, dur: 8, delay: 4.4 },
  { x: 9, y: 76, size: 12, peak: 0.06, dur: 12, delay: 0.3, accent: true },
  { x: 14, y: 10, size: 14, peak: 0.05, dur: 9, delay: 5.1 },
  { x: 14, y: 46, size: 8, peak: 0.07, dur: 7, delay: 2.1 },
  { x: 20, y: 24, size: 10, peak: 0.05, dur: 13, delay: 3.6 },
  { x: 20, y: 90, size: 8, peak: 0.06, dur: 9, delay: 6.4 },
  { x: 26, y: 56, size: 14, peak: 0.05, dur: 11, delay: 1.7 },
  { x: 27, y: 4, size: 8, peak: 0.07, dur: 8, delay: 4.9, accent: true },
  { x: 32, y: 70, size: 10, peak: 0.06, dur: 10, delay: 2.6 },
  { x: 33, y: 36, size: 8, peak: 0.05, dur: 14, delay: 0.7 },
  { x: 38, y: 6, size: 12, peak: 0.06, dur: 9, delay: 3.1 },
  { x: 38, y: 62, size: 8, peak: 0.05, dur: 12, delay: 5.6 },
  { x: 43, y: 44, size: 10, peak: 0.07, dur: 7, delay: 1.4 },
  { x: 48, y: 22, size: 8, peak: 0.05, dur: 11, delay: 4.2, accent: true },
  { x: 50, y: 92, size: 10, peak: 0.06, dur: 8, delay: 2.8 },
  { x: 55, y: 64, size: 12, peak: 0.05, dur: 13, delay: 0.5 },
  { x: 56, y: 6, size: 8, peak: 0.06, dur: 10, delay: 5.9 },
  { x: 61, y: 38, size: 10, peak: 0.05, dur: 9, delay: 3.3 },
  { x: 62, y: 80, size: 8, peak: 0.07, dur: 12, delay: 1.0 },
  { x: 68, y: 8, size: 12, peak: 0.05, dur: 8, delay: 4.7 },
  { x: 69, y: 46, size: 8, peak: 0.06, dur: 14, delay: 2.3, accent: true },
  { x: 74, y: 62, size: 10, peak: 0.05, dur: 10, delay: 6.1 },
  { x: 75, y: 90, size: 8, peak: 0.06, dur: 7, delay: 0.6 },
  { x: 79, y: 6, size: 10, peak: 0.05, dur: 11, delay: 3.8 },
  { x: 84, y: 36, size: 8, peak: 0.06, dur: 9, delay: 1.6 },
  { x: 84, y: 82, size: 12, peak: 0.05, dur: 13, delay: 5.2 },
  { x: 89, y: 12, size: 8, peak: 0.07, dur: 8, delay: 2.5, accent: true },
  { x: 90, y: 58, size: 10, peak: 0.05, dur: 12, delay: 4.0 },
  { x: 94, y: 84, size: 8, peak: 0.06, dur: 10, delay: 0.2 },
  { x: 96, y: 44, size: 12, peak: 0.05, dur: 9, delay: 5.5 },
  { x: 97, y: 10, size: 8, peak: 0.06, dur: 14, delay: 3.0 },
];

/**
 * Собрать слой клеток. `dense` добавляет второй слой и поднимает пик, `boost` —
 * множитель поверх: на узкой карточке спокойная раскладка читается как пара
 * случайных точек. `under` кладёт слой под содержимое хозяина (z-index: -1).
 */
export function pixelField({ dense = false, boost = 1, under = false } = {}) {
  const layer = document.createElement('span');
  layer.className = under ? 'gfx-field gfx-field-under' : 'gfx-field';
  layer.setAttribute('aria-hidden', 'true');
  const pixels = dense ? PIXELS.concat(DENSE) : PIXELS;
  const peak = (dense ? 1.7 : 1) * boost;
  const frag = document.createDocumentFragment();
  for (const p of pixels) {
    const px = document.createElement('span');
    px.className = 'gfx-px';
    px.style.cssText = [
      `left:${p.x}%`, `top:${p.y}%`, `width:${p.size}px`, `height:${p.size}px`,
      `--c:${p.accent ? `rgb(${MINT})` : '#ffffff'}`,
      `--peak:${Math.round(p.peak * peak * 1000) / 1000}`,
      `--d:${p.dur}s`, `--delay:${p.delay}s`,
    ].join(';');
    frag.appendChild(px);
  }
  layer.appendChild(frag);
  return layer;
}

/* ---------------------------------------------------------------------------
   2. Пиксели активной вкладки
   left — % ширины, top — px от верха слоя высотой 52 px, size 11 | 22,
   alpha — hex, anim — 1..3, mix —
   доля цвета в квадратике (остальное белое): разброс тона, а не один цвет.
   --------------------------------------------------------------------------- */
const SQUARES = [
  { left: 0, top: 10, size: 11, alpha: '4e', anim: 2, duration: 0.98, mix: 100 },
  { left: 0, top: 15, size: 22, alpha: '30', anim: 3, duration: 1.24, mix: 72 },
  { left: 16, top: 31, size: 11, alpha: '1c', anim: 3, duration: 1.14, mix: 92 },
  { left: 24, top: 20, size: 11, alpha: '18', anim: 1, duration: 1.22, mix: 58 },
  { left: 24, top: 41, size: 11, alpha: '39', anim: 2, duration: 1.1, mix: 84 },
  { left: 32, top: 15, size: 22, alpha: '26', anim: 1, duration: 1.01, mix: 100 },
  { left: 40, top: 31, size: 11, alpha: '43', anim: 1, duration: 0.92, mix: 66 },
  { left: 48, top: 10, size: 11, alpha: '4e', anim: 2, duration: 1.49, mix: 96 },
  { left: 48, top: 15, size: 22, alpha: '17', anim: 2, duration: 1.67, mix: 78 },
  { left: 64, top: 0, size: 22, alpha: '2d', anim: 3, duration: 1.57, mix: 62 },
  { left: 64, top: 30, size: 22, alpha: '12', anim: 1, duration: 0.95, mix: 88 },
  { left: 80, top: 10, size: 11, alpha: '4a', anim: 2, duration: 1.64, mix: 70 },
  { left: 88, top: 0, size: 11, alpha: '15', anim: 1, duration: 1.03, mix: 100 },
  { left: 88, top: 22, size: 22, alpha: '1c', anim: 2, duration: 1.4, mix: 60 },
];

/**
 * Повесить слой квадратиков на элемент. `k` масштабирует размеры и вертикаль
 * (для строки меню 0.45, для вкладки 0.7), горизонталь остаётся в процентах —
 * квадратики расходятся по всей ширине. `rgb` — цвет, `cap` — потолок альфы.
 * Показ решает CSS по [data-gfx-active].
 */
export function squares(host, { k = 1, rgb = MINT, cap = 0.72 } = {}) {
  const layer = document.createElement('span');
  layer.className = 'gfx-sq-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.height = `${Math.round(52 * k)}px`;
  SQUARES.forEach((sq, i) => {
    const alpha = Math.min(cap, (parseInt(sq.alpha, 16) / 255) * 2.3).toFixed(3);
    const s = document.createElement('span');
    s.className = 'gfx-sq';
    s.style.cssText = [
      `left:${sq.left}%`, `top:${Math.round(sq.top * k)}px`,
      `width:${Math.round(sq.size * k)}px`, `height:${Math.round(sq.size * k)}px`,
      `--c:color-mix(in srgb, rgba(${rgb}, ${alpha}) ${sq.mix}%, rgba(255, 255, 255, ${alpha}))`,
      `--anim:gfx-sq${sq.anim}`, `--d:${sq.duration}s`, `--i:${i}`,
    ].join(';');
    layer.appendChild(s);
  });
  host.classList.add('gfx-sq-host');
  host.appendChild(layer);
  return layer;
}

/* ---------------------------------------------------------------------------
   3. Свет и искры на кнопках (свет и искры)
   x — % ширины, size — px, dist — высота подъёма при слое 96 px (масштабируется
   под высоту кнопки), peak — пиковая прозрачность, dur/delay — секунды.
   --------------------------------------------------------------------------- */
const SPARKS = [
  { x: 5, size: 3, dist: 62, peak: 0.5, dur: 3.2, delay: 0 },
  { x: 12, size: 2, dist: 48, peak: 0.35, dur: 4.1, delay: 1.4 },
  { x: 19, size: 4, dist: 76, peak: 0.55, dur: 3.6, delay: 0.6 },
  { x: 26, size: 2, dist: 40, peak: 0.3, dur: 4.6, delay: 2.2 },
  { x: 33, size: 3, dist: 68, peak: 0.45, dur: 3.9, delay: 1.1 },
  { x: 40, size: 2, dist: 52, peak: 0.32, dur: 4.4, delay: 2.9 },
  { x: 47, size: 4, dist: 84, peak: 0.6, dur: 3.4, delay: 0.3 },
  { x: 54, size: 2, dist: 44, peak: 0.34, dur: 4.8, delay: 1.8 },
  { x: 61, size: 3, dist: 70, peak: 0.48, dur: 3.7, delay: 0.9 },
  { x: 68, size: 2, dist: 50, peak: 0.3, dur: 4.3, delay: 2.5 },
  { x: 75, size: 4, dist: 78, peak: 0.52, dur: 3.5, delay: 1.6 },
  { x: 82, size: 2, dist: 46, peak: 0.33, dur: 4.7, delay: 0.5 },
  { x: 89, size: 3, dist: 64, peak: 0.46, dur: 3.8, delay: 2.1 },
  { x: 95, size: 2, dist: 54, peak: 0.31, dur: 4.2, delay: 1.2 },
];

/**
 * Слой света и искр внутри кнопки. Искры летят по циклу, пока кнопка под
 * курсором (CSS ставит animation-play-state), дистанция подъёма — от высоты
 * кнопки, чтобы на низкой они не вылетали за верх в первой же трети пути.
 * Циклы у искр короткие (1.6–2.4 с): наведение длится секунды, а не минуты.
 */
export function riseLayer(host) {
  const layer = document.createElement('span');
  layer.className = 'gfx-rise-layer';
  layer.setAttribute('aria-hidden', 'true');
  const glow = document.createElement('span');
  glow.className = 'gfx-rise-glow';
  layer.appendChild(glow);
  const k = Math.max(0.6, Math.min(1.4, (host.offsetHeight || 66) / 72));
  for (const s of SPARKS) {
    const spark = document.createElement('span');
    spark.className = 'gfx-spark';
    // Искры чуть крупнее и ярче базовой таблицы: белые на мяте читаются слабее, чем на чёрном
    const size = s.size + 1;
    spark.style.cssText = [
      `left:${s.x}%`, `width:${size}px`, `height:${size}px`,
      `--peak:${Math.min(1, s.peak * 1.5)}`, `--dist:${Math.round(s.dist * k)}px`,
      `--d:${(s.dur / 2).toFixed(2)}s`, `--delay:${(s.delay / 2).toFixed(2)}s`,
    ].join(';');
    layer.appendChild(spark);
  }
  host.classList.add('gfx-rise-host');
  host.appendChild(layer);
  return layer;
}

/* ---------------------------------------------------------------------------
   4. Перетекание текста
   Один экземпляр TextMorph на элемент; 260 мс и та же кривая, что у остальных
   движений. numbers: цифры перетекают поразрядно — в «73» меняется только
   та, что изменилась. Пакет сам уважает prefers-reduced-motion.

   Первое обновление у свежего экземпляра пакет считает начальной отрисовкой и
   не анимирует — так первый шаг счётчика 73 % прыгал. Поэтому при создании
   сначала отдаём текущий текст элемента, и только потом новый.
   --------------------------------------------------------------------------- */
const morphs = new WeakMap();

export function morphText(el, text, opts = {}) {
  if (!el) return;
  const value = String(text);
  let m = morphs.get(el);
  if (!m) {
    const current = el.textContent.replace(/\s+/g, ' ').trim();
    m = new TextMorph({ element: el, duration: 260, ease: EASE, locale: 'ru', numbers: true, ...opts });
    morphs.set(el, m);
    if (current && current !== value) m.update(current);
  }
  m.update(value);
}

/**
 * Смена длинного текста: короткое затухание с размытием, подмена, проявление.
 * Для абзацев вместо морфа: torph режет длинный текст по словам и может
 * перенести строку внутри слова. Размытие прячет момент, когда старый и новый
 * текст видны одновременно (приём Emil Kowalski). Повторный вызов до конца
 * анимации перебивает предыдущую.
 */
const swaps = new WeakMap();

export function swapText(el, text, { duration = 240 } = {}) {
  if (!el) return;
  const value = String(text);
  if (el.textContent === value) return;
  swaps.get(el)?.cancel();
  if (REDUCED.matches || typeof el.animate !== 'function') {
    el.textContent = value;
    return;
  }
  const out = el.animate(
    [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(3px)' }],
    { duration: Math.round(duration * 0.4), easing: 'linear', fill: 'forwards' },
  );
  swaps.set(el, out);
  out.onfinish = () => {
    el.textContent = value;
    out.cancel();
    const back = el.animate(
      [{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)' }],
      { duration, easing: EASE },
    );
    swaps.set(el, back);
  };
}

/* ---------------------------------------------------------------------------
   5. Lenis — плавная прокрутка
   Родной smooth у автора выключен в fx.css. Якоря (main.js) и слайдер
   модулей (slider.js) ездят через scrollToY; на время окна оплаты прокрутка
   остановлена. Меньше движения — пакет сам не включается (respectReducedMotion).
   --------------------------------------------------------------------------- */
let lenis = null;

function initLenis() {
  if (REDUCED.matches) return;
  lenis = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  // Наружу — для консоли и внешних скриптов (метрика, виджеты): window.gfx.scrollToY(y)
  window.gfx = { lenis, scrollToY };
}

export function scrollToY(y) {
  if (lenis && !lenis.isStopped) {
    lenis.scrollTo(y, { duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
  } else {
    window.scrollTo({ top: y, behavior: REDUCED.matches ? 'auto' : 'smooth' });
  }
}

export function lenisStop() {
  lenis?.stop();
}

export function lenisStart() {
  lenis?.start();
}

/* ---------------------------------------------------------------------------
   6. Звук
   Один делегированный слушатель на документ: щёлкает всё, что нажимается,
   одним и тем же звуком. data-sfx="off" — тишина, data-sfx="pop" — другой звук.
   --------------------------------------------------------------------------- */
const SFX_KEY = 'gfx-sfx';

function sfxOn() {
  try {
    return localStorage.getItem(SFX_KEY) !== 'off';
  } catch {
    return true;
  }
}

function initSfx() {
  tiks.init({ theme: 'crisp', volume: 0.22, muted: !sfxOn(), hoverThrottleMs: 0 });

  const CLICKABLE = 'button, a[href], summary, [role="button"], [role="tab"]';
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
    if (!el || el.closest('[data-sfx="off"]')) return;
    // Атрибут disabled здесь НЕ проверяем: по выключенной кнопке браузер click не шлёт вовсе,
    // а стрелка карусели, которая выключилась в этом же нажатии (последний слайд), — это
    // состоявшееся действие, и ответить на него надо
    if (el.getAttribute('aria-disabled') === 'true') return;
    const name = el.dataset.sfx;
    if (name && name !== 'click' && typeof tiks[name] === 'function') tiks[name]();
    else tiks.click();
  });

  const btn = document.querySelector('.gfx-sfx');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(sfxOn()));
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(next));
    try {
      localStorage.setItem(SFX_KEY, next ? 'on' : 'off');
    } catch {
      /* приватное окно — хватит и на этот заход */
    }
    if (next) {
      tiks.unmute();
      // Щелчок в ответ на само включение: иначе непонятно, заработало ли и как звучит
      tiks.click();
    } else {
      tiks.mute();
    }
  });
}

/* ---------------------------------------------------------------------------
   7. Где лежат пиксели, квадратики и свет
   --------------------------------------------------------------------------- */
function initPixels() {
  // Поля лежат на фоне секций, под карточками. Карточки над ними — стекло с backdrop-filter
  // (fx.css §1): сквозь них клетки идут размытыми и не спорят с текстом. Карточка «genesis» —
  // авторское стекло над полем hero, своего поля у неё больше нет.
  const heroBg = document.querySelector('.hero-section > .hero-bg-layer');
  if (heroBg) heroBg.after(pixelField({ dense: true, boost: 1.2 }));

  const tariffs = document.querySelector('.tariffs-section');
  if (tariffs) tariffs.prepend(pixelField({ dense: true, boost: 1.4 }));

  // FAQ читают долго — поле спокойное, без плотного слоя
  const faq = document.querySelector('.faq-section');
  if (faq) faq.prepend(pixelField({ boost: 1.3 }));

  const footerBg = document.querySelector('.footer-cta-section > .footer-cta-bg-wrap');
  if (footerBg) footerBg.after(pixelField({ dense: true, boost: 1 }));

  // Рекомендованный тариф непрозрачный (мятная рамка авторская), поэтому поле у него своё,
  // размытое filter-ом прямо на слое: клетки читаются мягкими пятнами
  const featured = document.querySelector('.tariff-card-featured-inner');
  if (featured) {
    const field = pixelField({ dense: true, boost: 1.6, under: true });
    field.classList.add('gfx-field-deep');
    featured.append(field);
  }

  // Квадратиков под текстом вкладок экосистемы и пунктов меню больше нет (владелец: мешают
  // читать); активную вкладку показывает авторский белый, активный пункт меню — мятный цвет.

  // Кнопки: свет снизу и искры вверх при наведении и фокусе
  document
    .querySelectorAll('.hero-cta-btn, .scenarios-cta-btn, .app-cta-btn, .footer-btn-primary, .footer-btn-secondary, .tariff-btn, .faq-support-btn')
    .forEach((btn) => riseLayer(btn));
}

/* ---------------------------------------------------------------------------
   7а. Размытие под хедером
   Один слой backdrop-filter с маской (fx.css §11а): полная сила у верхней
   кромки, к хвосту сходит на нет. На телефоне слой спрятан стилями.
   --------------------------------------------------------------------------- */
function initHeaderBlur() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const wrap = document.createElement('span');
  wrap.className = 'gfx-header-blur';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.appendChild(document.createElement('span'));
  header.prepend(wrap);
}

/* ---------------------------------------------------------------------------
   8. Scroll-spy: активный раздел в меню
   Активен последний раздел, чей верх поднялся выше 45 % экрана. aria-current
   — для читалок, data-gfx-active — для пикселей.
   --------------------------------------------------------------------------- */
function initSpy() {
  const links = [...document.querySelectorAll('.header-nav .nav-link')].filter((l) => l.hash.length > 1);
  const pairs = links
    .map((l) => [document.getElementById(l.hash.slice(1)), l])
    .filter(([section]) => section);
  if (!pairs.length) return;

  let current = null;
  let raf = 0;
  const update = () => {
    raf = 0;
    const line = window.innerHeight * 0.45;
    let active = null;
    for (const [section, link] of pairs) {
      if (section.getBoundingClientRect().top <= line) active = link;
    }
    if (active === current) return;
    if (current) {
      current.removeAttribute('aria-current');
      current.removeAttribute('data-gfx-active');
    }
    current = active;
    if (current) {
      current.setAttribute('aria-current', 'location');
      current.setAttribute('data-gfx-active', '');
    }
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------
   9. Появление карточек при прокрутке (один раз)
   Только элементам ниже первого экрана — то, что видно сразу, не мигает.
   Лесенка считается среди соседей по родителю (до 8 ступеней). После
   появления атрибут снимается: hover-состояния карточек остаются авторскими.
   Уроки и IDM здесь только там, где нет scroll-driven анимаций (fx.css §7).
   Карточки каруселей (отзывы, гайды) намеренно не в списке: уехавшие за край
   трека обрезаны overflow и не пересекают экран — проявлялись бы с опозданием.
   --------------------------------------------------------------------------- */
function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const list = [
    '.scenario-card', '.tariff-card', '.tariff-card-featured-wrap', '.faq-item-group',
    '.screenshot-item', '.ecosystem-box', '.video-preview-card', '.trailer-video-box',
    '.observation-stat-box',
  ];
  if (!SCROLL_DRIVEN) list.push('.lesson-card', '.app-feature-card', '.app-phone-item');
  const els = [...document.querySelectorAll(list.join(', '))].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const perParent = new Map();
  for (const el of els) {
    const i = perParent.get(el.parentElement) ?? 0;
    perParent.set(el.parentElement, i + 1);
    el.style.setProperty('--reveal-i', String(Math.min(i, 8)));
    el.setAttribute('data-reveal', '');
  }
  const cleanup = (el) => {
    el.removeAttribute('data-reveal');
    el.classList.remove('is-in');
    el.style.removeProperty('--reveal-i');
  };
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add('is-in');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        cleanup(el);
      };
      el.addEventListener('transitionend', (e) => {
        if (e.target === el && e.propertyName === 'opacity') finish();
      });
      // Страховка: reduced-motion обнуляет длительности, и transitionend может не прийти
      setTimeout(finish, 1400);
    }
  // Верхняя граница уведена далеко вверх: всё, что уже выше экрана, считается показанным.
  // Иначе прыжок по якорю или возврат назад перескочил бы карточки, и они остались бы невидимыми.
  }, { rootMargin: '100000px 0px -8% 0px', threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------------------
   10. Счётчик 73 %: ступени по ease-out, каждая ступень — перетекание цифр.
   Экземпляр морфа создаётся заранее, чтобы первая ступень тоже анимировалась.
   --------------------------------------------------------------------------- */
function initCount() {
  document.querySelectorAll('[data-gfx-count]').forEach((el) => {
    const target = Number(el.dataset.gfxCount);
    if (!Number.isFinite(target)) return;
    const start = el.textContent.trim() || '1';
    morphText(el, start, { duration: 320 });
    const run = () => {
      if (REDUCED.matches) {
        el.textContent = String(target);
        return;
      }
      const STEPS = 9;
      const steps = Array.from({ length: STEPS }, (_, k) => {
        const t = (k + 1) / STEPS;
        return Math.round(1 + (target - 1) * (1 - Math.pow(1 - t, 3)));
      });
      let i = 0;
      const tick = () => {
        morphText(el, steps[i], { duration: 320 });
        if (++i < steps.length) setTimeout(tick, 150);
      };
      tick();
    };
    if (!('IntersectionObserver' in window)) {
      run();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      run();
    }, { threshold: 0.35 });
    io.observe(el);
  });
}

/* ---------------------------------------------------------------------------
   11. «01 / 05» под «Узнаешь себя?»: где ты в sticky-блоке сценариев.
   Активна последняя карточка, чей верх поднялся выше середины экрана.
   --------------------------------------------------------------------------- */
function initScenarioCounter() {
  // На десктопе липнет к экрану не сам h2 (он растянут на всю высоту блока), а его внутренний span
  const title = document.querySelector('.scenarios-left-title .scenarios-title-desktop')
    || document.querySelector('.scenarios-left-title');
  const cards = [...document.querySelectorAll('.scenario-card')];
  if (!title || cards.length < 2) return;
  const pad = (n) => String(n).padStart(2, '0');
  const counter = document.createElement('span');
  counter.className = 'gfx-scn-counter';
  counter.setAttribute('aria-hidden', 'true');
  const num = document.createElement('span');
  num.className = 'gfx-scn-num';
  num.textContent = pad(1);
  const total = document.createElement('span');
  total.className = 'gfx-scn-total';
  total.textContent = ` / ${pad(cards.length)}`;
  counter.append(num, total);
  title.appendChild(counter);

  let current = 1;
  let raf = 0;
  const update = () => {
    raf = 0;
    const line = window.innerHeight * 0.5;
    let idx = 0;
    cards.forEach((card, i) => {
      if (card.getBoundingClientRect().top < line) idx = i;
    });
    const next = idx + 1;
    if (next === current) return;
    current = next;
    morphText(num, pad(next));
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------
   12. «1 / 3» у каруселей — страницы, а не карточки: видно по три, и счётчик
   совпадает с числом нажатий стрелки. slider.js пишет index/max в dataset
   трека при каждом сдвиге и шлёт gfx:index.
   --------------------------------------------------------------------------- */
function initCarouselIndex() {
  const pairs = [
    ['.guides-nav-pill', 'guides-track'],
    ['.feedbacks-carousel-controls', 'feedbacks-track'],
  ];
  for (const [pillSelector, trackId] of pairs) {
    const pill = document.querySelector(pillSelector);
    const track = document.getElementById(trackId);
    if (!pill || !track || !track.children.length) continue;
    const el = document.createElement('span');
    el.className = 'gfx-index';
    el.setAttribute('aria-hidden', 'true');
    const cur = document.createElement('span');
    cur.className = 'gfx-index-cur';
    const sep = document.createElement('span');
    sep.className = 'gfx-index-sep';
    sep.textContent = ' / ';
    const total = document.createElement('span');
    total.className = 'gfx-index-total';
    const index = Number(track.dataset.gfxIndex ?? 0);
    const max = Number(track.dataset.gfxMax ?? 0);
    cur.textContent = String(index + 1);
    total.textContent = String(max + 1);
    el.append(cur, sep, total);
    pill.appendChild(el);
    track.addEventListener('gfx:index', (e) => {
      morphText(cur, e.detail.index + 1);
      morphText(total, e.detail.max + 1);
    });
  }
}

/* ---------------------------------------------------------------------------
   13. Отзывы: цитата свёрнута до пяти строк, «Показать больше» раскрывает.
   Высота анимируется к точному значению (max-height → scrollHeight), а не к
   «большому числу»: скорость движения тогда одинакова у всех карточек.
   --------------------------------------------------------------------------- */
function initFeedbackMore() {
  const COLLAPSED = 104; // пять строк по 20.8 px
  document.querySelectorAll('.feedback-card').forEach((card) => {
    const quote = card.querySelector('.feedback-quote');
    if (!quote || quote.scrollHeight <= COLLAPSED + 6) return;
    quote.classList.add('is-clamped');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gfx-more';
    btn.textContent = 'Показать больше';
    btn.setAttribute('aria-expanded', 'false');
    quote.after(btn);

    let open = false;
    const settle = (e) => {
      if (e.target !== quote || e.propertyName !== 'max-height') return;
      quote.removeEventListener('transitionend', settle);
      if (open) quote.style.maxHeight = 'none';
    };
    btn.addEventListener('click', () => {
      open = !open;
      quote.removeEventListener('transitionend', settle);
      if (open) {
        quote.style.maxHeight = `${quote.scrollHeight}px`;
        card.classList.add('is-open');
      } else {
        // Из «none» переход не идёт: сначала фиксируем текущую высоту, потом сворачиваем
        quote.style.maxHeight = `${quote.scrollHeight}px`;
        void quote.offsetHeight;
        quote.style.maxHeight = '';
        card.classList.remove('is-open');
      }
      quote.addEventListener('transitionend', settle);
      btn.setAttribute('aria-expanded', String(open));
      morphText(btn, open ? 'Скрыть' : 'Показать больше', { numbers: false, duration: 300 });
    });
  });
}

/* ---------------------------------------------------------------------------
   14. Окно оплаты на телефоне — лист снизу (fx.css §11б).
   Ручка сверху; свайп за неё тянет лист вниз, вверх — с сопротивлением.
   Отпустили: дальше четверти высоты или быстрее 0.11 px/мс — закрываем
   через авторскую кнопку (её логика фокуса и прокрутки остаётся), иначе лист
   возвращается. Захват указателя — жест не теряется, если палец ушёл с ручки;
   второй палец во время жеста игнорируется.
   --------------------------------------------------------------------------- */
function initDrawer() {
  const modal = document.getElementById('payment-modal');
  const dialog = modal?.querySelector('.payment-modal__dialog');
  const closeBtn = modal?.querySelector('.payment-modal__close');
  if (!modal || !dialog || !closeBtn) return;

  const grip = document.createElement('div');
  grip.className = 'gfx-drawer-grip';
  grip.setAttribute('aria-hidden', 'true');
  dialog.prepend(grip);

  // Вход: авторский код снимает hidden — ловим это и стартуем с положения «за экраном»
  // (класс is-entering, fx.css), reflow, снимаем класс: переход идёт к обычному состоянию.
  // Так на обоих раскладках: на десктопе окно всплывает из центра, на телефоне лист снизу.
  new MutationObserver(() => {
    if (modal.hidden || modal.classList.contains('is-closing')) return;
    modal.classList.add('is-entering');
    void dialog.getBoundingClientRect();
    modal.classList.remove('is-entering');
  }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });

  const phone = window.matchMedia('(max-width: 768px)');
  let dragging = false;
  let pointerId = null;
  let startY = 0;
  let startT = 0;
  let dy = 0;

  const damp = (d) => (d < 0 ? -Math.pow(-d, 0.72) : d);

  grip.addEventListener('pointerdown', (e) => {
    if (!phone.matches || dragging) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    startY = e.clientY;
    startT = performance.now();
    dy = 0;
    dialog.classList.add('is-dragging');
    try {
      grip.setPointerCapture(pointerId);
    } catch {
      /* синтетический указатель без захвата — жест всё равно дойдёт до конца */
    }
    e.preventDefault();
  });

  grip.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dy = e.clientY - startY;
    dialog.style.transform = `translateY(${damp(dy).toFixed(1)}px)`;
  });

  const release = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    dialog.classList.remove('is-dragging');
    const velocity = dy / Math.max(1, performance.now() - startT);
    const height = dialog.getBoundingClientRect().height;
    if (dy > height * 0.25 || velocity > 0.11) {
      // Закрыть: авторский обработчик ставит hidden, а inline-сдвиг снимаем кадром позже —
      // лист уезжает из точки, где его отпустили, а не прыгает к началу
      closeBtn.click();
      requestAnimationFrame(() => {
        dialog.style.transform = '';
      });
    } else {
      dialog.style.transform = '';
    }
  };
  grip.addEventListener('pointerup', release);
  grip.addEventListener('pointercancel', release);
}

/* ---------------------------------------------------------------------------
   Вход. Вызывается из main.js после инициализации авторских компонентов.
   --------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   Телефоны IDM: три .app-phone-item собираются в один ряд .gfx-idm-track.
   На телефоне ряд едет по горизонтали вместе с прокруткой (fx.css), на
   десктопе обёртка display: contents — авторская абсолютная раскладка
   остаётся как есть.
   --------------------------------------------------------------------------- */
function initIdmStrip() {
  const stage = document.querySelector('.app-phones-stage');
  const items = stage ? [...stage.querySelectorAll('.app-phone-item')] : [];
  if (items.length < 2) return;
  const strip = document.createElement('div');
  strip.className = 'gfx-idm-strip';
  const track = document.createElement('div');
  track.className = 'gfx-idm-track';
  items.forEach((item) => track.appendChild(item));
  strip.appendChild(track);
  stage.appendChild(strip);

  // Полоса на всю ширину экрана: сцену автор ограничивает max-width, поэтому
  // ширина и вынос к левой кромке считаются от положения сцены
  const narrow = window.matchMedia('(max-width: 640px)');
  const fit = () => {
    if (!narrow.matches) {
      strip.style.width = '';
      strip.style.marginLeft = '';
      return;
    }
    strip.style.width = `${document.documentElement.clientWidth}px`;
    strip.style.marginLeft = `${-stage.getBoundingClientRect().left}px`;
  };
  fit();
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });
}

export function initFx() {
  initLenis();
  initSfx();
  initHeaderBlur();
  initPixels();
  initSpy();
  initIdmStrip();
  initReveal();
  initCount();
  initScenarioCounter();
  initCarouselIndex();
  initFeedbackMore();
  initDrawer();
}
