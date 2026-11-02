/* Shared script for every page. Each feature runs only when its markup is present. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate = hasGsap && !reduced;

  /* ================= Features that work without GSAP ================= */

  /* Countdowns (any number per page) */
  $$('.countdown').forEach(cd => {
    const target = new Date(cd.dataset.target).getTime();
    const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      for (const [u, ms] of Object.entries(units)) {
        const v = Math.floor(diff / ms);
        diff -= v * ms;
        const el = $(`[data-u="${u}"]`, cd);
        if (el) el.textContent = String(v).padStart(2, '0');
      }
    };
    tick();
    setInterval(tick, 1000);
  });

  /* Demo forms: on the live build these post to the matching Kajabi form */
  $$('form[data-demo-form]').forEach(form => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('button[type="submit"] span, button:not([type]) span', form);
    if (btn) btn.textContent = form.dataset.success || 'Done ✓';
    const msg = form.parentElement.querySelector('.form-msg');
    if (msg) msg.textContent = form.dataset.message || 'Thank you, check your inbox.';
  }));

  /* Mobile menu */
  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', open);
      menu.style.transition = 'opacity .4s ease';
      menu.style.opacity = open ? 1 : 0;
      menu.style.pointerEvents = open ? 'auto' : 'none';
      document.body.style.overflow = open ? 'hidden' : '';
      if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
      const [a, b] = menuBtn.children;
      a.style.transform = open ? 'translateY(3.5px) rotate(45deg)' : '';
      b.style.transform = open ? 'translateY(-3.5px) rotate(-45deg)' : '';
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* Story tabs (ARIA tabs pattern) */
  const tabs = $$('.story-tab');
  const selectTab = (tab) => tabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    if (on && animate) gsap.fromTo(panel.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .1, duration: .7, ease: 'power3.out' });
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); selectTab(next);
    });
  });

  /* YouTube: featured lite player + rail of recent uploads */
  const player = $('.yt-player'), rail = $('#ytRail');
  if (player && rail) {
    const videos = [
      ['GnRn7g2mplg', 'How to Get Clients on LinkedIn | Your 30-Day Plan to Land Your First Client', 'Oct 31, 2026'],
      ['9gZM0ndJp_Y', 'From Unknown to VISIBLE on LinkedIn | LIVE', 'Oct 27, 2026', true],
      ['Smp12-j6dCY', '46,000 People Want Claude to Run Their LinkedIn | Here’s What They’re Missing', 'Oct 17, 2026'],
      ['dWOxNYmsIsA', 'Your Next 90 Days: Profit Producing Activities', 'Oct 30, 2026'],
      ['rruJCxeClDs', 'The MISTAKE every coach makes before their first launch (it cost me 10 months…)', 'Sep 17, 2026'],
      ['a-7TIvaFXLY', 'I Enrolled 16 Clients Into a Program I Hadn’t Built Yet (Here’s Exactly How)', 'Sep 10, 2026'],
      ['ebLSBZvbPDM', 'How To Sell On LinkedIn Without Cold Pitches or Being Salesy (5 simple ways)', 'Aug 20, 2026'],
      ['cA4HAU6UuSw', 'LinkedIn: From 50 to 4,000 Connections. Here’s the Content That Did It', 'Aug 30, 2026'],
      ['JX2-f32woYg', 'Don’t Build Your Program YET! All Your Scalable Offer Questions Answered', 'Sep 29, 2026'],
      ['AOXI8xuJMt4', 'From 1:1 to Group Program: What It Actually Takes', 'Sep 15, 2026', true],
    ];
    const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    rail.innerHTML = videos.map(([id, title, date, live]) => `
      <button class="yt-card" data-id="${id}" data-title="${esc(title)}">
        <span class="thumb block">
          ${live ? '<span class="live">LIVE</span>' : ''}
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
          <span class="mini-play"><svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z"/></svg></span>
        </span>
        <h3>${esc(title)}</h3>
        <p>${date}</p>
      </button>`).join('');

    // Only load YouTube's iframe once someone presses play.
    const playVideo = (id) => {
      player.querySelectorAll('iframe').forEach(f => f.remove());
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = 'YouTube video player';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      f.className = 'absolute inset-0 w-full h-full z-10';
      player.appendChild(f);
    };
    $('.yt-play', player).addEventListener('click', () => playVideo(player.dataset.id));
    rail.addEventListener('click', (e) => {
      const card = e.target.closest('.yt-card');
      if (!card) return;
      player.dataset.id = card.dataset.id;
      $('.yt-thumb', player).src = `https://i.ytimg.com/vi/${card.dataset.id}/hqdefault.jpg`;
      $('.yt-title').textContent = card.dataset.title;
      $$('.yt-card', rail).forEach(c => c.classList.toggle('is-playing', c === card));
      playVideo(card.dataset.id);
      const top = player.getBoundingClientRect().top + scrollY - 110;
      window.lenis ? window.lenis.scrollTo(top) : scrollTo({ top, behavior: 'smooth' });
    });
    $$('.rail-nav').forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: Number(b.dataset.dir) * 340, behavior: 'smooth' })));
  }

  /* Blog category filter */
  const chips = $$('.filter-chip');
  if (chips.length) {
    const posts = $$('[data-cats]');
    chips.forEach(chip => chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      chips.forEach(c => c.setAttribute('aria-pressed', c === chip));
      posts.forEach(p => {
        const show = cat === 'all' || p.dataset.cats.split(',').includes(cat);
        p.hidden = !show;
        if (show && animate) gsap.fromTo(p, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
      });
      const empty = $('.filter-empty');
      if (empty) empty.hidden = posts.some(p => !p.hidden);
    }));
  }

  /* Blueprint interactive preview: tick sections, watch progress grow */
  const demo = $('.bp-demo');
  if (demo) {
    const boxes = $$('input[type="checkbox"]', demo);
    const update = () => {
      const done = boxes.filter(b => b.checked).length;
      $('.bp-count', demo).textContent = `${done} of ${boxes.length}`;
      $('.bp-bar', demo).style.transform = `scaleX(${done / boxes.length})`;
      $('.bp-done', demo).hidden = done !== boxes.length;
    };
    boxes.forEach(b => b.addEventListener('change', update));
    update();
  }

  /* Count-up numbers */
  const countUp = (el) => {
    const to = Number(el.dataset.to);
    const fmt = (v) => Math.round(v).toLocaleString('en-US');
    if (!animate) { el.textContent = fmt(to); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } });
  };

  if (!animate) {
    $('#loader')?.remove();
    $$('.count').forEach(countUp);
    $$('.underline-sand').forEach(el => el.style.setProperty('--u', 1));
    $$('.spark').forEach(el => { el.style.strokeDashoffset = 0; });
    return;
  }

  /* ================= Motion (GSAP) ================= */
  gsap.registerPlugin(ScrollTrigger);
  const has = (s) => !!document.querySelector(s);
  const onScroll = (sel, vars, start = 'top 85%') => {
    if (!has(sel)) return;
    gsap.from(sel, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, ...vars, scrollTrigger: { trigger: vars.trigger || sel, start } });
  };

  /* Smooth scroll */
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    window.lenis ? window.lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* Nav hide/show, progress bar, sticky mobile CTA */
  const nav = $('#nav'), stickyCta = $('.sticky-cta');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav?.classList.toggle('scrolled', y > 40);
      nav?.classList.toggle('hidden-up', y > 500 && y > lastY);
      stickyCta?.classList.toggle('is-visible', y > 700);
      lastY = y;
      gsap.set('.progress', { scaleX: self.progress });
    }
  });

  /* Intro: loader on the homepage, a quick hero reveal everywhere else */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set('.hero-title .line > span', { yPercent: 110 });
  gsap.set('[data-hero]', { y: 30, opacity: 0 });
  if (has('#loader')) {
    intro
      .to('.loader-bar', { width: '100%', duration: 1.1, ease: 'power2.inOut' })
      .to('.loader-mark span', { yPercent: -110, stagger: .08, duration: .6, ease: 'power3.in' }, '-=.1')
      .to('#loader', { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete: () => $('#loader').remove() }, '-=.2');
  }
  intro
    .to('.hero-title .line > span', { yPercent: 0, duration: 1.4, stagger: .12 }, has('#loader') ? '-=.55' : .1)
    .to('[data-hero]', { y: 0, opacity: 1, stagger: .1, duration: 1.1 }, '<.2')
    .to('.underline-sand', { '--u': 1, duration: 1.2, ease: 'power3.inOut' }, '<.2')
    .add(() => $$('[data-hero] .count, .hero-proof .count').forEach(countUp), '<');

  /* Homepage hero extras */
  if (has('.hero-frame')) {
    gsap.set('.hero-frame .arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 32px 32px)' });
    gsap.set(['.float-card', '.float-card2', '.spin-badge'], { scale: .6, opacity: 0 });
    intro
      .to('.hero-frame .arch', { clipPath: 'inset(0% 0 0 0 round 999px 999px 32px 32px)', duration: 1.6, ease: 'expo.inOut' }, 1.9)
      .fromTo('.hero-img', { scale: 1.4 }, { scale: 1.08, duration: 2 }, '<.3')
      .to(['.spin-badge', '.float-card', '.float-card2'], { scale: 1, opacity: 1, stagger: .12, duration: 1, ease: 'back.out(1.7)' }, '<.4')
      .to('.spark', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' }, '<.3');
    gsap.to('.float-card', { y: -12, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
    gsap.to('.float-card2', { y: 10, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
    gsap.to('.hero-img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (finePointer) {
      const frame = $('.hero-frame');
      $('.hero').addEventListener('mousemove', (e) => {
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        gsap.to('.float-card', { x: x * 30, duration: 1.2, ease: 'power3.out' });
        gsap.to('.float-card2', { x: x * -24, duration: 1.2, ease: 'power3.out' });
        gsap.to(frame, { rotateY: x * 4, rotateX: y * -4, transformPerspective: 1200, duration: 1.2, ease: 'power3.out' });
      });
    }
  }
  if (has('.hero-blob')) gsap.to('.hero-blob', { y: 220, ease: 'none', scrollTrigger: { trigger: '.hero-blob', start: 'top top', end: '+=900', scrub: true } });

  /* Generic reveals */
  $$('.reveal-up').forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach(el => gsap.from(el.children, { y: 50, opacity: 0, stagger: .1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  $$('.parallax-img').forEach(img => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.count').forEach(el => {
    if (el.closest('[data-hero], .hero-proof')) return;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) });
  });

  /* Homepage sections */
  onScroll('.freedoms li', { trigger: '.freedoms', y: 30 });
  const mani = $('.manifesto');
  if (mani) {
    const wrapWords = (node) => [...node.childNodes].forEach(child => {
      if (child.nodeType !== 3) return wrapWords(child);
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s);
      });
      child.replaceWith(frag);
    });
    wrapWords(mani);
    gsap.to($$('.w', mani), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: mani, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  }
  onScroll('.opp', { trigger: '.opp-grid' });

  if (has('.hscroll')) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const track = $('.hscroll-track');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.hscroll', pin: true, scrub: 1, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true } });
      $$('.hpanel:not(.hpanel-intro)').forEach(p => {
        gsap.from($('.hp-word', p), { yPercent: 40, opacity: 0, ease: 'power3.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 85%', end: 'left 40%', scrub: true } });
        gsap.from($('.hp-text', p), { y: 30, opacity: 0, ease: 'power3.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 70%', end: 'left 35%', scrub: true } });
      });
    });
    mm.add('(max-width: 1023px)', () => {
      $$('.hpanel').forEach(p => gsap.from(p.children, { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 80%' } }));
    });
  }

  $$('.draw-in').forEach(el => gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  onScroll('.pillar', { trigger: '.pillars', y: 80 });
  onScroll('.symptom', { trigger: '.symptoms', rotate: 2 });
  $$('.strike-list').forEach(list => $$('.strike', list).forEach((el, i) => gsap.to(el, { '--s': '100%', duration: .7, delay: i * .35, ease: 'power2.inOut', scrollTrigger: { trigger: list, start: 'top 75%' } })));
  onScroll('.checklist li', { trigger: '.checklist', x: -30, y: 0, duration: .9 });
  $$('.bp-visual img').forEach(img => gsap.from(img, { y: 100, rotate: 3, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: img, start: 'top 90%' } }));
  onScroll('.tags span', { trigger: '.tags', y: 20, stagger: .06 });
  onScroll('.anette', { y: 60 });
  onScroll('.mc', { y: 80 });
  onScroll('.ticks li', { trigger: '.ticks', y: 20, stagger: .08 });
  if (has('.yt-player')) gsap.from('.yt-player', { clipPath: 'inset(12% 12% 12% 12% round 24px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.yt-player', start: 'top 85%' } });
  onScroll('.yt-card', { trigger: '.yt-rail', y: 40, stagger: .07 });
  onScroll('.acc-steps div', { trigger: '.acc-steps', y: 30 });
  if (has('.acc-glow')) gsap.to('.acc-glow', { scale: 1.3, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  if (has('.close-words')) gsap.from('.cw', { yPercent: 60, opacity: 0, rotate: 4, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.close-words', start: 'top 85%', end: 'bottom 60%', scrub: 1 } });
  if (has('.foot-mega')) gsap.from('.foot-mega', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.foot-mega', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* Work-with-me path line */
  if (has('.path-line')) gsap.fromTo('.path-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.path', start: 'top 60%', end: 'bottom 70%', scrub: true } });

  /* Magnetic buttons + cursor */
  if (finePointer) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, .4)' }));
    });
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    if (dot && ring) {
      const label = $('span', ring);
      const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
      const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3.out' });
      window.addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
      document.addEventListener('mouseover', (e) => {
        const labelled = e.target.closest('[data-cursor]');
        ring.classList.toggle('is-label', !!labelled);
        if (labelled) label.textContent = labelled.dataset.cursor;
        ring.classList.toggle('is-hover', !labelled && !!e.target.closest('a, button, summary, label'));
      });
    }
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
