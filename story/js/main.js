// ============================================================
// HORIZONTAL SLIDESHOW — CLEAN TRANSITIONS
//
// Each panel is a full-viewport slide. When you scroll past a
// panel it disappears. The active panel clips from right as the
// next panel is revealed behind it.
// ============================================================

const SLIVER = 0; // no slivers — panels disappear when scrolled past
const panels = Array.from(document.querySelectorAll('#h-track-1 .panel'));
const numPanels = panels.length;

// ── virtual scroll state ─────────────────────────────────────
let target  = 0;
let current = 0;

function getScrollUnit() { return window.innerWidth; }

// Save scroll position so page reloads return to the same spot
function saveScroll() {
  sessionStorage.setItem('expansionScroll', String(target));
}
function getMaxScroll()   { return (numPanels - 1) * getScrollUnit(); }

// ── input: wheel (with snap-to-panel on idle) ─────────────────
let snapTimer = null;
window.addEventListener('wheel', e => {
  if (document.body.dataset.lightboxOpen) return;
  e.preventDefault();
  const d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  target = Math.max(0, Math.min(target + d, getMaxScroll()));
  // gently snap to nearest panel after scrolling settles
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    const unit = getScrollUnit();
    target = Math.round(target / unit) * unit;
    saveScroll();
  }, 200);
}, { passive: false });

// ── input: keyboard ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.body.dataset.lightboxOpen) return;
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.preventDefault();
  const unit = getScrollUnit();
  const idx  = Math.round(target / unit);
  target = e.key === 'ArrowRight'
    ? Math.min((idx + 1) * unit, getMaxScroll())
    : Math.max((idx - 1) * unit, 0);
  saveScroll();
});

// ── input: touch ─────────────────────────────────────────────
(function () {
  let lx = 0, ly = 0, touching = false;
  document.addEventListener('touchstart', e => {
    if (document.body.dataset.lightboxOpen) return;
    touching = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  });
  document.addEventListener('touchmove', e => {
    if (!touching || document.body.dataset.lightboxOpen) return;
    e.preventDefault();
    const dx = lx - e.touches[0].clientX;
    const dy = ly - e.touches[0].clientY;
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    target = Math.max(0, Math.min(target + delta * 2.5, getMaxScroll()));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  }, { passive: false });
  document.addEventListener('touchend', () => {
    touching = false;
    const unit = getScrollUnit();
    target = Math.round(target / unit) * unit;
    saveScroll();
  });
})();


// ============================================================
// FRAME-EDGE OVERLAY
// Thin vertical lines at each collapsed-sliver boundary,
// plus a moving edge for the panel currently collapsing.
// ============================================================
const frameEdgesEl = document.createElement('div');
frameEdgesEl.className = 'frame-edges';
document.body.appendChild(frameEdgesEl);

const edgeLines = [];
function ensureEdgeLines(n) {
  while (edgeLines.length < n) {
    const ln = document.createElement('div');
    ln.className = 'frame-edge';
    frameEdgesEl.appendChild(ln);
    edgeLines.push(ln);
  }
  edgeLines.forEach((ln, i) => { ln.style.display = i < n ? '' : 'none'; });
}

function updateFrameEdges() {
  ensureEdgeLines(0); // hide all edge lines
}


// ============================================================
// LAYOUT — position & clip every panel each frame
// ============================================================
function layoutPanels(pos) {
  const vw   = window.innerWidth;
  const unit = getScrollUnit();
  const cf   = Math.max(0, pos / unit);
  const ai   = Math.min(Math.floor(cf), numPanels - 1);
  const pr   = cf - ai;

  panels.forEach((p, i) => {
    if (i < ai) {
      // ── past — hidden ──
      p.style.clipPath = 'inset(0px 0px 0px 100%)';
      p.style.zIndex   = 0;
      p.dataset.state   = 'collapsed';
    } else if (i === ai) {
      // ── active / transitioning — clips from right ──
      const cR = vw * pr;
      p.style.clipPath = cR > 0.5 ? `inset(0px ${cR}px 0px 0px)` : 'none';
      p.style.zIndex   = 50;
      p.dataset.state   = 'active';
    } else if (i === ai + 1) {
      // ── next (revealed behind active) ──
      p.style.clipPath = 'none';
      p.style.zIndex   = 40;
      p.dataset.state   = 'next';
    } else {
      // ── future (hidden) ──
      p.style.clipPath = 'inset(0px 100% 0px 0px)';
      p.style.zIndex   = 0;
      p.dataset.state   = 'future';
    }
  });

  updateFrameEdges(ai, pr);
  return { activeIndex: ai, progress: pr };
}


// ============================================================
// NAV — highlight active section, hide on hero
// ============================================================
const tnavBtns    = document.querySelectorAll('.tnav-btn');
const topnav      = document.querySelector('.topnav');
const progressBar = document.getElementById('progress-bar');
const slideNumber = document.getElementById('slide-number');

function updateNav(pos) {
  const unit = getScrollUnit();
  const max  = getMaxScroll();
  const pct  = max > 0 ? (pos / max) * 100 : 0;
  if (progressBar) {
    progressBar.style.width = pct + '%';
    progressBar.classList.toggle('hidden', pos < unit * 0.5);
  }
  if (topnav) topnav.classList.toggle('hidden', pos < unit * 0.5);

  const idx     = Math.min(Math.round(pos / unit), numPanels - 1);
  const section = panels[idx]?.dataset.section || '';
  tnavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));

  if (slideNumber) {
    slideNumber.textContent = pos < unit * 0.5 ? '' : `${idx + 1} / ${numPanels}`;
  }
}


// ── navigation helpers (called from HTML onclick) ────────────
function scrollToPanel(index) {
  target = Math.max(0, Math.min(index * getScrollUnit(), getMaxScroll()));
}

function scrollToSection(sectionId) {
  // Try element with that ID first
  const el = document.getElementById(sectionId);
  if (el) {
    for (let i = 0; i < numPanels; i++) {
      if (panels[i] === el || panels[i].contains(el)) {
        target = i * getScrollUnit(); return;
      }
    }
  }
  // Fallback map for sections without IDs
  const map = { characters: 5 };
  if (map[sectionId] !== undefined) target = map[sectionId] * getScrollUnit();
}
window.scrollToPanel   = scrollToPanel;
window.scrollToSection = scrollToSection;


// ============================================================
// LERP + MAIN LOOP
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }

function tick() {
  current = lerp(current, target, 0.06);
  if (Math.abs(current - target) < 0.5) current = target;

  layoutPanels(current);
  updateNav(current);
  requestAnimationFrame(tick);
}


// ============================================================
// HERO TITLE — mouse-driven letter-spacing
// ============================================================
const heroTitle = document.querySelector('.hero-title');

function calcExpansionLetterSpacing() {
  if (!heroTitle) return;
  const cs  = getComputedStyle(heroTitle);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font  = `300 ${cs.fontSize} 'Times New Roman', Georgia, serif`;
  const nat = ctx.measureText('EXPANSION').width;
  const ls  = (window.innerWidth - nat) / 9;
  document.documentElement.style.setProperty('--ls-open', Math.max(0, ls) + 'px');
}

function initTitleHover() {
  if (!heroTitle) return;
  calcExpansionLetterSpacing();
  const fontSize = parseFloat(getComputedStyle(heroTitle).fontSize);
  const lsClose  = -0.02 * fontSize;
  let targetLs = lsClose, currentLs = lsClose;
  heroTitle.style.letterSpacing = lsClose + 'px';

  (function lerpLoop() {
    currentLs += (targetLs - currentLs) * 0.015;
    heroTitle.style.letterSpacing = currentLs + 'px';
    requestAnimationFrame(lerpLoop);
  })();

  document.addEventListener('mousemove', e => {
    const lsOpen = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--ls-open')
    ) || 0;
    const tx = e.clientX / window.innerWidth;
    const ty = e.clientY / window.innerHeight;
    const t  = Math.min((tx + ty) / 1.3, 1);
    targetLs = lsClose + (lsOpen - lsClose) * t * t;
  });
  document.addEventListener('mouseleave', () => { targetLs = lsClose; });
}


// ============================================================
// INTRO — show image
// ============================================================
function initIntroSups() {
  const imgWrap = document.getElementById('intro-img-wrap');
  if (imgWrap) imgWrap.classList.add('visible');
}


// ============================================================
// DRAGGABLE — click & drag floating elements
// ============================================================
function makeDraggable(el, centered) {
  let active = false, ox = 0, oy = 0, dx = 0, dy = 0;
  el.addEventListener('mousedown', e => {
    active = true; ox = e.clientX - dx; oy = e.clientY - dy;
    el.style.transition = 'none'; el.style.zIndex = '50'; el.style.opacity = '0.85';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!active) return;
    dx = e.clientX - ox; dy = e.clientY - oy;
    const base = centered ? 'translate(-50%, -50%)' : '';
    el.style.transform = `${base} translate(${dx}px, ${dy}px)`;
  });
  document.addEventListener('mouseup', () => {
    if (!active) return;
    active = false; el.style.transition = ''; el.style.zIndex = ''; el.style.opacity = '';
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
// CUSTOM CURSOR — crosshair with lerp lag
// ============================================================
function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY; cursor.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  const hoverTargets = 'a, button, [onclick], .dir-vid, .intro-img-wrap, .hero-title, .tnav-btn, .topnav-title, .vt-thumb';
  document.addEventListener('mouseover',  e => { if (e.target.closest(hoverTargets)) cursor.classList.add('hover'); });
  document.addEventListener('mouseout',   e => { if (e.target.closest(hoverTargets)) cursor.classList.remove('hover'); });

  (function loop() {
    cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
    cursor.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
    requestAnimationFrame(loop);
  })();
}


// ============================================================
// LIGHTBOX — for VT archive thumbnails + Vimeo
// ============================================================
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const content  = document.getElementById('lightbox-content');
  const caption  = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn  = document.getElementById('lightbox-prev');
  const nextBtn  = document.getElementById('lightbox-next');
  const thumbs   = Array.from(document.querySelectorAll('.vt-thumb'));
  let currentIndex = 0;

  thumbs.forEach(t => { if (t.querySelector('video')) t.classList.add('vt-thumb--has-video'); });

  function getMediaSrc(thumb) {
    const yt = thumb.dataset.youtube;
    if (yt) { const id = yt.match(/[?&]v=([^&]+)/); if (id) return { type: 'youtube', src: id[1] }; }
    const video = thumb.querySelector('video source');
    if (video) { const hq = thumb.dataset.hqSrc; return { type: 'video', src: hq || video.getAttribute('src') || video.dataset.src }; }
    const img = thumb.querySelector('img');
    if (img) return { type: 'image', src: img.getAttribute('src') };
    return null;
  }

  function getCaption(thumb) {
    const c = thumb.querySelector('.vt-caption');
    return c ? c.textContent : '';
  }

  function show(index) {
    currentIndex = index;
    const thumb = thumbs[index];
    const media = getMediaSrc(thumb);
    if (!media) return;
    content.innerHTML = '';
    if (media.type === 'youtube') {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube.com/embed/${media.src}?autoplay=1&rel=0`;
      Object.assign(f.style, { maxWidth: '85vw', maxHeight: '80vh', border: 'none' });
      f.width = 1280; f.height = 720; f.allow = 'autoplay; encrypted-media'; f.allowFullscreen = true;
      content.appendChild(f);
    } else if (media.type === 'video') {
      const v = document.createElement('video');
      v.src = media.src; v.controls = true; v.autoplay = true; v.playsInline = true;
      content.appendChild(v);
    } else {
      const im = document.createElement('img');
      im.src = media.src;
      content.appendChild(im);
    }
    caption.textContent = getCaption(thumb);
  }

  function open(i) { show(i); lightbox.classList.add('is-open'); document.body.dataset.lightboxOpen = 'true'; }
  function close() {
    lightbox.classList.remove('is-open');
    delete document.body.dataset.lightboxOpen;
    const v = content.querySelector('video');
    if (v) { v.pause(); v.src = ''; }
    content.innerHTML = '';
    prevBtn.style.display = ''; nextBtn.style.display = '';
  }
  function prev() { show((currentIndex - 1 + thumbs.length) % thumbs.length); }
  function next() { show((currentIndex + 1) % thumbs.length); }

  thumbs.forEach((t, i) => t.addEventListener('click', e => { e.stopPropagation(); open(i); }));
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Work sample cards
  document.querySelectorAll('.profile-card[data-vimeo]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      content.innerHTML = '';
      const f = document.createElement('iframe');
      f.src = card.dataset.vimeo; f.width = 1280; f.height = 720;
      Object.assign(f.style, { maxWidth: '85vw', maxHeight: '80vh', border: 'none' });
      f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
      content.appendChild(f);
      caption.textContent = '';
      lightbox.classList.add('is-open'); document.body.dataset.lightboxOpen = 'true';
      prevBtn.style.display = 'none'; nextBtn.style.display = 'none';
    });
  });
}


// ============================================================
// LAZY VIDEO — load & play when panel is near active
// ============================================================
function initLazyVideos() {
  const videoMap = [];
  panels.forEach((panel, idx) => {
    panel.querySelectorAll('video[preload="none"]').forEach(video => {
      videoMap.push({ video, panelIndex: idx });
    });
  });
  const loaded = new Set();

  function check() {
    const unit = getScrollUnit();
    const ai   = Math.min(Math.floor(Math.max(0, current / unit)), numPanels - 1);

    videoMap.forEach(({ video, panelIndex }) => {
      const near = Math.abs(panelIndex - ai) <= 2;
      if (near && !loaded.has(video)) {
        const src = video.querySelector('source[data-src]');
        if (src) {
          const hqSrc = video.closest('[data-hq-src]')?.dataset.hqSrc;
          src.src = hqSrc || src.dataset.src; src.removeAttribute('data-src');
          video.load(); video.play().catch(() => {}); loaded.add(video);
        }
      } else if (!near && loaded.has(video)) {
        video.pause();
      } else if (near && loaded.has(video) && video.paused && !document.body.dataset.lightboxOpen) {
        video.play().catch(() => {});
      }
    });
  }

  (function loop() { check(); requestAnimationFrame(loop); })();
}


// ============================================================
// AUDIO PLAYERS WITH WAVEFORM
// ============================================================
function initAudioPlayers() {
  document.querySelectorAll('.audio-player').forEach(player => {
    const src = player.dataset.src;
    const playBtn    = player.querySelector('.ap-play');
    const waveformEl = player.querySelector('.ap-waveform');
    const canvas     = waveformEl.querySelector('canvas');
    const progressEl = waveformEl.querySelector('.ap-waveform-progress');
    const timeEl     = player.querySelector('.ap-time');
    const audio      = new Audio();
    audio.preload = 'none'; audio.src = src;
    let loaded = false, waveformDrawn = false;

    const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

    function drawWaveform(buffer) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
      const data = buffer.getChannelData(0);
      const bars = Math.floor(w / 3), step = Math.floor(data.length / bars);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += Math.abs(data[i * step + j]);
        const avg = sum / step, barH = Math.max(1, avg * h * 2.5);
        ctx.fillRect(i * 3, (h - barH) / 2, 1.5, barH);
      }
      waveformDrawn = true;
    }

    function loadAndDraw() {
      if (waveformDrawn) return;
      fetch(src).then(r => r.arrayBuffer())
        .then(buf => new (window.AudioContext || window.webkitAudioContext)().decodeAudioData(buf))
        .then(drawWaveform).catch(() => {});
    }

    // Placeholder
    (function () {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      const bars = Math.floor(w / 3);
      for (let i = 0; i < bars; i++) {
        const barH = Math.random() * h * 0.6 + 2;
        ctx.fillRect(i * 3, (h - barH) / 2, 1.5, barH);
      }
    })();

    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { loadAndDraw(); }
    }, { rootMargin: '200px' }).observe(player);

    playBtn.addEventListener('click', () => {
      if (!loaded) { audio.load(); loaded = true; }
      if (audio.paused) {
        document.querySelectorAll('.audio-player').forEach(p => {
          if (p !== player && p._audio && !p._audio.paused) {
            p._audio.pause(); p.querySelector('.ap-play').innerHTML = '&#9654;';
          }
        });
        audio.play(); playBtn.innerHTML = '&#10074;&#10074;';
      } else {
        audio.pause(); playBtn.innerHTML = '&#9654;';
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        progressEl.style.width = (audio.currentTime / audio.duration * 100) + '%';
        timeEl.textContent = fmt(audio.currentTime);
      }
    });
    audio.addEventListener('ended', () => {
      playBtn.innerHTML = '&#9654;'; progressEl.style.width = '0%'; timeEl.textContent = '0:00';
    });

    waveformEl.addEventListener('click', e => {
      if (!loaded) { audio.load(); loaded = true; }
      const pct = (e.clientX - waveformEl.getBoundingClientRect().left) / waveformEl.clientWidth;
      if (audio.duration) {
        audio.currentTime = pct * audio.duration;
        if (audio.paused) { audio.play(); playBtn.innerHTML = '&#10074;&#10074;'; }
      }
    });

    player._audio = audio;
  });
}


// ============================================================
// CONTENT INSET — offset left-aligned content to clear slivers
// ============================================================
function updateContentInsets() {
  panels.forEach(p => {
    p.style.setProperty('--content-inset', '0px');
  });
}


// ============================================================
// LOADING SCREEN WITH PROGRESS
// ============================================================
function initLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const percentEl = document.getElementById('loading-percent');
  if (!loadingScreen) return;

  // Get all videos that need to load
  const allVideos = Array.from(document.querySelectorAll('video'));
  let videosFullyLoaded = new Set();
  let currentPercent = 0;

  // Force lazy-loaded videos to start loading
  allVideos.forEach(video => {
    // Check for data-src on source elements
    const sourceWithDataSrc = video.querySelector('source[data-src]');
    if (sourceWithDataSrc) {
      const dataSrc = sourceWithDataSrc.getAttribute('data-src');
      sourceWithDataSrc.src = dataSrc;
      sourceWithDataSrc.removeAttribute('data-src');
    }

    // Change preload attribute to force loading
    if (video.preload === 'none') {
      video.preload = 'auto';
    }

    // Start the load
    video.load();

    // Track when all videos are canplaythrough (fully loaded)
    video.addEventListener('canplaythrough', () => {
      videosFullyLoaded.add(video);
      updatePercent();
      checkIfAllLoaded();
    });
  });

  function updatePercent() {
    const totalToTrack = Math.max(allVideos.length, 1);
    const percent = Math.min(Math.round((videosFullyLoaded.size / totalToTrack) * 100), 99);
    currentPercent = Math.max(percent, currentPercent); // Only go up
    if (percentEl) percentEl.textContent = currentPercent;
  }

  function checkIfAllLoaded() {
    if (videosFullyLoaded.size === allVideos.length && allVideos.length > 0) {
      // All videos are loaded
      clearInterval(simInterval);
      if (percentEl) percentEl.textContent = '100';
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 300);
    }
  }

  // Start at 5% immediately
  if (percentEl) {
    percentEl.textContent = '5';
    currentPercent = 5;
  }

  // Gradually increase even if videos aren't loading (for slow connections)
  let simulateProgress = 5;
  const simInterval = setInterval(() => {
    if (simulateProgress < currentPercent + 5) {
      simulateProgress = Math.min(simulateProgress + Math.random() * 3, currentPercent + 10);
      if (percentEl) percentEl.textContent = Math.round(simulateProgress);
    }
  }, 300);

  // Fallback: If no videos exist, hide immediately
  if (allVideos.length === 0) {
    if (percentEl) percentEl.textContent = '100';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 300);
  }
}


// ============================================================
// BOOT
// ============================================================
window.addEventListener('load', () => {
  // Restore last scroll position within valid range
  const saved = parseFloat(sessionStorage.getItem('expansionScroll') || '0');
  if (saved > 0) { target = current = Math.min(saved, getMaxScroll()); }

  updateContentInsets();
  initCursor();
  initDraggables();
  initLightbox();
  initLazyVideos();
  initTitleHover();
  initIntroSups();
  initAudioPlayers();
  initLoadingScreen();
  requestAnimationFrame(tick);
});

window.addEventListener('resize', () => {
  calcExpansionLetterSpacing();
  updateContentInsets();
});
