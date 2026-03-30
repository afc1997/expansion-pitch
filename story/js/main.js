// ============================================================
// PHASE MATH
// h-track-1: 6 panels (Hero, Intro, Synopsis, CharsA, CharsB, Statement)
// v-track:    7 panels (Card, Tone, Camera, ProdDesign, Music, Sound, Edit)
// h-track-3:  4 panels (Card, Bio, Work, Credits)
//
// P = scroll distance for phase (includes 1-unit dwell on last panel so it's readable)
// max = maximum track offset (= (panels-1) × unit)
// ============================================================
function getPhases() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const track1El = document.getElementById('h-track-1');
  const track1W  = track1El ? track1El.scrollWidth : 0;
  const maxH1    = Math.max(0, track1W - vw);
  const vTrackEl = document.getElementById('v-track');
  const vTrackH  = vTrackEl ? vTrackEl.scrollHeight : 0;
  const maxV     = Math.max(0, vTrackH - vh);
  return {
    P1:   maxH1,  maxH1,
    P2:   maxV > 0 ? maxV + vh * 0.5 : 0,  maxV,
    P3:   0,           maxH3: 0
  };
}


// ============================================================
// VIRTUAL SCROLL — driven by horizontal trackpad / wheel
// ============================================================
let target  = 0;
let current = 0;

function getMaxScroll() {
  const { P1, P2, P3 } = getPhases();
  return P1 + P2 + P3;
}

window.addEventListener('wheel', e => {
  e.preventDefault();
  // Prefer horizontal delta; fall back to vertical (standard mouse wheel)
  const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  target = Math.max(0, Math.min(target + delta, getMaxScroll()));
}, { passive: false });


// ============================================================
// NAVIGATION
// ============================================================
function scrollToPanel(index) {
  target = Math.max(0, Math.min(index * window.innerWidth, getMaxScroll()));
}

function scrollToSection(sectionId) {
  const { P1, P2 } = getPhases();
  const vw = window.innerWidth;
  const targets = {
    project:            vw,          // Intro panel
    characters:         vw * 5,     // Jonathan panel
    setting:            vw * 6.96,  // House panel
    'visual-treatment': P1,          // Visual Treatment title card
    visual:             P1,
    directors:          P1 + P2
  };
  if (targets[sectionId] !== undefined) target = targets[sectionId];
}


// ============================================================
// NAV — highlight active section, hide on hero panel
// ============================================================
const tnavBtns = document.querySelectorAll('.tnav-btn');
const topnav   = document.querySelector('.topnav');

const progressBar = document.getElementById('progress-bar');

function updateProgress(scrollY) {
  const max = getMaxScroll();
  const pct = max > 0 ? (scrollY / max) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + '%';
  if (progressBar) progressBar.classList.toggle('hidden', scrollY < window.innerWidth * 0.6);
}

function updateNav(scrollY) {
  const { P1, P2 } = getPhases();
  const vw = window.innerWidth;
  let active = '';
  if (scrollY >= vw * 9.31)      active = 'visual-treatment';
  else if (scrollY >= vw * 6.96) active = 'setting';
  else if (scrollY >= vw * 5)    active = 'characters';
  else if (scrollY >= vw)        active = 'project';

  tnavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === active);
  });

  // Hide nav while on hero panel (first panel)
  if (topnav) topnav.classList.toggle('hidden', scrollY < vw * 0.6);
}


// ============================================================
// CARD WORDS — fade in when card is centred in its track
// ============================================================
function updateCards(scrollY) {
  const { P1, P2, P3, maxH1, maxV, maxH3 } = getPhases();
  const vw = window.innerWidth, vh = window.innerHeight;

  document.querySelectorAll('#h-track-1 .panel-card').forEach(card => {
    const word = card.querySelector('.card-word');
    if (!word) return;
    const trackX = Math.min(scrollY, maxH1);
    word.classList.toggle('visible', Math.abs(trackX - card.offsetLeft) < vw * 0.75);
  });

  document.querySelectorAll('#v-track .panel-card').forEach(card => {
    const word = card.querySelector('.card-word');
    if (!word) return;
    const trackY = Math.max(0, Math.min(scrollY - P1, maxV));
    word.classList.toggle('visible', Math.abs(trackY - card.offsetTop) < vh * 0.75);
  });

  document.querySelectorAll('#h-track-3 .panel-card').forEach(card => {
    const word = card.querySelector('.card-word');
    if (!word) return;
    const trackX = Math.max(0, Math.min(scrollY - P1 - P2, maxH3));
    word.classList.toggle('visible', Math.abs(trackX - card.offsetLeft) < vw * 0.75);
  });
}


// ============================================================
// HERO TITLE — dynamic letter-spacing to fill screen width
// ============================================================
const heroTitle = document.querySelector('.hero-title');

function calcExpansionLetterSpacing() {
  if (!heroTitle) return;

  // Measure using canvas so we don't disturb the live animation
  const cs       = getComputedStyle(heroTitle);
  const fontSize = cs.fontSize; // e.g. "96px"
  const canvas   = document.createElement('canvas');
  const ctx      = canvas.getContext('2d');
  ctx.font = `300 ${fontSize} Cormorant Garamond, Georgia, serif`;
  const naturalW = ctx.measureText('EXPANSION').width;

  // "EXPANSION" = 9 chars; letter-spacing is applied after each character
  const ls = (window.innerWidth - naturalW) / 9;
  document.documentElement.style.setProperty('--ls-open', Math.max(0, ls) + 'px');
}

function initTitleHover() {
  if (!heroTitle) return;
  calcExpansionLetterSpacing();

  const fontSize = parseFloat(getComputedStyle(heroTitle).fontSize);
  const lsClose  = -0.02 * fontSize;

  let targetLs  = lsClose;
  let currentLs = lsClose;

  heroTitle.style.letterSpacing = lsClose + 'px';

  // Inertia loop — currentLs chases targetLs with lag
  (function lerpLoop() {
    currentLs += (targetLs - currentLs) * 0.015;
    heroTitle.style.letterSpacing = currentLs + 'px';
    requestAnimationFrame(lerpLoop);
  })();

  // X + Y both drive expansion — reaches full width at ~65% of diagonal
  document.addEventListener('mousemove', e => {
    const lsOpen = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--ls-open')
    ) || 0;
    const tx = e.clientX / window.innerWidth;
    const ty = e.clientY / window.innerHeight;
    // Scale so full expansion is reached before cursor hits the far corner
    const t  = Math.min((tx + ty) / 1.3, 1);
    const tEased = t * t;
    targetLs = lsClose + (lsOpen - lsClose) * tEased;
  });

  document.addEventListener('mouseleave', () => { targetLs = lsClose; });
}


// ============================================================
// INTRO — reveal image based on which half of page mouse is on
// ============================================================
function initIntroSups() {
  const imgWrap = document.getElementById('intro-img-wrap');
  if (!imgWrap) return;
  imgWrap.classList.add('visible');
}


// ============================================================
// THREE-TRACK SCROLL — lerp driven by window.scrollY
// ============================================================
const track1  = document.getElementById('h-track-1');
const vTrack  = document.getElementById('v-track');
const track3  = document.getElementById('h-track-3');
const spacer  = document.getElementById('spacer');

function initSpacer() {
  // No-op: overflow: hidden + virtual scroll replaces the tall spacer
}

function lerp(a, b, t) { return a + (b - a) * t; }

function tick() {
  current = lerp(current, target, 0.12);

  const { P1, P2, P3, maxH1, maxV, maxH3 } = getPhases();

  const x1 = Math.min(Math.max(current, 0), maxH1);
  const y2 = Math.min(Math.max(current - P1, 0), maxV);
  const x3 = Math.min(Math.max(current - P1 - P2, 0), maxH3);

  track1.style.transform = `translateX(${-x1}px)`;
  vTrack.style.transform  = `translateY(${-y2}px)`;
  track3.style.transform  = `translateX(${-x3}px)`;

  // h-track-1 stays on top; v-track and h-track-3 activate only when populated
  if (P2 > 0 || maxH3 > 0) {
    if (current < P1) {
      track1.style.zIndex = '3';
      vTrack.style.zIndex  = '2';
      track3.style.zIndex  = '1';
    } else if (current < P1 + P2) {
      track1.style.zIndex = '2';
      vTrack.style.zIndex  = '3';
      track3.style.zIndex  = '1';
    } else {
      track1.style.zIndex = '2';
      vTrack.style.zIndex  = '1';
      track3.style.zIndex  = '3';
    }
  }

  updateNav(current);
  updateCards(current);
  updateProgress(current);
  updateVtParallax(current);

  requestAnimationFrame(tick);
}

function updateVtParallax(scrollPos) {
  const thumbs = document.querySelectorAll('.vt-thumb img, .vt-thumb video');
  const vw = window.innerWidth;
  thumbs.forEach((el) => {
    const rect = el.closest('.vt-thumb').getBoundingClientRect();
    const center = (rect.left + rect.right) / 2;
    const ratio = (center / vw - 0.5) * 2;
    const shift = ratio * -15;
    el.style.transform = `translateX(${shift}%)`;
  });
}

function initSynopsisSlides() {
  const slides = document.querySelectorAll('.synopsis-slide');
  if (!slides.length) return;
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, 3000);
}

function initSynopsisBeats() {
  const beats = document.querySelectorAll('.synopsis-beat');
  const img   = document.getElementById('synopsisImg');
  if (!beats.length || !img) return;

  beats.forEach(beat => {
    beat.addEventListener('mouseenter', () => {
      beats.forEach(b => b.classList.remove('is-active'));
      beat.classList.add('is-active');
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = beat.dataset.img;
        img.style.opacity = '1';
      }, 200);
    });
  });
}

function initCharsTitle() {
  // No animation — static title
}

function initCharCarousels() {
  document.querySelectorAll('.char-carousel[data-hover-cycle]').forEach(carousel => {
    const imgs = carousel.querySelectorAll('.char-carousel-img');
    if (imgs.length < 2) return;
    let idx = 0;
    let timer = null;

    carousel.addEventListener('mouseenter', () => {
      timer = setInterval(() => {
        imgs[idx].classList.remove('is-active');
        idx = (idx + 1) % imgs.length;
        imgs[idx].classList.add('is-active');
      }, 1500);
    });

    carousel.addEventListener('mouseleave', () => {
      if (timer) { clearInterval(timer); timer = null; }
    });
  });
}

// ============================================================
// DRAGGABLE — click and move non-full-bleed elements
// ============================================================
function makeDraggable(el, centered) {
  let active = false, ox = 0, oy = 0, dx = 0, dy = 0;

  el.addEventListener('mousedown', e => {
    active = true;
    ox = e.clientX - dx;
    oy = e.clientY - dy;
    el.style.transition = 'none';
    el.style.zIndex = '50';
    el.style.opacity = '0.85';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!active) return;
    dx = e.clientX - ox;
    dy = e.clientY - oy;
    const base = centered ? 'translate(-50%, -50%)' : '';
    el.style.transform = `${base} translate(${dx}px, ${dy}px)`;
  });

  document.addEventListener('mouseup', () => {
    if (!active) return;
    active = false;
    el.style.transition = '';
    el.style.zIndex = '';
    el.style.opacity = '';
  });
}

function initDraggables() {
  const introImg = document.getElementById('intro-img-wrap');
  if (introImg) makeDraggable(introImg, true);

  document.querySelectorAll('.dir-vid').forEach(el => makeDraggable(el, false));
  document.querySelectorAll('.char-panel-img').forEach(el => {
    makeDraggable(el, el.classList.contains('char-panel-img--centered'));
  });
}


// ============================================================
// CUSTOM CURSOR — inverted circle with lerp lag
// ============================================================
function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.classList.add('visible');
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  // Expand on interactive elements
  const hoverTargets = 'a, button, [onclick], .dir-vid, .intro-img-wrap, .hero-title, .tnav-btn, .topnav-title';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets)) cursor.classList.remove('hover');
  });

  (function loop() {
    cx += (mx - cx) * 0.1;
    cy += (my - cy) * 0.1;
    cursor.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
    requestAnimationFrame(loop);
  })();
}


window.addEventListener('load', () => {
  initSpacer();
  initCursor();
  initDraggables();
  // 'load' fires after all resources including fonts — safe to measure immediately
  initTitleHover();
  initIntroSups();
  initSynopsisBeats();
  initSynopsisSlides();
  initCharCarousels();
  initCharsTitle();
  requestAnimationFrame(tick);
});

window.addEventListener('resize', () => {
  initSpacer();
  calcExpansionLetterSpacing();
});
