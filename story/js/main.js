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
// CUSTOM CURSOR — crosshair
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

  const hoverTargets = 'a, button, .hero-title, .cat-card, .cat-thumb, .cat-entry, .vt-block, .press-row';
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
// DETAIL OVERLAY — fullscreen viewer for clicked items
// ============================================================
const detailData = {
  'logline': {
    title: '(001) Logline',
    heading: 'A man inherits his estranged father\'s mansion — and the maze he built just for him.',
    body: '<p>Title: Expansion<br>Written & Directed: Fisherman & Trout<br>Genre: Psychological Horror</p>'
  },
  'synopsis': {
    title: '(002) Synopsis',
    heading: 'Synopsis',
    body: '<p>After his estranged father\'s suicide, Jonathan Cameron inherits a destroyed rural mansion. Jon and his wife Esme move in to restore and sell it. But their plan slowly unravels when Jon discovers a hidden hallway that shouldn\'t exist. As Jon delves deeper into the maze, he is attacked by masked intruders, haunted by visions of his past, and slowly alienated from everyone he trusts. In the film\'s climax, Jon is forced to navigate the heart of the labyrinth, where he must finally confront the pain he has spent his entire life avoiding.</p>',
    media: '<video muted loop autoplay playsinline><source src="../assets/video/compressed/westworld.mp4" type="video/mp4"></video>'
  },
  'directors-statement': {
    title: '(003) Directors Statement',
    heading: 'There are things inside us we\'d rather bury than face.',
    body: '<p>Things we hide from ourselves, from our families, from the world. Those things don\'t disappear. They rot.</p><p>We want to make a movie about living inside a person who is consuming themselves because they\'re too afraid to look at what\'s hiding within them. We want it to feel like a nightmare, one constructed the way an architect might design a torture chamber. Claustrophobic, entrapping, filled with danger hiding behind the walls. We should feel almost like Jon\'s being surveilled. As if somehow, Richard is still watching over him, still pulling the strings.</p>',
    media: '<img src="../assets/Visual Treatment/Directors Statement.png" alt="Directors Statement">'
  },
  'jonathan': {
    title: '(004) Jonathan',
    heading: 'Jonathan',
    body: '<p>Jon has spent his entire life running from his past. He\'s smart, loyal and secretly insecure. Jon deals with everything alone, inside his own head. But, when he inherits his father\'s house, Jon finds there\'s nowhere left to run.</p><p>Our ideal actor is deeply charismatic, with a lot of anger underneath. Someone who projects intelligence and restraint while letting resentment leak through in small, dangerous ways. A performance that feels contained, until it isn\'t.</p>',
    media: '<img src="../assets/images/JON 1.png" alt="Jonathan">'
  },
  'esme': {
    title: '(005) Esme',
    heading: 'Esme',
    body: '<p>Esme has accepted what her life is going to look like. She will keep renting, she won\'t have the cash to start a family, she\'s going to spend the rest of her life with Jon. Esme is connected to her emotions, grounded while Jon goes flying into his mind. She believes everything can be fixed. But as she watches Jon deteriorate, her ability to withstand runs out.</p><p>Our ideal actress is someone who can portray warmth and maternal care, but also feels like she\'s carrying a secret. Is that care genuine, or just a ploy to ruin Jon?</p>',
    media: '<img src="../assets/images/Esme.png" alt="Esme">'
  },
  'parker': {
    title: '(006) Parker',
    heading: 'Parker',
    body: '<p>Parker is everything Jon wishes he could be. He fills a room effortlessly. He\'s charismatic, confident and physically imposing. He has a golden retriever energy that appears simply friendly, but underneath the facade, that energy might be something more calculated.</p><p>Our ideal actor for Parker should be an endearing jock who toes the line between charming and threatening. As an audience, we should always be questioning his motive.</p>',
    media: '<img src="../assets/images/New Parker.png" alt="Parker">'
  },
  'richard': {
    title: '(007) Richard',
    heading: 'Richard',
    body: '<p>Richard Cameron hangs himself in the first scene of the movie, but his presence lingers long after. Throughout the film we see him in glimpses. He\'s brilliant, cruel, and the scariest thing in the world to Jon. To everyone else, he was a genius. To Jon, he was a monster.</p><p>Our ideal actor is someone who can portray a larger than life figure, one filled with evil, magnetism and strength. Someone whose presence seeps into every frame, even when he\'s not in it.</p>',
    media: '<img src="../assets/images/Brian-Cox.webp" alt="Richard">'
  },
  'the-house': {
    title: '(008) The House',
    heading: 'The House',
    body: '<p>The house is an extension of Richard\'s mind. Monumental, isolated, fully wrecked. We\'re drawn to constructivism and parasitic architecture. Something that feels epic but also deeply wrong. Throughout the seasons, the house will change. From destroyed, to in repair, to almost ready, and back to destroyed. The house is expressive of Jon\'s mental state.</p>',
    media: '<img src="../assets/images/House.png" alt="The House">'
  },
  'the-maze': {
    title: '(009) The Maze',
    heading: 'The Maze',
    body: '<p>Unlike the house, the maze is always in pristine condition. Its walls are plaster white, incredibly tall, endlessly long. The lighting is dim, showing just enough to make us feel there\'s something hiding. The hallways vary in size, narrowing and widening without logic. What\'s scariest is that we never know what\'s waiting behind a turn.</p>',
    media: '<img src="../assets/images/Maze.png" alt="The Maze">'
  }
};

const detailKeys = Object.keys(detailData);
let currentDetail = 0;

function initDetail() {
  const overlay = document.getElementById('detail-overlay');
  const content = document.getElementById('detail-content');
  const counter = document.getElementById('detail-counter');
  const closeBtn = document.getElementById('detail-close');
  const prevBtn = document.getElementById('detail-prev');
  const nextBtn = document.getElementById('detail-next');

  function show(key) {
    const data = detailData[key];
    if (!data) return;
    currentDetail = detailKeys.indexOf(key);
    counter.textContent = String(currentDetail + 1).padStart(2, '0') + ' / ' + String(detailKeys.length).padStart(2, '0');

    let html = `<div class="detail-title">${data.title}</div>`;
    html += `<div class="detail-heading">${data.heading}</div>`;
    html += `<div class="detail-body">${data.body}</div>`;
    if (data.media) html += `<div class="detail-media">${data.media}</div>`;

    content.innerHTML = html;
    overlay.classList.add('is-open');
  }

  function close() {
    overlay.classList.remove('is-open');
    content.innerHTML = '';
  }

  // Click handlers on catalog items
  document.querySelectorAll('[data-detail]').forEach(el => {
    el.addEventListener('click', () => {
      show(el.dataset.detail);
    });
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  prevBtn.addEventListener('click', () => {
    currentDetail = (currentDetail - 1 + detailKeys.length) % detailKeys.length;
    show(detailKeys[currentDetail]);
  });
  nextBtn.addEventListener('click', () => {
    currentDetail = (currentDetail + 1) % detailKeys.length;
    show(detailKeys[currentDetail]);
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') { currentDetail = (currentDetail + 1) % detailKeys.length; show(detailKeys[currentDetail]); }
    if (e.key === 'ArrowLeft') { currentDetail = (currentDetail - 1 + detailKeys.length) % detailKeys.length; show(detailKeys[currentDetail]); }
  });
}


// ============================================================
// LIGHTBOX — videos play with audio, images get prev/next,
//            Vimeo embeds for work samples
// ============================================================
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const content  = document.getElementById('lightbox-content');
  const closeBtn = document.getElementById('lightbox-close');

  let mediaItems = [];
  let mediaIndex = 0;

  function close() {
    lightbox.classList.remove('is-open');
    content.innerHTML = '';
    mediaItems = [];
  }

  function showMedia(idx) {
    mediaIndex = idx;
    content.innerHTML = '';

    const item = mediaItems[mediaIndex];
    if (!item) return;

    // Nav arrows if multiple items
    if (mediaItems.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'lb-arrow lb-arrow--prev';
      prevBtn.innerHTML = '&larr;';
      prevBtn.addEventListener('click', e => { e.stopPropagation(); showMedia((mediaIndex - 1 + mediaItems.length) % mediaItems.length); });
      content.appendChild(prevBtn);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'lb-arrow lb-arrow--next';
      nextBtn.innerHTML = '&rarr;';
      nextBtn.addEventListener('click', e => { e.stopPropagation(); showMedia((mediaIndex + 1) % mediaItems.length); });
      content.appendChild(nextBtn);
    }

    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.className = 'lb-video';
      content.appendChild(v);
    } else if (item.type === 'img') {
      const img = document.createElement('img');
      img.src = item.src;
      img.className = 'lb-img';
      content.appendChild(img);
    } else if (item.type === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.src = item.src;
      iframe.width = '1280'; iframe.height = '720';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.className = 'lb-iframe';
      content.appendChild(iframe);
    }
  }

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && mediaItems.length > 1) showMedia((mediaIndex + 1) % mediaItems.length);
    if (e.key === 'ArrowLeft' && mediaItems.length > 1) showMedia((mediaIndex - 1 + mediaItems.length) % mediaItems.length);
  });

  // Vimeo work samples
  document.querySelectorAll('[data-vimeo]').forEach(card => {
    card.addEventListener('click', () => {
      mediaItems = [{ type: 'iframe', src: card.dataset.vimeo }];
      showMedia(0);
      lightbox.classList.add('is-open');
    });
  });

  // Clicking videos in thumbs — open with audio controls
  document.querySelectorAll('.cat-thumb video, .synopsis-media video').forEach(vid => {
    vid.addEventListener('click', () => {
      const src = vid.querySelector('source');
      const videoSrc = src ? (src.src || src.dataset.src) : vid.src;
      if (!videoSrc) return;

      // Gather sibling media in same parent group
      const parent = vid.closest('.vt-thumbs, .vt-block, .synopsis-media');
      if (parent) {
        mediaItems = [];
        parent.querySelectorAll('.cat-thumb img, .cat-thumb video, .synopsis-media video').forEach(el => {
          if (el.tagName === 'VIDEO') {
            const s = el.querySelector('source');
            const url = s ? (s.src || s.dataset.src) : el.src;
            if (url) mediaItems.push({ type: 'video', src: url });
          } else if (el.tagName === 'IMG') {
            mediaItems.push({ type: 'img', src: el.src });
          }
        });
        const clickedSrc = videoSrc;
        const idx = mediaItems.findIndex(m => m.src === clickedSrc);
        showMedia(idx >= 0 ? idx : 0);
      } else {
        mediaItems = [{ type: 'video', src: videoSrc }];
        showMedia(0);
      }
      lightbox.classList.add('is-open');
    });
  });

  // Clicking images in thumbs — open with prev/next
  document.querySelectorAll('.cat-thumb img').forEach(img => {
    img.addEventListener('click', () => {
      const parent = img.closest('.vt-thumbs, .vt-block');
      if (parent) {
        mediaItems = [];
        parent.querySelectorAll('.cat-thumb img, .cat-thumb video').forEach(el => {
          if (el.tagName === 'VIDEO') {
            const s = el.querySelector('source');
            const url = s ? (s.src || s.dataset.src) : el.src;
            if (url) mediaItems.push({ type: 'video', src: url });
          } else if (el.tagName === 'IMG') {
            mediaItems.push({ type: 'img', src: el.src });
          }
        });
        const idx = mediaItems.findIndex(m => m.src === img.src);
        showMedia(idx >= 0 ? idx : 0);
      } else {
        mediaItems = [{ type: 'img', src: img.src }];
        showMedia(0);
      }
      lightbox.classList.add('is-open');
    });
  });
}


// ============================================================
// LAZY VIDEO
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
// SCROLL REVEAL
// ============================================================
function initReveal() {
  const els = document.querySelectorAll('.cat-section, .cat-header, .cat-entry, .cat-card, .vt-block, .cat-entry--bio');
  els.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.05 });
  els.forEach(el => observer.observe(el));
}


// ============================================================
// NAV — active link highlight
// ============================================================
function initNav() {
  const links = document.querySelectorAll('.tnav-link');
  const sections = document.querySelectorAll('.cat-section');

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
// CAROUSELS — prev/next on setting images
// ============================================================
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-btn--prev');
    const nextBtn = carousel.querySelector('.carousel-btn--next');
    let current = 0;

    function show(idx) {
      slides[current].classList.remove('is-active');
      // pause video in old slide
      const oldVid = slides[current].querySelector('video');
      if (oldVid && !oldVid.paused) oldVid.pause();

      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('is-active');

      // play video in new slide
      const newVid = slides[current].querySelector('video');
      if (newVid) {
        const src = newVid.querySelector('source[data-src]');
        if (src) {
          src.src = src.dataset.src;
          src.removeAttribute('data-src');
          newVid.load();
        }
        newVid.play().catch(() => {});
      }
    }

    prevBtn.addEventListener('click', e => { e.stopPropagation(); show(current - 1); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); show(current + 1); });
  });
}


// ============================================================
// CUSTOM AUDIO PLAYERS WITH WAVEFORM
// ============================================================
function initAudioPlayers() {
  document.querySelectorAll('.audio-player').forEach(player => {
    const src = player.dataset.src;
    const playBtn = player.querySelector('.ap-play');
    const waveformEl = player.querySelector('.ap-waveform');
    const canvas = waveformEl.querySelector('canvas');
    const progressEl = waveformEl.querySelector('.ap-waveform-progress');
    const timeEl = player.querySelector('.ap-time');
    const audio = new Audio();
    audio.preload = 'none';
    audio.src = src;

    let loaded = false;
    let waveformDrawn = false;

    function fmt(s) {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + String(sec).padStart(2, '0');
    }

    function drawWaveform(buffer) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const data = buffer.getChannelData(0);
      const bars = Math.floor(w / 3);
      const step = Math.floor(data.length / bars);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += Math.abs(data[i * step + j]);
        }
        const avg = sum / step;
        const barH = Math.max(1, avg * h * 2.5);
        const x = i * 3;
        ctx.fillRect(x, (h - barH) / 2, 1.5, barH);
      }
      waveformDrawn = true;
    }

    // Decode audio for waveform on first interaction or load
    function loadAndDraw() {
      if (waveformDrawn) return;
      fetch(src)
        .then(r => r.arrayBuffer())
        .then(buf => {
          const actx = new (window.AudioContext || window.webkitAudioContext)();
          return actx.decodeAudioData(buf);
        })
        .then(drawWaveform)
        .catch(() => {});
    }

    // Draw placeholder bars
    function drawPlaceholder() {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      const bars = Math.floor(w / 3);
      for (let i = 0; i < bars; i++) {
        const barH = Math.random() * h * 0.6 + 2;
        ctx.fillRect(i * 3, (h - barH) / 2, 1.5, barH);
      }
    }

    drawPlaceholder();

    // Load waveform when visible
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadAndDraw();
        obs.disconnect();
      }
    }, { rootMargin: '200px' });
    obs.observe(player);

    playBtn.addEventListener('click', () => {
      if (!loaded) { audio.load(); loaded = true; }
      if (audio.paused) {
        document.querySelectorAll('.audio-player').forEach(p => {
          if (p !== player && p._audio && !p._audio.paused) {
            p._audio.pause();
            p.querySelector('.ap-play').innerHTML = '&#9654;';
          }
        });
        audio.play();
        playBtn.innerHTML = '&#10074;&#10074;';
      } else {
        audio.pause();
        playBtn.innerHTML = '&#9654;';
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        progressEl.style.width = (audio.currentTime / audio.duration * 100) + '%';
        timeEl.textContent = fmt(audio.currentTime);
      }
    });

    audio.addEventListener('ended', () => {
      playBtn.innerHTML = '&#9654;';
      progressEl.style.width = '0%';
      timeEl.textContent = '0:00';
    });

    waveformEl.addEventListener('click', e => {
      if (!loaded) { audio.load(); loaded = true; }
      const rect = waveformEl.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (audio.duration) {
        audio.currentTime = pct * audio.duration;
        if (audio.paused) {
          audio.play();
          playBtn.innerHTML = '&#10074;&#10074;';
        }
      }
    });

    player._audio = audio;
  });
}


// ============================================================
// INIT
// ============================================================
window.addEventListener('load', () => {
  initCursor();
  initTitleHover();
  initDetail();
  initLightbox();
  initLazyVideos();
  initCarousels();
  initAudioPlayers();
  initReveal();
  initNav();
});

window.addEventListener('resize', calcExpansionLetterSpacing);
