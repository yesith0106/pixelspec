/* Live hero mockup: a scripted PixelSpec session on a skeleton analytics app, in real HTML.
 * Hover (name + size) → measure → click (specs + note) → marker, twice → copy, showing the compact text the agent gets.
 * Pauses off screen. With reduced motion it shows one finished frame instead. */
(function () {
  'use strict';
  var root = document.getElementById('mock');
  if (!root) return;
  var stage = root.querySelector('.stage');
  var W = 720, H = 400;
  var q = function (s) { return root.querySelector(s); };

  /* scale the fixed-size stage to the window width */
  function fit() { stage.style.transform = 'scale(' + root.clientWidth / W + ')'; }
  new ResizeObserver(fit).observe(root);
  fit();

  /* geometry in stage units */
  function box(el) {
    var x = 0, y = 0, e = el;
    while (e && e !== stage) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function put(el, b, r) {
    el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; el.style.width = b.w + 'px'; el.style.height = b.h + 'px';
    el.style.borderRadius = (r || 12) + 'px';
  }
  var on = function (el, v) { el.classList.toggle('on', v !== false); };

  var cur = q('.m-cur'), ripple = q('.m-click'), hov = q('.o-hov'), tag = q('.o-tag'), sel = q('.o-sel'), size = q('.o-size'),
    rl = q('.o-rl'), note = q('.o-note'), typed = q('.n-typed'), marks = q('.o-marks'), badge = q('.o-badge'),
    copyBtn = q('.o-copy'), toast = q('.o-toast'), toastMsg = q('.t-msg'), clip = q('.o-clip');

  var T = {
    chart: { el: q('#m-chart'), name: 'div.chart', tag: 'div', cls: '.chart', path: 'main>div.grid>div.chart', pad: '16', fill: '#131416', rad: 12, note: 'Give the bars more room' },
    s1: { el: q('#m-s1'), name: 'div.stat' },
    btn: { el: q('#m-btn'), name: 'button.primary', tag: 'button', cls: '.primary', path: 'main>header>button.primary', fill: '#0D99FF', rad: 8, note: 'Label this “Export report”', r: 8 },
  };

  /* ---------- timeline plumbing */
  var run = 0, visible = true;
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.15 }).observe(root);
  function wait(ms, id) {
    return new Promise(function (res, rej) {
      var left = ms, last = performance.now();
      (function tick(now) {
        if (id !== run) return rej('stop');
        now = now || performance.now();
        if (visible && !document.hidden) left -= now - last;
        last = now;
        if (left <= 0) res(); else requestAnimationFrame(tick);
      })(last);
    });
  }
  var cx = 0, cy = 0;
  function move(x, y, ms, id) {
    cur.style.transitionDuration = ms + 'ms';
    cur.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    cx = x; cy = y;
    return wait(ms + 40, id);
  }
  function moveTo(el, fx, fy, ms, id) { var b = box(el); return move(b.x + b.w * fx, b.y + b.h * fy, ms, id); }
  function tap() {
    ripple.style.left = cx + 'px'; ripple.style.top = cy + 'px';
    ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go');
  }

  /* ---------- overlay pieces */
  function hover(t, withTag) {
    if (!t) { on(hov, false); on(tag, false); return; }
    var b = box(t.el);
    put(hov, b, t.r); on(hov);
    if (withTag === false) { on(tag, false); return; }
    tag.innerHTML = t.name + '<span>' + b.w + ' × ' + b.h + '</span>';
    tag.style.left = b.x + 'px'; tag.style.top = (b.y - 26 < 4 ? b.y + b.h + 6 : b.y - 26) + 'px'; on(tag);
  }
  function select(t) {
    if (!t) { on(sel, false); on(size, false); on(note, false); return; }
    var b = box(t.el);
    put(sel, b, t.r); on(sel);
    size.textContent = b.w + ' × ' + b.h;
    size.style.left = (b.x + b.w / 2) + 'px'; size.style.top = (b.y + b.h + 7) + 'px'; on(size);
    q('.n-tag').textContent = t.tag; q('.n-sel').textContent = t.cls;
    q('.n-specs').innerHTML =
      '<div class="n-sr"><span>Size</span><b>' + b.w + ' × ' + b.h + '</b></div>' +
      (t.pad ? '<div class="n-sr"><span>Spacing</span><b><em>Padding</em>' + t.pad + '</b></div>' : '') +
      '<div class="n-sr"><span>Color</span><b><i style="background:' + t.fill + '"></i><em>Fill</em>' + t.fill + '</b></div>' +
      '<div class="n-sr"><span>Style</span><b><em>Radius</em>' + t.rad + '</b></div>';
    typed.textContent = ''; note.classList.remove('has');
    // beside the element if it fits, otherwise below it, kept inside the stage
    var NW = 240, x = b.x + b.w + 12, y = b.y;
    if (x + NW > W - 8) { x = W - NW - 10; y = b.y + b.h + 30 + 200 < H - 60 ? b.y + b.h + 30 : b.y + 14; }
    note.style.left = x + 'px'; note.style.top = y + 'px';
    on(note);
  }
  // horizontal redline from the right edge of a to the left edge of c
  function redline(a, c) {
    if (!a) { on(rl, false); return; }
    var A = box(a.el), C = box(c.el), x1 = A.x + A.w, x2 = C.x, y = C.y + C.h / 2;
    rl.style.left = x1 + 'px'; rl.style.top = y + 'px'; rl.style.width = (x2 - x1) + 'px';
    rl.querySelector('span').textContent = Math.round(x2 - x1);
    on(rl);
  }
  async function type(text, id) {
    note.classList.add('has');
    for (var i = 1; i <= text.length; i++) { typed.textContent = text.slice(0, i); await wait(40 + (text[i - 1] === ' ' ? 40 : 0), id); }
  }
  function mark(t, n) {
    var b = box(t.el), m = document.createElement('span');
    m.className = 'o-mark'; m.textContent = n;
    m.style.left = (b.x + b.w - 12) + 'px'; m.style.top = (b.y - 8) + 'px';
    marks.appendChild(m);
    badge.textContent = n; on(badge);
  }
  // the compact text PixelSpec copies for the agent, built from the live geometry
  function compact() {
    var line = function (n, t) {
      var b = box(t.el);
      return '<span class="t">' + n + '. ' + t.note + '</span>\n   <span class="s">' + t.path + '</span>\n   <span class="n">' + b.w + '×' + b.h + '</span>' +
        (t.pad ? ' p:' + t.pad : '') + ' r:' + t.rad + ' | bg:' + t.fill;
    };
    return '<span class="h">UI feedback for /analytics (1440×900):</span>\n' + line(1, T.chart) + '\n' + line(2, T.btn);
  }
  function say(msg) { toastMsg.textContent = msg; on(toast); }
  function reset() {
    hover(); select(); redline(); marks.innerHTML = ''; on(badge, false); on(toast, false); on(clip, false); copyBtn.classList.remove('ok');
    root.classList.remove('fade');
  }
  function park() { cur.style.transitionDuration = '0ms'; cx = W * 0.45; cy = H + 24; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; }

  // End of a round: the toast and markers fade out while the cursor keeps moving, so the loop never blanks.
  async function clear(id) {
    on(toast, false); on(clip, false); on(badge, false); copyBtn.classList.remove('ok');
    marks.classList.add('clearing'); await wait(400, id);
    marks.innerHTML = ''; marks.classList.remove('clearing');
  }

  /* ---------- the script (loops seamlessly: each round starts from wherever the cursor is) */
  async function play(id, first) {
    if (first) { reset(); park(); await wait(400, id); }
    // 1. hover the chart: name and size
    await moveTo(T.chart.el, 0.45, 0.4, 900, id); hover(T.chart); await wait(1000, id);
    // 2. hover a stat card: the gap to the chart (the redline is the label while measuring)
    await moveTo(T.s1.el, 0.5, 0.55, 700, id); hover(T.s1, false); redline(T.chart, T.s1); await wait(1400, id);
    redline();
    // 3. click the chart and leave a note
    await moveTo(T.chart.el, 0.4, 0.55, 700, id); hover(T.chart); await wait(200, id);
    tap(); hover(); select(T.chart); await wait(450, id);
    await type(T.chart.note, id); await wait(250, id);
    await moveTo(q('.n-send'), 0.5, 0.5, 450, id); tap(); select(); mark(T.chart, 1); say('Feedback 1 added'); await wait(900, id); on(toast, false);
    // 4. second note on the primary button
    await moveTo(T.btn.el, 0.5, 0.55, 800, id); hover(T.btn); await wait(500, id);
    tap(); hover(); select(T.btn); await wait(400, id);
    await type(T.btn.note, id); await wait(250, id);
    await moveTo(q('.n-send'), 0.5, 0.5, 450, id); tap(); select(); mark(T.btn, 2); say('Feedback 2 added'); await wait(900, id); on(toast, false);
    // 5. copy everything for the agent
    await moveTo(copyBtn, 0.5, 0.5, 900, id); await wait(200, id);
    tap(); copyBtn.classList.add('ok'); say('Copied 2 feedback (compact). Paste it into your agent.');
    q('.c-body').innerHTML = compact(); await wait(250, id); on(clip); await wait(3400, id);
    // 6. glide back into the page while the round clears
    move(W * 0.42, H * 0.62, 1100, id); await clear(id); await wait(700, id);
  }
  async function loop() {
    var id = ++run;
    try { for (var first = true; ; first = false) await play(id, first); } catch (e) { /* stopped */ }
  }

  /* reduced motion: one finished frame */
  function still() {
    run++; reset();
    mark(T.btn, 1); select(T.chart); note.classList.add('has'); typed.textContent = T.chart.note;
    var b = box(T.chart.el); cur.style.transitionDuration = '0ms'; cur.style.transform = 'translate(' + (b.x + b.w * 0.5) + 'px,' + (b.y + b.h * 0.5) + 'px)';
  }
  var rm = matchMedia('(prefers-reduced-motion: reduce)');
  function start() { if (rm.matches) still(); else loop(); }
  rm.addEventListener('change', start);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
