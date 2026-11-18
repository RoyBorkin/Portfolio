/* Phone UI — a home grid that fits one screen, projects as tap-through stories,
   bottom sheets for menu and info. Desktop and print never load this path. */
(function () {
  'use strict';
  var mq = window.matchMedia('(max-width: 860px)');
  if (!mq.matches) { mq.addEventListener && mq.addEventListener('change', function (e) { if (e.matches) location.reload(); }); return; }
  window.MOBILE = true;
  mq.addEventListener && mq.addEventListener('change', function (e) { if (!e.matches) location.reload(); });

  var root = document.documentElement;
  root.classList.add('m-ui');

  document.addEventListener('DOMContentLoaded', start);
  function start() {
    var B = window.Board, P = window.PROFILE, HERO = window.HERO || {}, LINES = window.LINES || {}, ILL = window.ILL || {};
    var esc = B.esc, pad = B.pad;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var app = document.createElement('div'); app.id = 'm-app'; document.body.appendChild(app);
    var track = root.dataset.track || 'id';
    var story = null; // { kind:'project'|'about', p, idx, screens:[...], at }

    var I = {
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
      menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
      prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
      out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 17 7M9 7h8v8"/></svg>',
      phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
      chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z"/></svg>',
      card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2a3.4 3.4 0 0 1 6.4 0M14.5 10h4M14.5 13.5h3"/></svg>',
      fsOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
      fsOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
      web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
      mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    };
    /* full screen (hidden where the browser can't do it, e.g. iPhone Safari) */
    var de = document.documentElement;
    var canFs = !!(de.requestFullscreen || de.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
    function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function contactBtn() { return '<button class="m-ic m-fs m-ct" data-act="contact" aria-label="Contact">' + I.card + '</button>'; }
    var standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    var isIOS = /iP(hone|od|ad)/.test(navigator.platform) || (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1) || /iPhone|iPad|iPod/.test(navigator.userAgent);
    var fsHelp = !canFs && isIOS && !standalone;
    function fsBtn() {
      if (fsHelp) return '<button class="m-ic m-fs" data-act="fshelp" aria-label="Full screen">' + I.fsOn + '</button>';
      return canFs && !standalone ? '<button class="m-ic m-fs" data-act="fs" aria-label="' + (isFs() ? 'Exit full screen' : 'Full screen') + '">' + (isFs() ? I.fsOff : I.fsOn) + '</button>' : '';
    }
    function toggleFs() {
      if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { var r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de, { navigationUI: 'hide' }); if (r && r.catch) r.catch(function () {}); }
    }
    function syncFs() { document.querySelectorAll('.m-fs').forEach(function (b) { b.innerHTML = isFs() ? I.fsOff : I.fsOn; b.setAttribute('aria-label', isFs() ? 'Exit full screen' : 'Full screen'); }); }
    document.addEventListener('fullscreenchange', syncFs); document.addEventListener('webkitfullscreenchange', syncFs);

    function byId(id) { return window.PROJECTS.filter(function (p) { return p.id === id; })[0]; }
    function items() { return B.list(track); }
    function plain(s) { return String(s).replace(/\n/g, ' '); }
    function heroSrc(name, small) { return 'media/hero/' + name + (small ? '-s' : '') + '.webp'; }
    function pdfHref() { return 'pdf/Roy-Borkin-' + (track === 'id' ? 'Industrial-Design' : 'Programmer') + '.pdf'; }

    /* ───────── home: cover + grid, one screen ───────── */
    function home() {
      var T = P.tracks[track], list = items();
      var tiles = list.map(function (p, i) {
        var o = B.objectOf(p, track), img, fit = 'contain';
        if (o.kind === 'photo') { img = heroSrc(o.name, true); fit = 'cover'; }
        else if (o.kind === 'cut') img = heroSrc(o.name, true);
        else { img = B.src(o.name, true); fit = o.kind === 'shot' ? 'cover' : 'contain'; }
        return '<a class="m-tile k-' + o.kind + '" href="#/' + track + '/' + p.id + '" style="--i:' + i + '">' +
          '<span class="m-tile-img"><img src="' + img + '" alt="" loading="' + (i < 6 ? 'eager' : 'lazy') + '" style="object-fit:' + fit + '"></span>' +
          '<span class="m-tile-t"><b>' + pad(i + 1) + '</b>' + esc(plain(p.name)) + '</span></a>';
      }).join('');
      app.innerHTML =
        '<main class="m-home" aria-label="Roy Borkin, ' + esc(T.label) + '">' +
          '<header class="m-head">' +
            '<div class="m-head-t"><p class="m-ver">' + esc(T.label) + '</p><h1>Roy<br>Borkin</h1><p class="m-roles">' + esc(T.hook) + '</p></div>' +
            '<a class="m-me" href="#/' + track + '/about" aria-label="About and CV"><img src="' + heroSrc('me-illu', true) + '" alt=""></a>' +
          '</header>' +
          '<nav class="m-grid n' + list.length + '" aria-label="Projects">' + tiles + '</nav>' +
          '<div class="m-dock">' + contactBtn() + fsBtn() + '<button class="m-pill" data-act="menu">' + I.menu + 'Menu</button></div>' +
        '</main>';
      document.title = 'Roy Borkin — ' + T.label;
    }

    /* ───────── stories ───────── */
    function heroScreen(p, i, o) {
      var notes = o.kind === 'shot' ? (p.shotNotes || []) : (p.notes || []);
      var dots = notes.map(function (n, k) { return '<button class="m-dot" style="--d:' + k + '" data-k="' + k + '" data-x="' + n[1] + '" data-y="' + n[2] + '" aria-label="' + esc(n[0]) + '">' + (k + 1) + '</button>'; }).join('');
      var img;
      if (o.kind === 'photo' || o.kind === 'cut') img = heroSrc(o.name);
      else img = B.src(o.name);
      var tone = o.kind === 'photo' ? ' t-' + (p.tone || 'light') : '';
      return '<section class="m-scr s-hero k-' + o.kind + tone + (o.round ? ' is-round' : '') + '">' +
        '<div class="m-obj"><div class="m-objwrap"><img src="' + img + '" alt="' + esc(plain(p.name)) + '">' + dots + '</div></div>' +
        '<p class="m-num"><span>' + pad(i + 1) + '</span></p>' +
        '<div class="m-cap">' +
          '<p class="m-hook">“' + esc(p.hook) + '”</p>' +
          '<h2 class="m-name">' + esc(plain(p.name)) + '</h2>' +
          '<button class="m-more" data-act="info">' + I.info + 'About this project</button>' +
        '</div>' +
        '<p class="m-tip" hidden></p>' +
      '</section>';
    }
    function procScreen(p, o) {
      if (o.kind === 'shot') {
        var main = p.procShot ? p.procShot[0] : p.shot;
        var rest = (p.thumbs || p.media.filter(function (n) { return n !== main && n !== p.shot; }).map(function (n) { return [n, '']; })).slice(0, 2);
        return '<section class="m-scr s-proc s-code">' +
          '<p class="m-kicker">Inside</p>' +
          '<button class="m-ph m-shot" data-zoom="' + main + '"><img src="' + B.src(main) + '" alt="' + esc(plain(p.name)) + ' screen"></button>' +
          (rest.length ? '<div class="m-thumbs">' + rest.map(function (f) { return ph(f[0], f[1], 0); }).join('') + '</div>' : '') +
          '<div class="m-acts">' +
            (p.live ? '<a class="m-btn m-btn-solid" href="' + p.live + '" target="_blank" rel="noopener">Open the app' + I.out + '</a>' : '') +
            (p.repo ? '<a class="m-btn" href="' + p.repo + '" target="_blank" rel="noopener">Source code' + I.out + '</a>' : '') +
          '</div>' +
        '</section>';
      }
      var list = (p.photos || []).slice(0, 5);
      if (!list.length) return '';
      return '<section class="m-scr s-proc">' +
        '<p class="m-kicker">Process</p>' +
        '<div class="m-mosaic n' + list.length + '">' + list.map(function (f, k) { return ph(f[0], f[1], k); }).join('') + '</div>' +
      '</section>';
    }
    function ph(n, cap, k) {
      var v = B.isVid(n);
      return '<button class="m-ph" data-zoom="' + n + '" style="--i:' + k + '" aria-label="Enlarge ' + esc(cap || 'image') + '">' +
        '<img src="' + B.src(n, true) + '" alt="' + esc(cap || '') + '" loading="lazy">' +
        (v ? '<span class="m-play">' + I.play + '</span>' : '') +
        (cap ? '<span class="m-phcap">' + esc(cap) + '</span>' : '') + '</button>';
    }
    function fullScreen(p) {
      if (!p.full) return '';
      return '<section class="m-scr s-full"><img src="' + B.src(p.full[0]) + '" alt="' + esc(p.full[1]) + '"><p class="m-fullcap">' + esc(p.full[1]) + '</p></section>';
    }
    function projectScreens(p, i) {
      var o = B.objectOf(p, track);
      return [heroScreen(p, i, o), procScreen(p, o), fullScreen(p)].filter(Boolean);
    }
    function aboutScreens() {
      var S = P.spec, T = P.tracks[track];
      var rows = function (arr) { return arr.map(function (r, k) { return '<li style="--k:' + k + '"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + (r[2] ? ' <i>' + esc(r[2]) + '</i>' : '') + '</span></li>'; }).join(''); };
      var chips = function (arr) { return '<ul class="m-chips">' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
      return [
        '<section class="m-scr s-about s-me">' +
          '<div class="m-obj"><div class="m-objwrap"><img src="media/hero/me.webp" alt="Roy Borkin"></div></div>' +
          '<div class="m-cap"><p class="m-hook">' + esc(T.hook) + '</p><h2 class="m-name">Roy Borkin</h2><p class="m-line">' + esc(T.line) + '</p>' + contacts() + '</div>' +
        '</section>',
        '<section class="m-scr s-about"><p class="m-kicker">About</p><p class="m-about">' + esc(S.about[track]) + '</p></section>',
        '<section class="m-scr s-about"><p class="m-kicker">Experience <i>13 years</i></p><ul class="m-rows">' + rows(S.experience) + '</ul></section>',
        '<section class="m-scr s-about"><p class="m-kicker">Education</p><ul class="m-rows edu">' + S.education.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></li>'; }).join('') + '</ul>' +
          '<p class="m-kicker">Certifications</p><ul class="m-rows edu">' + S.certs.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></li>'; }).join('') + '</ul></section>',
        '<section class="m-scr s-about s-more"><p class="m-kicker">More</p>' +
          '<button class="m-big" data-act="skills"><b>Skills</b><span>' + S.skillOrder[track].length + ' areas, from ' + esc(S.skillOrder[track][0]) + ' to languages</span>' + I.next + '</button>' +
          '<button class="m-big" data-act="recog"><b>Recognition</b><span>' + S.awards.length + ' awards and highlights</span>' + I.next + '</button>' +
          '<div class="m-pdfrow"><button class="m-btn m-btn-solid m-pdf" data-act="pdf">PDF portfolio</button><button class="m-btn m-pdf" data-act="resume">Resume</button></div></section>'
      ];
    }
    function contacts() {
      return '<div class="m-contact">' +
        '<a class="m-btn m-btn-solid" href="tel:' + P.phone.replace(/[^+\d]/g, '') + '">' + I.phone + esc(P.phone) + '</a>' +
        '<a class="m-btn" href="mailto:' + P.email + '">' + I.mail + 'Email</a>' +
        '<a class="m-btn" href="' + P.website + '" target="_blank" rel="noopener">Website</a>' +
        '<a class="m-btn" href="' + P.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a class="m-btn" href="' + P.instagram + '" target="_blank" rel="noopener">Instagram</a>' +
        '<a class="m-btn" href="' + P.github + '" target="_blank" rel="noopener">GitHub</a>' +
      '</div>';
    }

    function openStory(id, at) {
      var list = items(), idx = -1, p = null, screens, title, label;
      if (id === 'about') { screens = aboutScreens(); title = 'About & CV'; label = ''; }
      else {
        list.forEach(function (x, k) { if (x.id === id) { idx = k; p = x; } });
        if (!p) { location.hash = '#/' + track; return; }
        screens = projectScreens(p, idx); title = plain(p.name); label = pad(idx + 1) + ' / ' + pad(list.length);
      }
      var names = id === 'about' ? ['Roy', 'About', 'Experience', 'Education', 'Skills'] : screens.map(function (s) { return /s-hero/.test(s) ? 'Overview' : /s-proc/.test(s) ? (/s-code/.test(s) ? 'Inside' : 'Process') : 'Photo'; });
      story = { id: id, p: p, idx: idx, n: screens.length, at: Math.min(at || 0, screens.length - 1), names: names };
      var wasOpen = !!app.querySelector('.m-story');
      if (!app.querySelector('.m-home')) home();
      var el = document.createElement('div');
      el.className = 'm-story' + (wasOpen ? ' is-swap' : '');
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
      el.innerHTML =
        '<div class="m-bars">' + screens.map(function () { return '<i><b></b></i>'; }).join('') + '</div>' +
        '<div class="m-top"><p><b>' + esc(label) + '</b>' + (label ? ' ' : '') + esc(title) + '</p>' +
          (p ? '<button class="m-ic" data-act="info" aria-label="Project info">' + I.info + '</button>' : '') +
          '<button class="m-ic" data-act="close" aria-label="Back to all work">' + I.x + '</button></div>' +
        '<div class="m-stage"><div class="m-track">' + screens.join('') + '</div></div>' +
        '<div class="m-nav">' +
          '<button class="m-ic m-prev" data-act="prev" aria-label="Previous">' + I.prev + '</button>' +
          '<div class="m-mid">' + contactBtn() + fsBtn() + '<button class="m-ic m-fs" data-act="menu" aria-label="Menu">' + I.menu + '</button></div>' +
          '<button class="m-pill m-next" data-act="next"><span></span>' + I.next + '</button>' +
        '</div>';
      var old = app.querySelector('.m-story');
      story.el = el;
      app.appendChild(el);
      if (old) setTimeout(function () { old.remove(); }, 260);
      document.title = title + ' — Roy Borkin';
      requestAnimationFrame(function () { el.classList.add('is-open'); go(story.at, true); });
      el.querySelectorAll('.s-hero img, .s-me img').forEach(function (im) { if (im.complete) placeDots(im); else im.addEventListener('load', function () { placeDots(im); }, { once: true }); });
      bindGestures(el.querySelector('.m-stage'));
    }
    function closeStory() {
      story = null;
      app.querySelectorAll('.m-story').forEach(function (el) {
        el.classList.remove('is-open'); el.classList.add('is-closing');
        setTimeout(function () { el.remove(); }, 280);
      });
      document.title = 'Roy Borkin — ' + P.tracks[track].label;
    }
    function go(i, instant) {
      var el = story && story.el; if (!el) return;
      story.at = i;
      var tr = el.querySelector('.m-track');
      tr.style.transition = instant || reduce ? 'none' : '';
      tr.style.transform = 'translateX(' + (-100 * i) + '%)';
      el.querySelectorAll('.m-bars i').forEach(function (b, k) { b.className = k < i ? 'done' : k === i ? 'now' : ''; });
      el.querySelectorAll('.m-scr').forEach(function (s, k) { s.classList.toggle('is-in', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      el.querySelector('.m-prev').disabled = i === 0 && (story.id === 'about' || story.idx <= 0);
      var nx = el.querySelector('.m-next span'), list = items();
      if (i < story.n - 1) nx.textContent = story.names[i + 1];
      else if (story.id === 'about') nx.textContent = 'All work';
      else nx.textContent = story.idx < list.length - 1 ? 'Next project' : 'All work';
      hideTip();
      var v = el.querySelectorAll('video'); v.forEach(function (x) { x.pause(); });
    }
    function step(d) {
      if (!story) return;
      var i = story.at + d, list = items();
      if (i >= 0 && i < story.n) return go(i);
      if (story.id === 'about') { if (d > 0) location.hash = '#/' + track; return; }
      var j = story.idx + d;
      if (j < 0) return;
      if (j >= list.length) { location.hash = '#/' + track; return; }
      location.hash = '#/' + track + '/' + list[j].id + (d < 0 ? '/last' : '');
    }

    /* dots sit on the actual part, wherever the image is drawn */
    function placeDots(im) {
      var wrap = im.parentNode, scr = wrap.closest('.m-scr'), cover = scr.classList.contains('k-photo');
      var dots = wrap.querySelectorAll('.m-dot'); if (!dots.length) return;
      var W = wrap.clientWidth, H = wrap.clientHeight, w = im.naturalWidth, h = im.naturalHeight;
      var s = cover ? Math.max(W / w, H / h) : Math.min(W / w, H / h), dw = w * s, dh = h * s, ox = (W - dw) / 2, oy = (H - dh) / 2;
      if (!cover) { ox = (W - im.clientWidth) / 2; oy = (H - im.clientHeight) / 2; dw = im.clientWidth; dh = im.clientHeight; }
      dots.forEach(function (d) {
        var x = ox + (+d.dataset.x) * dw, y = oy + (+d.dataset.y) * dh;
        d.style.left = Math.max(14, Math.min(W - 14, x)) + 'px'; d.style.top = Math.max(14, Math.min(H - 14, y)) + 'px';
      });
    }
    function showTip(dot) {
      var scr = dot.closest('.m-scr'), tip = scr.querySelector('.m-tip'), r = dot.getBoundingClientRect(), S = scr.getBoundingClientRect();
      tip.textContent = dot.getAttribute('aria-label'); tip.hidden = false;
      var left = r.left - S.left + r.width / 2, top = r.top - S.top;
      tip.style.left = Math.max(70, Math.min(S.width - 70, left)) + 'px'; tip.style.top = (top - 10) + 'px';
      scr.querySelectorAll('.m-dot').forEach(function (d) { d.classList.toggle('on', d === dot); });
    }
    function hideTip() { app.querySelectorAll('.m-tip').forEach(function (t) { t.hidden = true; }); app.querySelectorAll('.m-dot.on').forEach(function (d) { d.classList.remove('on'); }); }

    /* tap left / right, swipe sideways, pull down to close */
    function bindGestures(stage) {
      var sx, sy, st, moved, tr = stage.querySelector('.m-track');
      stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; st = Date.now(); moved = false; });
      stage.addEventListener('pointermove', function (e) {
        if (sx == null) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) moved = 'x';
        if (!moved && dy > 12 && dy > Math.abs(dx)) moved = 'y';
        if (moved === 'x' && !reduce) { tr.style.transition = 'none'; tr.style.transform = 'translateX(calc(' + (-100 * story.at) + '% + ' + dx * 0.9 + 'px))'; }
        if (moved === 'y' && !reduce) { stage.parentNode.style.transform = 'translateY(' + Math.max(0, dy * 0.5) + 'px)'; }
      });
      function end(e) {
        if (sx == null) return;
        var dx = e.clientX - sx, dy = e.clientY - sy, dt = Date.now() - st, el = stage.parentNode;
        el.style.transform = ''; tr.style.transition = '';
        var t = e.target;
        sx = null;
        if (moved === 'y') { if (dy > 90 || (dy > 40 && dt < 250)) { location.hash = '#/' + track; } return; }
        if (moved === 'x') {
          if (dx < -50 || (dx < -20 && dt < 250)) step(1); else if (dx > 50 || (dx > 20 && dt < 250)) step(-1); else go(story.at);
          return;
        }
        if (t.closest('button, a, .m-dot')) return;
        hideTip();
        var R = stage.getBoundingClientRect();
        if (e.clientX - R.left < R.width * 0.3) step(-1); else step(1);
      }
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', function () { sx = null; go(story ? story.at : 0); stage.parentNode.style.transform = ''; });
    }

    /* ───────── sheets ───────── */
    function sheet(html, cls) {
      closeSheet(true);
      var w = document.createElement('div');
      w.className = 'm-sheetwrap ' + (cls || '');
      w.innerHTML = '<div class="m-scrim" data-act="sheetclose"></div><div class="m-sheet" role="dialog" aria-modal="true"><div class="m-grab" data-act="sheetclose"></div>' + html + '</div>';
      document.body.appendChild(w);
      requestAnimationFrame(function () { w.classList.add('is-open'); });
      var sh = w.querySelector('.m-sheet'), sy = null;
      sh.addEventListener('pointerdown', function (e) { if (sh.scrollTop <= 0) sy = e.clientY; });
      sh.addEventListener('pointermove', function (e) { if (sy == null) return; var dy = e.clientY - sy; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = 'translateY(' + dy + 'px)'; } });
      sh.addEventListener('pointerup', function (e) { if (sy == null) return; var dy = e.clientY - sy; sy = null; sh.style.transition = ''; sh.style.transform = ''; if (dy > 90) closeSheet(); });
      return w;
    }
    function closeSheet(now) {
      var w = document.querySelector('.m-sheetwrap'); if (!w) return;
      if (now) return w.remove();
      w.classList.remove('is-open'); setTimeout(function () { w.remove(); }, 260);
    }
    function menuSheet() {
      var list = items(), cur = story && story.id;
      sheet(
        '<div class="m-seg" role="tablist" aria-label="Version">' +
          ['id', 'code'].map(function (t) { return '<button role="tab" aria-selected="' + (t === track) + '" data-act="track" data-t="' + t + '">' + esc(P.tracks[t].label) + '</button>'; }).join('') +
        '</div>' +
        '<nav class="m-list" aria-label="Projects">' +
          '<a href="#/' + track + '"' + (!cur ? ' aria-current="page"' : '') + '><b>00</b>All work</a>' +
          list.map(function (p, i) { return '<a href="#/' + track + '/' + p.id + '"' + (cur === p.id ? ' aria-current="page"' : '') + '><b>' + pad(i + 1) + '</b>' + esc(plain(p.name)) + '</a>'; }).join('') +
          '<a href="#/' + track + '/about"' + (cur === 'about' ? ' aria-current="page"' : '') + '><b>CV</b>About &amp; CV</a>' +
        '</nav>' +
        '<div class="m-pdfrow"><button class="m-btn" data-act="pdf">PDF portfolio</button><button class="m-btn" data-act="resume">Resume</button></div>' +
        contacts(), 'is-menu');
    }
    function fsHelpSheet() {
      var share = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;vertical-align:-3px"><path d="M12 3v12M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
      var plus = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;vertical-align:-3px"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
      sheet(
        '<p class="m-kicker">Full screen on iPhone</p>' +
        '<h2 class="m-sh-t">Open it like an app</h2>' +
        '<p class="m-sh-story">iPhone Safari doesn\'t let websites go full screen. Add the portfolio to your Home Screen and it opens without the browser bars.</p>' +
        '<ol class="m-steps">' +
          '<li><span>Tap ' + share + ' <b>Share</b> in Safari\'s toolbar</span></li>' +
          '<li><span>Choose ' + plus + ' <b>Add to Home Screen</b></span></li>' +
          '<li><span>Open <b>Roy Borkin</b> from your Home Screen</span></li>' +
        '</ol>', 'is-info');
    }
    function contactSheet() {
      sheet(
        '<p class="m-kicker">Contact</p>' +
        '<h2 class="m-sh-t">Roy Borkin</h2>' +
        '<nav class="m-clist">' +
          '<a href="tel:' + P.phone.replace(/[^+\d]/g, '') + '">' + I.phone + '<span><b>Call</b>' + esc(P.phone) + '</span></a>' +
          '<a href="https://wa.me/' + P.phone.replace(/[^\d]/g, '') + '" target="_blank" rel="noopener">' + I.chat + '<span><b>WhatsApp</b>' + esc(P.phone) + '</span></a>' +
          '<a href="mailto:' + P.email + '">' + I.mail + '<span><b>Email</b>' + esc(P.email) + '</span></a>' +
          '<a href="' + P.website + '" target="_blank" rel="noopener">' + I.web + '<span><b>Website</b>royborkin.github.io</span></a>' +
          '<a href="' + P.linkedin + '" target="_blank" rel="noopener">' + I.out + '<span><b>LinkedIn</b>linkedin.com/in/royborkin</span></a>' +
          '<a href="' + P.instagram + '" target="_blank" rel="noopener">' + I.out + '<span><b>Instagram</b>@royborkin</span></a>' +
          '<a href="' + P.github + '" target="_blank" rel="noopener">' + I.out + '<span><b>GitHub</b>github.com/RoyBorkin</span></a>' +
        '</nav>' +
        '<div class="m-pdfrow"><button class="m-btn" data-act="pdf">PDF portfolio</button><button class="m-btn" data-act="resume">Resume</button></div>', 'is-contact');
    }
    function infoSheet() {
      if (!story || !story.p) return;
      var p = story.p, o = B.objectOf(p, track), I2 = p.ill, art = '';
      if (o.kind !== 'shot' && I2) {
        if (I2.svg && LINES[I2.svg]) { var L = LINES[I2.svg]; art = '<svg viewBox="0 0 ' + L.w + ' ' + L.h + '">' + L.d.map(function (d, k) { return '<path d="' + d + '" class="' + (L.k[k] === 'o' ? 'lo' : 'li') + '"/>'; }).join('') + '</svg>'; }
        else if (I2.img) art = '<img src="media/' + (I2.from === 'hero' ? 'hero/' : 'ill/') + I2.img + '.webp" alt="" class="' + (I2.raw ? 'raw' : '') + '">';
      }
      var notes = (o.kind === 'shot' ? p.shotNotes : p.notes) || [];
      sheet(
        '<p class="m-kicker">' + esc(p.year) + ' · ' + esc(p.where) + '</p>' +
        '<h2 class="m-sh-t">' + esc(plain(p.name)) + '</h2>' +
        '<p class="m-sh-sub">' + esc(p.sub) + '</p>' +
        (p.story ? '<p class="m-sh-story">' + esc(p.story) + '</p>' : '') +
        '<ul class="m-chips">' + p.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        (notes.length ? '<ol class="m-parts">' + notes.map(function (n) { return '<li>' + esc(n[0]) + '</li>'; }).join('') + '</ol>' : '') +
        (p.inset ? '<figure class="m-detail"><img src="' + B.src(p.inset[0], true) + '" alt=""><figcaption><i></i>Detail · ' + esc(p.inset[1]) + '</figcaption></figure>' : '') +
        (art ? '<figure class="m-drawing">' + art + '</figure>' : '') +
        ((p.live || p.repo) ? '<div class="m-acts">' + (p.live ? '<a class="m-btn m-btn-solid" href="' + p.live + '" target="_blank" rel="noopener">Open the app' + I.out + '</a>' : '') + (p.repo ? '<a class="m-btn" href="' + p.repo + '" target="_blank" rel="noopener">Source code' + I.out + '</a>' : '') + '</div>' : ''),
        'is-info');
    }

    /* ───────── photo viewer ───────── */
    function viewer(n) {
      var p = story && story.p, set = [];
      if (p) [].concat((p.photos || []).map(function (f) { return f[0]; }), p.full ? [p.full[0]] : [], p.shot ? [p.shot] : [], p.media || []).forEach(function (x) { if (set.indexOf(x) < 0) set.push(x); });
      if (set.indexOf(n) < 0) set.unshift(n);
      var at = set.indexOf(n), w = document.createElement('div');
      w.className = 'm-view'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
      w.innerHTML = '<div class="m-view-stage"></div><p class="m-view-n"></p><button class="m-ic m-view-x" data-act="viewclose" aria-label="Close">' + I.x + '</button>';
      document.body.appendChild(w);
      function show(k) {
        at = (k + set.length) % set.length; var x = set[at];
        w.querySelector('.m-view-stage').innerHTML = B.isVid(x) ? '<video src="media/v/' + x.slice(2) + '.mp4" poster="' + B.src(x) + '" controls playsinline autoplay muted></video>' : '<img src="' + B.src(x) + '" alt="">';
        w.querySelector('.m-view-n').textContent = pad(at + 1) + ' / ' + pad(set.length);
      }
      show(at);
      requestAnimationFrame(function () { w.classList.add('is-open'); });
      var sx, sy;
      w.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
      w.addEventListener('pointerup', function (e) {
        if (sx == null || e.target.closest('video, button')) { sx = null; return; }
        var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
        if (dy > 80 && dy > Math.abs(dx)) return closeView();
        if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
        else show(at + (e.clientX < window.innerWidth * 0.3 ? -1 : 1));
      });
    }
    function closeView() { var w = document.querySelector('.m-view'); if (!w) return; w.classList.remove('is-open'); setTimeout(function () { w.remove(); }, 220); }

    /* ───────── clicks ───────── */
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act], [data-zoom], .m-dot, a[href^="#/"]');
      if (!t) return;
      if (t.classList.contains('m-dot')) { e.preventDefault(); return t.classList.contains('on') ? hideTip() : showTip(t); }
      if (t.dataset.zoom) return viewer(t.dataset.zoom);
      if (t.matches('a[href^="#/"]')) { closeSheet(); return; }
      var a = t.dataset.act;
      if (a === 'menu') menuSheet();
      else if (a === 'info') infoSheet();
      else if (a === 'close') location.hash = '#/' + track;
      else if (a === 'prev') step(-1);
      else if (a === 'next') step(1);
      else if (a === 'sheetclose') closeSheet();
      else if (a === 'viewclose') closeView();
      else if (a === 'fs') toggleFs();
      else if (a === 'fshelp') fsHelpSheet();
      else if (a === 'contact') contactSheet();
      else if (a === 'pdf' || a === 'resume') sheet('<p class="m-kicker">Choose a version</p><h2 class="m-sh-t">' + (a === 'pdf' ? 'PDF portfolio' : 'Resume') + '</h2>' + B.pdfList(track, 'm-clist m-pdflist', a), 'is-info');
      else if (a === 'skills') sheet('<p class="m-kicker">About &amp; CV</p><h2 class="m-sh-t">Skills</h2>' + B.skillsHTML(track), 'is-info is-skills');
      else if (a === 'recog') sheet('<p class="m-kicker">About &amp; CV</p><h2 class="m-sh-t">Recognition</h2>' + B.recogHTML(), 'is-info');
      else if (a === 'track') { var nt = t.dataset.t; closeSheet(); if (nt !== track) location.hash = '#/' + nt; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (document.querySelector('.m-view')) return closeView(); if (document.querySelector('.m-sheetwrap')) return closeSheet(); if (story) location.hash = '#/' + track; }
      if (story && !document.querySelector('.m-sheetwrap, .m-view')) { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }
    });
    window.addEventListener('resize', function () { app.querySelectorAll('.s-hero img, .s-me img').forEach(placeDots); });

    /* ───────── routing ───────── */
    function route() {
      var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean), t = track;
      if (parts[0] === 'id' || parts[0] === 'code') t = parts.shift();
      var to = parts[0], last = parts[1] === 'last';
      var p = to && to !== 'about' ? byId(to) : null;
      if (p && p.tracks.indexOf(t) < 0) t = p.tracks[0];
      if (t !== track || !app.querySelector('.m-home')) { track = t; root.dataset.track = t; try { localStorage.setItem('rb-track', t); } catch (e) {} home(); }
      closeSheet(true); closeView();
      if (!to) return closeStory();
      openStory(to, last ? 99 : 0);
    }
    window.addEventListener('hashchange', route);
    route();
  }
})();
