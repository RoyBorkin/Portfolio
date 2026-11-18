/* Slide renderer — shared by the web app (app.js) and the PDF book (print.js).
   Every project is 2–3 slides: hero, process, full photo. */
(function (g) {
  'use strict';
  var P = g.PROFILE, MEDIA = g.MEDIA || {}, HERO = g.HERO || {}, LINES = g.LINES || {}, ILL = g.ILL || {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isVid(n) { return n && n.indexOf('v:') === 0; }
  function dims(n) { return isVid(n) ? (MEDIA[n] || [1280, 720, 0]) : (MEDIA[n] || [1600, 1000, 0]); }
  function src(n, small) { return isVid(n) ? 'media/v/' + n.slice(2) + '.jpg' : 'media/' + n + (small ? '-s' : '') + '.webp'; }
  function plain(s) { return String(s).replace(/\n/g, ' '); }
  /* name lines, each in a mask so it can rise into place */
  function lines(s) { return String(s).split('\n').map(function (l, k) { return '<span class="ln"><span style="--k:' + k + '">' + esc(l) + '</span></span>'; }).join(''); }

  function list(track) {
    return g.PROJECTS.filter(function (p) { return !p.hide && p.tracks.indexOf(track) > -1; })
      .sort(function (a, b) { return ((a.order || {})[track] || 99) - ((b.order || {})[track] || 99); });
  }

  /* Which picture is "the object" on this track */
  function objectOf(p, track) {
    if (p.shot && (track === 'code' || p.live)) return { kind: 'shot', name: p.shot, round: !!p.round };
    if (p.photo) return { kind: 'photo', name: p.photo };
    if (p.hero) return { kind: 'cut', name: p.hero };
    if (p.flat) return { kind: 'flat', name: p.flat };
    if (p.shot) return { kind: 'shot', name: p.shot, round: !!p.round };
    return { kind: 'flat', name: p.media[0] };
  }
  function layoutOf(p, track, o) {
    if (o.kind === 'shot' && p.layoutCode) return p.layoutCode;
    return p.layout || 'A';
  }

  function objImg(o, opts) {
    var w, h, s;
    if (o.kind === 'cut' || o.kind === 'photo') { var d = HERO[o.name] || [1000, 1000]; w = d[0]; h = d[1]; s = 'media/hero/' + o.name + '.webp'; }
    else { var m = dims(o.name); w = m[0]; h = m[1]; s = src(o.name); }
    return '<img class="obj-img" src="' + s + '" width="' + w + '" height="' + h + '" alt="' + esc(opts.alt || '') + '"' +
      (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  function notesAttr(notes) { return ' data-notes="' + esc(JSON.stringify(notes || [])) + '"'; }

  /* The line drawing: another view of the object, carrying the callouts */
  function ill(p) {
    var I = p.ill; if (!I) return '';
    var art, ratio;
    if (I.svg && LINES[I.svg]) {
      var L = LINES[I.svg]; ratio = L.w + ' ' + L.h;
      art = '<svg viewBox="0 0 ' + L.w + ' ' + L.h + '" preserveAspectRatio="xMidYMid meet" data-w="' + L.w + '" data-h="' + L.h + '">' +
        L.d.map(function (d, i) { return '<path class="' + (L.k[i] === 'o' ? 'lo' : 'li') + '" d="' + d + '" pathLength="1" style="--d:' + Math.min(i * 12, 600) + 'ms"/>'; }).join('') + '</svg>';
    } else if (I.img) {
      var hero = I.from === 'hero', d = hero ? HERO[I.img] : ILL[I.img]; d = d || [800, 600];
      art = '<img src="media/' + (hero ? 'hero/' : 'ill/') + I.img + '.webp" width="' + d[0] + '" height="' + d[1] + '" alt="" loading="lazy" decoding="async">';
    } else return '';
    var dd = I.svg ? [LINES[I.svg].w, LINES[I.svg].h] : (I.from === 'hero' ? HERO[I.img] : ILL[I.img]) || [1, 1], r = dd[0] / dd[1];
    var shape = r > 1.55 ? ' ill-wide' : r < 0.8 ? ' ill-tall' : '';
    return '<figure class="ill' + shape + (I.img ? ' is-img' : ' is-svg') + (I.raw ? ' is-raw' : '') + '" aria-hidden="true"><div class="ill-art"' + notesAttr(I.notes) + (I.dims ? ' data-dims="' + esc(JSON.stringify(I.dims)) + '"' : '') + '>' + art + '</div>' +
      (I.credit ? '<figcaption class="credit">' + esc(I.credit) + '</figcaption>' : '') + '</figure>';
  }
  function stack(p) {
    return '<figure class="ill is-stack" aria-hidden="true"><ul class="stack">' + p.tags.map(function (t, k) { return '<li style="--k:' + k + '">' + esc(t) + '</li>'; }).join('') + '</ul></figure>';
  }
  /* screen callouts: side from position */
  function sides(ns) { return (ns || []).map(function (n) { return [n[0], n[1], n[2], n[2] < 0.1 ? 't' : n[1] < 0.5 ? 'l' : 'r']; }); }
  function legend(notes) {
    return notes && notes.length ? '<ol class="legend">' + notes.map(function (n) { return '<li>' + esc(n[0]) + '</li>'; }).join('') + '</ol>' : '';
  }
  function inset(p, o) {
    var name, cap, pos = '50% 50%';
    if (o.kind === 'shot' && !p.inset) {
      var n = (p.shotNotes || [])[0]; if (!n) return '';
      name = p.shot; cap = n[0]; pos = (n[1] * 100).toFixed(0) + '% ' + (n[2] * 100).toFixed(0) + '%';
    } else if (p.inset) { name = p.inset[0]; cap = p.inset[1]; if (p.inset[2]) pos = p.inset[2]; }
    else return '';
    return '<figure class="inset"><figcaption><i></i>Detail<span>' + esc(cap) + '</span></figcaption>' +
      '<div class="inset-box' + (o.kind === 'shot' && !p.inset ? ' is-zoom' : '') + '"><img src="' + src(name, o.kind !== 'shot') + '" alt="" loading="lazy" decoding="async" style="object-position:' + pos + '"></div></figure>';
  }

  /* ── 1. Hero slide ── */
  function hero(p, i, track, opts) {
    opts = opts || {};
    var o = objectOf(p, track), lay = layoutOf(p, track, o);
    var corner = o.kind === 'shot' ? stack(p) : o.kind === 'photo' ? '' : ill(p);
    var notes = o.kind === 'shot' ? sides(p.shotNotes) : (p.notes || []);
    var extra = (o.kind === 'photo' ? ' t-' + (p.tone || 'light') : '') + (p.bleed && o.kind === 'cut' ? ' bleed-' + p.bleed : '') + (p.insetAt && o.kind === 'photo' ? ' inset-' + p.insetAt : '');
    return '<section class="board s-hero L-' + lay + ' k-' + o.kind + extra + (o.round ? ' is-round' : '') + '" data-id="' + p.id + '" data-slide="hero" id="b-' + p.id + '" aria-label="' + esc(plain(p.name)) + '">' +
      '<div class="frame">' +
        '<p class="num" aria-hidden="true"><span>' + pad(i) + '</span></p>' +
        '<div class="lede">' +
          '<p class="hook"><span>“' + esc(p.hook) + '”</span><svg class="chev" viewBox="0 0 12 22" aria-hidden="true"><path d="M11 1 1 11l10 10"/></svg></p>' +
          '<p class="desc">' + esc(p.sub) + '</p>' +
          (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') +
        '</div>' +
        corner + legend(notes) +
        '<div class="obj" data-kind="' + o.kind + '"' + (o.round ? ' data-round="1"' : '') + notesAttr(notes) + '><div class="obj-frame">' + objImg(o, { alt: plain(p.name), eager: opts.eager }) + '<span class="dots"></span></div></div>' +
        inset(p, o) +
        '<h2 class="name">' + lines(p.name) + '</h2>' +
        '<p class="brand">' + esc(p.brand) + '</p>' +
        '<p class="meta">' + esc(p.year) + ' · ' + esc(p.where) + '</p>' +
        '<span class="dash" aria-hidden="true"></span>' +
        '<svg class="leaders" aria-hidden="true"></svg><div class="labels" aria-hidden="true"></div>' +
      '</div></section>';
  }

  /* ── 2. Process slide: photos, sketches, a few lines ── */
  var ICON = {
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 17 7M9 7h8v8"/></svg>',
    code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>',
  };
  function fig(n, cap, k, cls, small) {
    var d = dims(n), v = isVid(n);
    var media = v
      ? '<video muted loop playsinline preload="none" poster="' + src(n) + '" width="' + d[0] + '" height="' + d[1] + '" data-src="media/v/' + n.slice(2) + '.mp4"></video><button class="vctl" aria-label="Play video">' + ICON.play + '</button>'
      : '<button class="zoom" data-zoom="' + n + '" aria-label="Enlarge: ' + esc(cap || 'figure') + '"><img src="' + src(n, small) + '" width="' + d[0] + '" height="' + d[1] + '" alt="' + esc(cap || '') + '" loading="lazy" decoding="async"></button>';
    return '<figure class="pf ' + (cls || '') + '" style="--i:' + k + ';--ar:' + d[0] + '/' + d[1] + '"><div class="pf-media">' + media + '</div>' +
      '<figcaption><b>' + pad(k + 1) + '</b>' + esc(cap || '') + (v ? '<em>Video</em>' : '') + '</figcaption></figure>';
  }
  function actions(p) {
    var a = '';
    if (p.live) a += '<a class="btn btn-solid" href="' + p.live + '" target="_blank" rel="noopener">Open the app' + ICON.out + '</a>';
    if (p.repo) a += '<a class="btn" href="' + p.repo + '" target="_blank" rel="noopener">Source code' + ICON.code + '</a>';
    return a ? '<div class="acts">' + a + '</div>' : '';
  }
  function runhead(p, i, label) {
    return '<p class="run"><b>' + pad(i) + '</b><span>' + esc(plain(p.name)) + '</span><i>' + esc(label) + '</i></p>';
  }
  function process(p, i, track, k) {
    var o = objectOf(p, track);
    // code: the screen itself, annotated
    if (o.kind === 'shot') {
      var rest = p.media.filter(function (n) { return n !== p.shot; }).slice(0, 3);
      return '<section class="board s-proc P-code' + (o.round ? ' is-round' : '') + '" data-id="' + p.id + '" data-slide="proc" aria-label="' + esc(plain(p.name)) + ', inside">' +
        '<div class="frame">' + runhead(p, i, 'Inside') +
          '<figure class="feat"><div class="feat-art"><img src="' + src(p.shot) + '" width="' + dims(p.shot)[0] + '" height="' + dims(p.shot)[1] + '" alt="' + esc(plain(p.name)) + ' screen" loading="lazy" decoding="async"></div></figure>' +
          '<div class="story">' +
            (p.story ? '<p class="story-t">' + esc(p.story) + '</p>' : '<p class="story-t">' + esc(p.sub) + '</p>') +
            '<ul class="chips">' + p.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
            actions(p) +
            (p.live ? '<button class="btn btn-run" data-run="' + p.id + '">Run it here' + ICON.play + '</button>' : '') +
          '</div>' +
          (rest.length ? '<div class="thumbs t' + rest.length + '">' + rest.map(function (n, j) { return fig(n, '', j + 1, '', true); }).join('') + '</div>' : '') +
          '<div class="live" hidden></div>' +
          '</div></section>';
    }
    var ph = (p.photos || []).slice(0, 5);
    if (!ph.length) return '';
    // shape decides the cell: tallest picture takes the tall cell, widest the wide one
    var rt = function (f) { var d = dims(f[0]); return d[0] / d[1]; };
    var fitFirst = ph.filter(function (f) { return f[2] === 'fit'; })[0];
    if (fitFirst) ph = [fitFirst].concat(ph.filter(function (f) { return f !== fitFirst; }));
    else if (ph.length >= 3) {
      var tall = ph.reduce(function (a, b) { return rt(b) < rt(a) ? b : a; });
      var rest2 = ph.filter(function (f) { return f !== tall; });
      if (ph.length === 4) { var wide = rest2.reduce(function (a, b) { return rt(b) > rt(a) ? b : a; }); rest2 = rest2.filter(function (f) { return f !== wide; }).concat([wide]); }
      ph = [tall].concat(rest2);
    }
    var flip = k % 2 === 1 ? ' is-flip' : '';
    if (fitFirst) flip = ' is-fitgrid';
    if (p.mosaic === 'alt') flip += ' P-alt';
    var allWide = ph.every(function (f) { return rt(f) > 1.3; });
    if (allWide && (ph.length === 2 || ph.length === 5)) flip += ' is-wide';
    if (allWide && ph.length === 3) { ph = [ph.reduce(function (a, b) { return rt(b) > rt(a) ? b : a; })].concat(ph.filter(function (f, j, arr) { return f !== arr.reduce(function (a, b) { return rt(b) > rt(a) ? b : a; }); })); flip += ' is-wide'; }
    return '<section class="board s-proc P-' + ph.length + flip + '" data-id="' + p.id + '" data-slide="proc" aria-label="' + esc(plain(p.name)) + ', process">' +
      '<div class="frame">' + runhead(p, i, 'Process') +
        '<div class="story">' +
          '<p class="story-t">' + esc(p.story || p.sub) + '</p>' +
          '<ul class="chips">' + p.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
          (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') +
          actions(p) +
          (o.kind === 'photo' ? ill(p) : '') +
        '</div>' +
        '<div class="mosaic">' + ph.map(function (f, j) { return fig(f[0], f[1], j, 'm' + j + (f[2] === 'fit' ? ' is-fit' : ''), j > 0); }).join('') + '</div>' +
      '</div></section>';
  }

  /* ── 3. Full photo, edge to edge ── */
  function full(p, i) {
    if (!p.full) return '';
    var n = p.full[0], d = dims(n), v = isVid(n);
    var m = v ? '<video muted loop playsinline preload="none" poster="' + src(n) + '" data-src="media/v/' + n.slice(2) + '.mp4"></video>'
      : '<img src="' + src(n) + '" width="' + d[0] + '" height="' + d[1] + '" alt="' + esc(p.full[1]) + '" loading="lazy" decoding="async">';
    return '<section class="board s-full" data-id="' + p.id + '" data-slide="full" aria-label="' + esc(plain(p.name)) + ', photo">' +
      '<figure class="full-media">' + m + '</figure>' +
      '<div class="full-cap">' + runhead(p, i, p.full[1]) + '</div>' +
    '</section>';
  }

  function slides(p, i, track, opts) { return hero(p, i, track, opts) + process(p, i, track, i) + full(p, i); }

  /* ── Cover ── */
  function cover(track, opts) {
    opts = opts || {};
    var T = P.tracks[track];
    return '<section class="board s-hero s-cover L-A k-cut" data-id="cover" data-slide="hero" id="b-cover" aria-label="Roy Borkin, ' + esc(T.role) + '">' +
      '<div class="frame">' +
        '<p class="num" aria-hidden="true"><span>00</span></p>' +
        '<div class="lede">' +
          '<h1 class="hook"><span>' + esc(T.hook) + '</span><svg class="chev" viewBox="0 0 12 22" aria-hidden="true"><path d="M11 1 1 11l10 10"/></svg></h1>' +
          '<p class="desc">' + esc(T.line) + '</p>' +
          (opts.noLink ? '' : '<a class="detail" href="#/' + track + '/about"><i></i>About &amp; CV</a>') +
        '</div>' +
        '<ul class="facts">' + T.facts.map(function (f, k) { return '<li style="--k:' + k + '"><i></i>' + esc(f) + '</li>'; }).join('') + '</ul>' +
        '<div class="obj"><div class="obj-frame">' + objImg({ kind: 'cut', name: 'me-illu' }, { alt: 'Roy Borkin, illustrated', eager: true }) + '</div></div>' +
        '<h2 class="name">' + lines('Roy\nBorkin') + '</h2>' +
        '<p class="brand">' + esc(T.role) + '</p>' +
        '<p class="meta contact">' +
          '<a href="tel:' + P.phone.replace(/[^+\d]/g, '') + '">' + esc(P.phone) + '</a>' +
          '<a href="mailto:' + P.email + '">' + esc(P.email) + '</a>' +
          '<a href="' + P.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>' +
          '<a href="' + P.instagram + '" target="_blank" rel="noopener">Instagram</a>' +
          '<a href="' + P.github + '" target="_blank" rel="noopener">GitHub</a>' +
        '</p>' +
        '<span class="dash" aria-hidden="true"></span>' +
      '</div></section>';
  }

  /* ── About / CV ── */
  function spec(track, n, opts) {
    opts = opts || {};
    var S = P.spec, T = P.tracks[track];
    var rows = function (arr) { return arr.map(function (r) { return '<div class="row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + (r[2] ? ' <i>' + esc(r[2]) + '</i>' : '') + '</dd></div>'; }).join(''); };
    var chips = function (arr) { return '<ul class="chips">' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    var pdf = 'pdf/Roy-Borkin-' + (track === 'id' ? 'Industrial-Design' : 'Programmer') + '.pdf';
    return '<section class="board is-spec" id="b-about" data-id="about" data-slide="hero" aria-label="About Roy Borkin">' +
      '<div class="frame">' +
        '<p class="num" aria-hidden="true"><span>' + (opts.print ? 'CV' : pad(n)) + '</span></p>' +
        '<div class="panel panel-l">' +
          '<div class="about-p"><h3>About</h3><p>' + esc(S.about[track]) + '</p></div>' +
          '<div><h3>Experience <small>13 years</small></h3><dl>' + rows(S.experience) + '</dl></div>' +
        '</div>' +
        '<div class="obj"><div class="obj-frame"><img class="obj-img" src="media/hero/me.webp" width="' + HERO.me[0] + '" height="' + HERO.me[1] + '" alt="Roy Borkin" loading="lazy"></div></div>' +
        '<div class="panel panel-r">' +
          '<div><h3>Education</h3><dl>' + S.education.map(function (r) { return '<div class="row edu"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
          '<div><h3>Certifications</h3><dl>' + S.certs.map(function (r) { return '<div class="row cert"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
          (opts.print ? '' : '<div class="cv-more"><button class="btn btn-solid" data-pop="skills">Skills</button><button class="btn" data-pop="recognition">Recognition</button></div>') +
        '</div>' +
        '<div class="contact-row">' +
          '<a class="btn btn-solid" href="mailto:' + P.email + '">' + P.email + '</a>' +
          '<a class="btn" href="tel:' + P.phone.replace(/[^+\d]/g, '') + '">' + P.phone + '</a>' +
          '<a class="btn" href="' + P.website + '" target="_blank" rel="noopener">' + (opts.print ? 'royborkin.github.io' : 'Website' + ICON.out) + '</a>' +
          '<a class="btn" href="' + P.linkedin + '" target="_blank" rel="noopener">' + (opts.print ? 'linkedin.com/in/royborkin' : 'LinkedIn' + ICON.out) + '</a>' +
          '<a class="btn" href="' + P.github + '" target="_blank" rel="noopener">' + (opts.print ? 'github.com/RoyBorkin' : 'GitHub' + ICON.out) + '</a>' +
          '<a class="btn" href="' + P.instagram + '" target="_blank" rel="noopener">' + (opts.print ? 'instagram.com/royborkin' : 'Instagram' + ICON.out) + '</a>' +
          (opts.print ? '<a class="btn" href="' + P.site + '">royborkin.github.io/Portfolio</a>' : '<a class="btn" href="' + pdf + '" download>PDF portfolio</a>') +
        '</div>' +
        '<p class="brand">' + esc(T.role) + '</p>' +
        '<span class="dash" aria-hidden="true"></span>' +
      '</div></section>';
  }

  /* ── Skills & recognition: a pop-up on the site, its own page in the PDF ── */
  function skillsHTML(track) {
    var S = P.spec;
    return '<div class="sk-grid">' + S.skillOrder[track].map(function (k) {
      return '<section class="sk"><h4>' + esc(k) + '</h4><ul>' + S.skills[k].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    }).join('') + '</div>';
  }
  function recogHTML() {
    return '<ul class="rec">' + P.spec.awards.map(function (a) { return '<li><i></i>' + esc(a) + '</li>'; }).join('') + '</ul>';
  }
  function skillsPage(track) {
    return '<section class="board is-skills" data-id="skills" aria-label="Skills and recognition"><div class="frame">' +
      '<p class="num" aria-hidden="true"><span>CV</span></p>' +
      '<div class="sk-page"><h3>Skills</h3>' + skillsHTML(track) + '</div>' +
      '<div class="rec-page"><h3>Recognition</h3>' + recogHTML() + '</div>' +
      '<p class="brand">' + esc(P.tracks[track].role) + '</p><span class="dash" aria-hidden="true"></span>' +
    '</div></section>';
  }

  /* ── Callouts on the hero: label outside, leader stops at the object's edge, arrow points in ── */
  function picRect(obj) {
    var im = obj.querySelector('img'); if (!im) return null;
    var B = im.getBoundingClientRect(), w = im.naturalWidth || +im.getAttribute('width'), h = im.naturalHeight || +im.getAttribute('height');
    if (obj.dataset.kind === 'photo' && w && h) { var s = Math.max(B.width / w, B.height / h), dw = w * s, dh = h * s; return { left: B.left + (B.width - dw) / 2, top: B.top + (B.height - dh) / 2, width: dw, height: dh }; }
    return { left: B.left, top: B.top, width: B.width, height: B.height };
  }
  function edgeOf(n, round) {
    if (n.length >= 6) return [n[4], n[5]];
    var x = n[1], y = n[2], s = n[3];
    if (round) { var dy = y - 0.5, dx = x - 0.5, r = 0.5;
      if (s === 'l' || s === 'r') { var q = Math.sqrt(Math.max(0, r * r - dy * dy)); return [s === 'l' ? 0.5 - q : 0.5 + q, y]; }
      var q2 = Math.sqrt(Math.max(0, r * r - dx * dx)); return [x, s === 't' ? 0.5 - q2 : 0.5 + q2]; }
    return s === 'l' ? [0, y] : s === 'r' ? [1, y] : s === 't' ? [x, 0] : [x, 1];
  }
  function layout(b) {
    var svg = b.querySelector('.leaders'), box = b.querySelector('.labels'), frame = b.querySelector('.frame');
    if (!svg || !box) return;
    svg.innerHTML = ''; box.innerHTML = '';
    var F = frame.getBoundingClientRect(), W = F.width, H = F.height, ln = '', html = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    var compact = W < 760 || getComputedStyle(svg).display === 'none';
    // measured drawing: dimension lines
    var art = b.querySelector('.ill-art[data-dims]');
    if (art && !compact) {
      var m = art.querySelector('svg,img'), A = art.getBoundingClientRect(), vw = +(m.dataset.w || m.naturalWidth || m.getAttribute('width')), vh = +(m.dataset.h || m.naturalHeight || m.getAttribute('height'));
      var sc = Math.min(A.width / vw, A.height / vh), rw = vw * sc, rh = vh * sc, x0 = A.left - F.left + (A.width - rw) / 2, y0 = A.top - F.top + (A.height - rh) / 2, D = JSON.parse(art.dataset.dims);
      ln += '<polyline class="dm" points="' + x0 + ',' + (y0 - 14) + ' ' + (x0 + rw) + ',' + (y0 - 14) + '"/><polyline class="dm" points="' + x0 + ',' + (y0 - 20) + ' ' + x0 + ',' + (y0 - 8) + '"/><polyline class="dm" points="' + (x0 + rw) + ',' + (y0 - 20) + ' ' + (x0 + rw) + ',' + (y0 - 8) + '"/>';
      html += '<span class="dim" style="left:' + (x0 + rw / 2) + 'px;top:' + (y0 - 30) + 'px">' + esc(D.w) + '</span>';
      var xs = x0 + rw + 14;
      ln += '<polyline class="dm" points="' + xs + ',' + y0 + ' ' + xs + ',' + (y0 + rh) + '"/><polyline class="dm" points="' + (xs - 6) + ',' + y0 + ' ' + (xs + 6) + ',' + y0 + '"/><polyline class="dm" points="' + (xs - 6) + ',' + (y0 + rh) + ' ' + (xs + 6) + ',' + (y0 + rh) + '"/>';
      html += '<span class="dim dim-v" style="left:' + (xs + 12) + 'px;top:' + (y0 + rh / 2) + 'px">' + esc(D.h) + '</span>';
    }
    var obj = b.querySelector('.obj[data-notes]'), notes = [];
    if (obj) { try { notes = JSON.parse(obj.dataset.notes || '[]'); } catch (e) {} }
    var R = obj && notes.length ? picRect(obj) : null, dots = obj ? obj.querySelector('.dots') : null;
    if (dots) dots.innerHTML = '';
    if (!R || R.width < 10) { svg.innerHTML = ln; box.innerHTML = html; return; }
    var round = !!obj.dataset.round, gap = Math.max(30, W * 0.028), D2 = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
    var pts = notes.map(function (n, k) {
      var e = edgeOf(n, round), s = n[3] || 'r', d = D2[s];
      var ex = R.left - F.left + e[0] * R.width, ey = R.top - F.top + e[1] * R.height;
      ex = Math.max(8, Math.min(W - 8, ex)); ey = Math.max(8, Math.min(H - 8, ey));
      return { k: k, t: n[0], s: s, d: d, ex: ex, ey: ey, ax: ex + d[0] * gap, ay: ey + d[1] * gap };
    });
    // mobile: numbered marks at the object's edge
    if (compact) {
      if (dots) { var o = obj.querySelector('img').getBoundingClientRect(); pts.forEach(function (p) { dots.insertAdjacentHTML('beforeend', '<span style="left:' + (p.ex + F.left - o.left) + 'px;top:' + (p.ey + F.top - o.top) + 'px">' + (p.k + 1) + '</span>'); }); }
      svg.innerHTML = ln; box.innerHTML = html; return;
    }
    // keep labels apart: sides in columns, top/bottom in rows
    ['l', 'r'].forEach(function (s) {
      var arr = pts.filter(function (p) { return p.s === s; }).sort(function (a, c) { return a.ay - c.ay; }), last = -1e9;
      arr.forEach(function (p) { p.ly = Math.max(p.ay, last + 28, 70); last = p.ly; });
      var over = last - (H - 44); if (over > 0) arr.forEach(function (p) { p.ly -= over; });
      var col = s === 'l' ? Math.min.apply(null, arr.map(function (p) { return p.ax; }).concat([1e9])) : Math.max.apply(null, arr.map(function (p) { return p.ax; }).concat([-1e9]));
      arr.forEach(function (p) {
        p.lx = s === 'l' ? Math.max(col, 150) : Math.min(col, W - 150);
        var bx = p.lx + (s === 'l' ? 14 : -14), bend = Math.abs(p.ly - p.ey) < 1 ? '' : bx + ',' + p.ly + ' ';
        ln += '<polyline class="ld" points="' + p.lx + ',' + p.ly + ' ' + bend + p.ex + ',' + p.ey + '" pathLength="1" style="--k:' + p.k + '"/>' + arrow(bend ? bx : p.lx, p.ly, p.ex, p.ey, p.k);
        html += '<span class="lab lab-' + s + '" style="' + (s === 'l' ? 'right:' + (W - p.lx + 8) : 'left:' + (p.lx + 8)) + 'px;top:' + p.ly + 'px;--k:' + p.k + '">' + esc(p.t) + '</span>';
      });
    });
    ['t', 'b'].forEach(function (s) {
      var arr = pts.filter(function (p) { return p.s === s; }).sort(function (a, c) { return a.ax - c.ax; }); if (!arr.length) return;
      var row = s === 't' ? Math.max(76, Math.min.apply(null, arr.map(function (p) { return p.ay; }))) : Math.min(H - 40, Math.max.apply(null, arr.map(function (p) { return p.ay; })));
      box.innerHTML = arr.map(function (p) { return '<span class="lab lab-' + s + '" style="left:' + p.ax + 'px;top:' + row + 'px">' + esc(p.t) + '</span>'; }).join('');
      var ws = Array.prototype.map.call(box.children, function (el) { return el.getBoundingClientRect().width; }), edge = -1e9;
      arr.forEach(function (p, j) { var l = Math.max(p.ax - ws[j] / 2, edge + 18, 14); p.lx = l + ws[j] / 2; edge = l + ws[j]; });
      var over = edge - (W - 60); if (over > 0) arr.forEach(function (p) { p.lx -= over; });
      arr.forEach(function (p) {
        var y0 = row + (s === 't' ? 10 : -10), mid = p.lx === p.ex ? '' : p.lx + ',' + (y0 + (p.ey - y0) * 0.45) + ' ';
        ln += '<polyline class="ld" points="' + p.lx + ',' + y0 + ' ' + mid + p.ex + ',' + p.ey + '" pathLength="1" style="--k:' + p.k + '"/>' + arrow(p.lx, y0 + (p.ey - y0) * 0.45, p.ex, p.ey, p.k);
        html += '<span class="lab lab-' + s + '" style="left:' + p.lx + 'px;top:' + row + 'px;--k:' + p.k + '">' + esc(p.t) + '</span>';
      });
    });
    svg.innerHTML = ln; box.innerHTML = html;
  }
  function arrow(x1, y1, x2, y2, k) {
    var a = Math.atan2(y2 - y1, x2 - x1), s = 7, w = 0.45;
    var p1 = [x2 - s * Math.cos(a - w), y2 - s * Math.sin(a - w)], p2 = [x2 - s * Math.cos(a + w), y2 - s * Math.sin(a + w)];
    return '<polyline class="ah" style="--k:' + k + '" points="' + p1.join(',') + ' ' + x2 + ',' + y2 + ' ' + p2.join(',') + '"/>';
  }

  /* page numbers, bottom right; the first page has none */
  function number(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.board'), function (b, k) {
      var old = b.querySelector('.pno'); if (old) old.remove();
      if (k > 0) b.insertAdjacentHTML('beforeend', '<span class="pno" aria-hidden="true">' + pad(k + 1) + '</span>');
    });
  }

  g.Board = { number: number, skillsHTML: skillsHTML, recogHTML: recogHTML, skillsPage: skillsPage, slides: slides, hero: hero, process: process, full: full, cover: cover, spec: spec, layout: layout, list: list, objectOf: objectOf, esc: esc, pad: pad, src: src, dims: dims, isVid: isVid, plain: plain, ICON: ICON };
})(window);
