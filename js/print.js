/* PDF book: print.html?t=id|code — the same slides as the site, one per 1600 × 900 page. */
(function () {
  'use strict';
  var B = window.Board, P = window.PROFILE, esc = B.esc, pad = B.pad;
  var q = new URLSearchParams(location.search), track = q.get('t') === 'code' ? 'code' : 'id';
  document.documentElement.dataset.track = track;
  var T = P.tracks[track], items = B.list(track), pages = [];

  pages.push(B.cover(track, { noLink: true }));
  pages.push('<section class="board pg-index"><div class="frame"><p class="num"><span>' + T.tag + '</span></p><ol>' + items.map(function (p, i) {
    return '<li><a href="#b-' + p.id + '"><span>' + pad(i + 1) + '</span><b>' + esc(B.plain(p.name)) + '</b><i>' + esc(p.year) + '</i></a></li>';
  }).join('') + '</ol><h2 class="ttl">Works</h2><p class="brand">' + esc(T.label) + '</p><span class="dash"></span></div></section>');
  items.forEach(function (p, i) { pages.push(B.slides(p, i + 1, track, { eager: true })); });
  pages.push(B.spec(track, 0, { print: true }));
  pages.push(B.skillsPage(track));

  var book = document.getElementById('book');
  book.innerHTML = pages.join('');
  B.number(book);
  // print: no live buttons, no video controls; links stay
  book.querySelectorAll('.btn-run, .vctl, .live').forEach(function (n) { n.remove(); });
  book.querySelectorAll('video').forEach(function (v) { var im = document.createElement('img'); im.src = v.getAttribute('poster'); im.alt = ''; v.replaceWith(im); });
  var boards = book.querySelectorAll('.board');
  boards.forEach(function (b) { b.classList.add('is-drawn'); });
  var imgs = Array.prototype.slice.call(document.images);
  imgs.forEach(function (im) { im.loading = 'eager'; });
  Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }))
    .then(function () { return document.fonts.ready; })
    .then(function () { boards.forEach(B.layout); document.body.dataset.ready = '1'; });
})();
