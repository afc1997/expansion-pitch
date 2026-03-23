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
  return {
    P1:  5 * vw,  maxH1: 4 * vw,   // 5 panels (all 100vw), dwell at panel 5
    P2:  0,       maxV:  0,
    P3:  0,       maxH3: 0
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
    project:   vw,        // card panel of h-track-1
    visual:    P1,        // start of phase 2
    directors: P1 + P2   // start of phase 3
  };
  if (targets[sectionId] !== undefined) target = targets[sectionId];
}


// ============================================================
// NAV — highlight active section, hide on hero panel
// ============================================================
const tnavBtns = document.querySelectorAll('.tnav-btn');
const topnav   = document.querySelector('.topnav');

function updateNav(scrollY) {
  const { P1, P2 } = getPhases();
  const vw = window.innerWidth;
  let active = '';
  if (scrollY >= P1 + P2) active = 'directors';
  else if (scrollY >= P1)  active = 'visual';
  else if (scrollY >= vw)  active = 'project';

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
  current = lerp(current, target, 0.095);

  const { P1, P2, P3, maxH1, maxV, maxH3 } = getPhases();

  const x1 = Math.min(Math.max(current, 0), maxH1);
  const y2 = Math.min(Math.max(current - P1, 0), maxV);
  const x3 = Math.min(Math.max(current - P1 - P2, 0), maxH3);

  track1.style.transform = `translateX(${-x1}px)`;
  vTrack.style.transform  = `translateY(${-y2}px)`;
  track3.style.transform  = `translateX(${-x3}px)`;

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

  updateNav(current);
  updateCards(current);

  requestAnimationFrame(tick);
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

window.addEventListener('load', () => {
  initSpacer();
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
