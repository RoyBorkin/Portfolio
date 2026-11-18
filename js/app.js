/* Roy Borkin portfolio — one continuous deck per version. Static, no build step. */
(function () {
  'use strict';
  if (window.MOBILE) return;
  var B = window.Board, P = window.PROFILE, root = document.documentElement, main = document.getElementById('main');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = B.esc, pad = B.pad, ICON = B.ICON;
  var state = { track: root.dataset.track || 'id' };
  var seen = {};
  ICON.pause = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';

  function byId(id) { for (var i = 0; i < window.PROJECTS.length; i++) if (window.PROJECTS[i].id === id) return window.PROJECTS[i]; return null; }
  function pdfHref(t) { return 'pdf/Roy-Borkin-' + ((t || state.track) === 'id' ? 'Industrial-Design' : 'Programmer') + '.pdf'; }

  function deck() {
    var items = B.list(state.track), h = B.cover(state.track);
    items.forEach(function (p, i) { h += B.slides(p, i + 1, state.track, { eager: i < 1 }); });
    return h + B.spec(state.track, items.length + 1);
  }

  /* ───────── routing: #/id, #/code, #/id/about, #/id/<project> ───────── */
  function parse() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean), tr = state.track;
    if (parts[0] === 'id' || parts[0] === 'code') tr = parts.shift();
    return { track: tr, to: parts[0] || null };
  }
  var built = null;
  function render() {
    var r = parse(), p = r.to && r.to !== 'about' ? byId(r.to) : null;
    if (p && p.tracks.indexOf(r.track) < 0) r.track = p.tracks[0];
    var changed = built !== r.track;
    state.track = r.track;
    try { localStorage.setItem('rb-track', state.track); } catch (e) {}
    if (changed) {
      root.dataset.track = state.track;
      main.innerHTML = deck(); built = state.track; B.number(main);
      chrome(); after();
      if (!r.to) window.scrollTo(0, 0);
    }
    if (r.to) { var el = document.getElementById('b-' + r.to); if (el) el.scrollIntoView({ behavior: changed || reduce ? 'auto' : 'smooth' }); }
    document.title = 'Roy Borkin — ' + P.tracks[state.track].label;
  }

  function chrome() {
    document.querySelectorAll('[data-track-link]').forEach(function (a) {
      a.setAttribute('aria-current', a.dataset.trackLink === state.track ? 'true' : 'false');
      a.href = '#/' + a.dataset.trackLink;
    });
    document.querySelectorAll('[data-nav]').forEach(function (a) { a.href = '#/' + state.track + (a.dataset.nav === 'about' ? '/about' : ''); });
    document.getElementById('pdfLink').href = pdfHref();
    document.querySelectorAll('[data-m="about"]').forEach(function (a) { a.href = '#/' + state.track + '/about'; });
    document.querySelectorAll('[data-m="pdf"]').forEach(function (a) { a.href = pdfHref(); });
    // pager: one mark per project
    var pg = document.querySelector('.pager');
    pg.innerHTML = Array.prototype.map.call(main.querySelectorAll('.board[data-slide="hero"]'), function (b, i) {
      var label = (b.getAttribute('aria-label') || '').split(',')[0];
      return '<button data-to="' + b.id + '" data-pid="' + b.dataset.id + '" aria-label="' + esc(label) + '"><i></i><span>' + pad(i) + ' ' + esc(label) + '</span></button>';
    }).join('');
  }

  /* ───────── behaviour ───────── */
  var cleanups = [];
  function after() {
    cleanups.forEach(function (f) { f(); }); cleanups = [];
    var boards = main.querySelectorAll('.board');
    boards.forEach(function (b, k) {
      b.dataset.k = k;
      var key = state.track + ':' + k;
      b.classList.add(!reduce ? 'pre-draw' : 'is-drawn');
      var ims = b.querySelectorAll('[data-notes] img');
      if (ims.length) ims.forEach(function (im) { if (im.complete) B.layout(b); else im.addEventListener('load', function () { B.layout(b); }, { once: true }); });
      else B.layout(b);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var b = e.target;
        // fully left the screen: reset quietly so it performs again next time
        if (!e.isIntersecting || e.intersectionRatio < 0.02) {
          if (!reduce && b.classList.contains('is-drawn')) { b.classList.remove('is-drawn'); b.classList.add('pre-draw'); }
          return;
        }
        if (e.intersectionRatio < 0.45) return;
        setCurrent(b.dataset.id);
        if (b.classList.contains('pre-draw')) {
          B.layout(b);
          requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('is-drawn'); b.classList.remove('pre-draw'); }); });
        }
      });
    }, { threshold: [0, 0.02, 0.45] });
    boards.forEach(function (b) { io.observe(b); });
    cleanups.push(function () { io.disconnect(); });
    videos();
  }
  function setCurrent(id) {
    document.querySelectorAll('.pager button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.pid === id ? 'true' : 'false'); });
  }

  function videos() {
    var vs = main.querySelectorAll('video[data-src]'); if (!vs.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduce && !v.dataset.userPaused) play(v); }
        else v.pause();
      });
    }, { rootMargin: '80px 0px' });
    vs.forEach(function (v) { io.observe(v); v.addEventListener('play', function () { sync(v); }); v.addEventListener('pause', function () { sync(v); }); });
    cleanups.push(function () { io.disconnect(); });
  }
  function play(v) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
  function sync(v) { var b = v.parentNode.querySelector('.vctl'); if (b) { b.innerHTML = v.paused ? ICON.play : ICON.pause; b.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video'); } }

  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { main.querySelectorAll('.board').forEach(B.layout); }, 120); });
  document.fonts && document.fonts.ready.then(function () { main.querySelectorAll('.board').forEach(B.layout); });

  /* ───────── lightbox ───────── */
  var lb = document.getElementById('lb'), stage = lb.querySelector('.lb-stage'), count = lb.querySelector('.lb-count'), set = [], at = 0, ret = null;
  function show(k) {
    at = (k + set.length) % set.length; var n = set[at], d = B.dims(n);
    stage.innerHTML = B.isVid(n)
      ? '<video src="media/v/' + n.slice(2) + '.mp4" poster="' + B.src(n) + '" controls playsinline width="' + d[0] + '" height="' + d[1] + '"></video>'
      : '<img src="' + B.src(n) + '" alt="" width="' + d[0] + '" height="' + d[1] + '">';
    count.textContent = pad(at + 1) + ' / ' + pad(set.length);
  }
  function open(n, pid) {
    var p = byId(pid), all = [];
    if (p) [].concat((p.photos || []).map(function (f) { return f[0]; }), p.full ? [p.full[0]] : [], p.media).forEach(function (x) { if (all.indexOf(x) < 0) all.push(x); });
    set = all.length ? all : [n]; ret = document.activeElement;
    lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('open'); });
    show(Math.max(0, set.indexOf(n))); lb.querySelector('.lb-close').focus(); document.body.style.overflow = 'hidden';
  }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; setTimeout(function () { lb.hidden = true; stage.innerHTML = ''; }, 180); if (ret) ret.focus(); }
  lb.querySelector('.lb-close').onclick = close;
  lb.querySelector('.lb-prev').onclick = function () { show(at - 1); };
  lb.querySelector('.lb-next').onclick = function () { show(at + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === stage) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) {
      // deck keys: page through slides
      if (/^(INPUT|TEXTAREA|IFRAME)$/.test((document.activeElement || {}).tagName || '')) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        var bs = Array.prototype.slice.call(main.querySelectorAll('.board')), y = window.scrollY + 4, i = 0;
        bs.forEach(function (b, k) { if (b.offsetTop <= y) i = k; });
        var t = bs[i + (e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1)];
        if (t && window.innerWidth > 860) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
      }
      return;
    }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(at + 1);
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'Tab') { var f = lb.querySelectorAll('button'), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });

  /* ───────── clicks ───────── */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('.pager [data-to]'))) { var el = document.getElementById(t.dataset.to); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    if ((t = e.target.closest('[data-zoom]'))) { open(t.dataset.zoom, t.closest('.board').dataset.id); return; }
    if ((t = e.target.closest('.vctl'))) { var v = t.parentNode.querySelector('video'); if (!v.src) v.src = v.dataset.src; if (v.paused) { delete v.dataset.userPaused; play(v); } else { v.dataset.userPaused = 1; v.pause(); } return; }
    if ((t = e.target.closest('[data-run]'))) {
      var p = byId(t.dataset.run), b = t.closest('.board'), box = b.querySelector('.live');
      if (box.hidden) {
        box.hidden = false; b.classList.add('is-running');
        box.innerHTML = '<div class="live-bar"><span>' + esc(p.live.replace('https://', '')) + '</span><a href="' + p.live + '" target="_blank" rel="noopener">Full screen' + ICON.out + '</a></div><iframe src="' + p.live + '" title="' + esc(B.plain(p.name)) + ', live" allow="fullscreen; clipboard-write"></iframe>';
        t.innerHTML = 'Close the app' + ICON.pause;
      } else { box.hidden = true; box.innerHTML = ''; b.classList.remove('is-running'); t.innerHTML = 'Run it here' + ICON.play; B.layout(b); }
    }
  });
  /* ───────── contact popover ───────── */
  var ctBtn = document.getElementById('ctBtn'), ctPop = document.getElementById('ctPop');
  var CI = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z"/></svg>',
    web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 17 7M9 7h8v8"/></svg>'
  };
  function ctRow(href, icon, label, value, ext) { return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + icon + '<span><b>' + label + '</b>' + esc(value) + '</span></a>'; }
  ctPop.innerHTML =
    '<p class="ct-name">Roy Borkin</p>' +
    ctRow('tel:' + P.phone.replace(/[^+\d]/g, ''), CI.phone, 'Call', P.phone) +
    ctRow('https://wa.me/' + P.phone.replace(/[^\d]/g, ''), CI.chat, 'WhatsApp', P.phone, true) +
    ctRow('mailto:' + P.email, CI.mail, 'Email', P.email) +
    ctRow(P.website, CI.web, 'Website', 'royborkin.github.io', true) +
    ctRow(P.linkedin, CI.out, 'LinkedIn', 'linkedin.com/in/royborkin', true) +
    ctRow(P.instagram, CI.out, 'Instagram', '@royborkin', true) +
    ctRow(P.github, CI.out, 'GitHub', 'github.com/RoyBorkin', true);
  function ctOpen(on) {
    ctBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { ctPop.hidden = false; requestAnimationFrame(function () { ctPop.classList.add('open'); }); }
    else { ctPop.classList.remove('open'); setTimeout(function () { if (!ctPop.classList.contains('open')) ctPop.hidden = true; }, 180); }
  }
  ctBtn.addEventListener('click', function (e) { e.stopPropagation(); ctOpen(ctPop.hidden || !ctPop.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (!ctPop.hidden && !ctPop.contains(e.target)) ctOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ctPop.hidden) { ctOpen(false); ctBtn.focus(); } });

  window.addEventListener('hashchange', render);
  render();
})();
