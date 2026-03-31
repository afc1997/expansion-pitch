// ============================================================
// HERO TITLE — dynamic letter-spacing to fill screen width
// ============================================================
const heroTitle = document.querySelector('.hero-title');

function calcExpansionLetterSpacing() {
  if (!heroTitle) return;
  const cs       = getComputedStyle(heroTitle);
  const fontSize = cs.fontSize;
  const canvas   = document.createElement('canvas');
  const ctx      = canvas.getContext('2d');
  ctx.font = `300 ${fontSize} Times New Roman, serif`;
  const naturalW = ctx.measureText('EXPANSION').width;
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
    const tEased = t * t;
    targetLs = lsClose + (lsOpen - lsClose) * tEased;
  });

  document.addEventListener('mouseleave', () => { targetLs = lsClose; });
}


// ============================================================
// CUSTOM CURSOR
// ============================================================
function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  const hoverTargets = 'a, button, .hero-title, .vt-thumb, .archive-item--card';
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


// ============================================================
// NAV — active link highlight
// ============================================================
function initNav() {
  const links = document.querySelectorAll('.tnav-link');
  const sections = document.querySelectorAll('.section');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 200) {
        current = sec.id;
      }
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
}


// ============================================================
// SCROLL REVEAL
// ============================================================
function initReveal() {
  const els = document.querySelectorAll('.block, .section-header');
  els.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => observer.observe(el));
}


// ============================================================
// LAZY VIDEO — load when near viewport
// ============================================================
function initLazyVideos() {
  const videos = document.querySelectorAll('video[data-lazy]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        const source = video.querySelector('source[data-src]');
        if (source) {
          source.src = source.dataset.src;
          source.removeAttribute('data-src');
          video.load();
        }
        if (!video.hasAttribute('controls')) {
          video.play().catch(() => {});
        }
      } else {
        if (!video.hasAttribute('controls') && !video.paused) {
          video.pause();
        }
      }
    });
  }, { rootMargin: '200px' });

  videos.forEach(v => observer.observe(v));
}


// ============================================================
// LIGHTBOX — for Vimeo work samples + VT thumbs
// ============================================================
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const content  = document.getElementById('lightbox-content');
  const closeBtn = document.getElementById('lightbox-close');

  function close() {
    lightbox.classList.remove('is-open');
    content.innerHTML = '';
  }

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Vimeo cards
  document.querySelectorAll('[data-vimeo]').forEach(card => {
    card.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = card.dataset.vimeo;
      iframe.width = '1280'; iframe.height = '720';
      iframe.style.maxWidth = '85vw'; iframe.style.maxHeight = '80vh';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      content.innerHTML = '';
      content.appendChild(iframe);
      lightbox.classList.add('is-open');
    });
  });

  // VT thumbs — open image/video larger
  document.querySelectorAll('.vt-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      content.innerHTML = '';
      const img = thumb.querySelector('img');
      const vid = thumb.querySelector('video source');
      if (vid) {
        const v = document.createElement('video');
        v.src = vid.src || vid.dataset.src;
        v.controls = true; v.autoplay = true; v.playsInline = true;
        content.appendChild(v);
      } else if (img) {
        const i = document.createElement('img');
        i.src = img.src;
        content.appendChild(i);
      }
      lightbox.classList.add('is-open');
    });
  });
}


// ============================================================
// INIT
// ============================================================
window.addEventListener('load', () => {
  initCursor();
  initTitleHover();
  initNav();
  initReveal();
  initLazyVideos();
  initLightbox();
});

window.addEventListener('resize', calcExpansionLetterSpacing);
