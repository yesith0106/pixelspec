/*
 * PixelSpec brand engine.
 * Bitmap type, logo, pixel icons and the generative backgrounds (blueprint grid,
 * pixel dissolve, halftone field). No dependencies. Exposes window.PX.
 *
 * Markup hooks (rendered by PX.hydrate()):
 *   <span data-px-text="SHIP IT" data-shape="dot"></span>   bitmap text (5x7 caps)
 *   <span data-px-logo="wordmark|mark|lockup"></span>
 *   <span data-px-icon="spacing"></span>
 *   <canvas data-px-bg="blueprint|dissolve|halftone"></canvas>
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ noise */

  function hash2(x, y, seed) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    const u = s(xf), v = s(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, oct = 4) {
    let t = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { t += amp * vnoise(x * f, y * f, seed + i * 17); norm += amp; f *= 2; amp *= 0.5; }
    return t / norm;
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssVar = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();

  /* ------------------------------------------------------------- bitmap type */
  // '#' = ink, '*' = accent (signal blue), '.' = off. Rows top to bottom.

  const CAPS = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    ' ': ['...', '...', '...', '...', '...', '...', '...'],
    '.': ['.', '.', '.', '.', '.', '.', '#'],
    '*': ['.', '.', '.', '.', '.', '.', '*'],
    ',': ['..', '..', '..', '..', '..', '.#', '#.'],
    ':': ['.', '.', '#', '.', '.', '#', '.'],
    '!': ['#', '#', '#', '#', '#', '.', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    "'": ['#', '#', '.', '.', '.', '.', '.'],
    '-': ['....', '....', '....', '####', '....', '....', '....'],
    '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
    '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
    '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
    '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
    '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
    '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.####'],
    '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
    '(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
    ')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
    '[': ['###', '#..', '#..', '#..', '#..', '#..', '###'],
    ']': ['###', '..#', '..#', '..#', '..#', '..#', '###'],
  };

  // Lowercase set for the wordmark. 9 rows: 2 ascender, 5 x-height, 2 descender.
  // The dot of the i is the signal pixel.
  const LOWER = {
    p: ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
    i: ['*', '.', '#', '#', '#', '#', '#', '.', '.'],
    x: ['....', '....', '#..#', '#..#', '.##.', '#..#', '#..#', '....', '....'],
    e: ['....', '....', '.##.', '#..#', '####', '#...', '.###', '....', '....'],
    l: ['#', '#', '#', '#', '#', '#', '#', '.', '.'],
    s: ['....', '....', '.###', '#...', '.##.', '...#', '###.', '....', '....'],
    c: ['....', '....', '.###', '#...', '#...', '#...', '.###', '....', '....'],
  };

  // The mark: a focus frame. Four signal-blue corner brackets select one pixel. 8x8.
  // '*' cells (the frame) take the accent color, '#' (the pixel) takes the fill.
  const MARK = ['***..***', '*......*', '*......*', '...##...', '...##...', '*......*', '*......*', '***..***'];

  // Bold caps for the wordmark: each glyph smeared one pixel to the right (classic bitmap bold).
  const BOLD = {};
  for (const k in CAPS) {
    BOLD[k] = CAPS[k].map((row) => {
      let out = '';
      for (let i = 0; i <= row.length; i++) {
        const on = (c) => c === '#' || c === '*';
        out += on(row[i]) || on(row[i - 1]) ? (row[i] === '*' || row[i - 1] === '*' ? '*' : '#') : '.';
      }
      return out;
    });
  }
  BOLD[' '] = CAPS[' '];

  // 11x11 pixel icons.
  const ICONS = {
    spacing: ['#.#.#.#.#.#', '...........', '#.#######.#', '..#.....#..', '#.#.***.#.#', '..#.*.*.#..', '#.#.***.#.#', '..#.....#..', '#.#######.#', '...........', '#.#.#.#.#.#'],
    redline: ['...........', '#.........#', '#.........#', '#.*.....*.#', '#.**...**.#', '#*********#', '#.**...**.#', '#.*.....*.#', '#.........#', '#.........#', '...........'],
    type: ['###########', '#....#....#', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '....###....', '...........'],
    color: ['.....#.....', '....###....', '...#####...', '..#######..', '.##*######.', '##*########', '##*########', '###*#######', '.#########.', '..#######..', '....###....'],
    contrast: ['...#####...', '..#..****..', '.#...*****.', '#....******', '#....******', '#....******', '#....******', '#....******', '.#...*****.', '..#..****..', '...#####...'],
    component: ['...........', '...........', '...#..**...', '..#...*.#..', '.#...*...#.', '#....*....#', '.#...*...#.', '..#.*...#..', '...#*..#...', '...........', '...........'],
    feedback: ['.#########.', '#.........#', '#.*******.#', '#.........#', '#.*****...#', '#.........#', '.###.#####.', '...#.#.....', '...##......', '...#.......', '...........'],
    ai: ['.....*.....', '.....*.....', '.....*.....', '....***....', '..*******..', '***********', '..*******..', '....***....', '.....*.....', '.....*.....', '.....*.....'],
    cursor: ['#..........', '##.........', '#*#........', '#**#.......', '#***#......', '#****#.....', '#*****#....', '#**####....', '#*#.#*#....', '##..##*#...', '.....##....'],
    guides: ['.....#.....', '.....#.....', '.....#.....', '...........', '...........', '###..*..###', '...........', '...........', '.....#.....', '.....#.....', '.....#.....'],
    shadow: ['....#######', '....#.....#', '....#.....#', '....#.....#', '*******...#', '*******...#', '###########', '*******....', '*******....', '*******....', '*******....'],
    copy: ['...#######.', '...#.....#.', '...#.....#.', '#######..#.', '#.....#..#.', '#.***.#..#.', '#.....####.', '#.***.#....', '#.....#....', '#######....', '...........'],
    pause: ['...........', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '.###...###.', '...........'],
    zero: ['...#####...', '..#.....#..', '.#......*#.', '#......*..#', '#.....*...#', '#....*....#', '#...*.....#', '#..*......#', '.#*......#.', '..#.....#..', '...#####...'],
    bolt: ['......####.', '.....####..', '....####...', '...####....', '..#######..', '.......##..', '......##...', '.....##....', '....##.....', '...##......', '..#........'],
    check: ['...........', '...........', '.........##', '........##.', '.......##..', '##....##...', '.##..##....', '..####.....', '...##......', '...........', '...........'],
    arrow: ['...........', '......#....', '......##...', '......###..', '#########..', '##########.', '#########..', '......###..', '......##...', '......#....', '...........'],
    github: ['...#####...', '.#########.', '.##.###.##.', '###########', '###.....###', '##.......##', '##.......##', '###.....###', '.#.##.####.', '..##...###.', '...#...##..'],
    ruler: ['...........', '...........', '###########', '#.*.*.*.*.#', '#.*...*...#', '#.*...*...#', '#.........#', '#.........#', '###########', '...........', '...........'],
    plus: ['...........', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '.#########.', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '...........'],
    // Toolbar set (product). Drawn for 22px, exactly 2x.
    play: ['...........', '...#.......', '...##......', '...###.....', '...####....', '...#####...', '...####....', '...###.....', '...##......', '...#.......', '...........'],
    eye: ['...........', '...........', '...#####...', '.##.....##.', '#...***...#', '#...***...#', '#...***...#', '.##.....##.', '...#####...', '...........', '...........'],
    eyeOff: ['...........', '...........', '...........', '#.........#', '.##.....##.', '...#####...', '..#..#..#..', '.#...#...#.', '...........', '...........', '...........'],
    trash: ['....###....', '###########', '...........', '.#########.', '.#..#.#..#.', '.#..#.#..#.', '.#..#.#..#.', '.#..#.#..#.', '.#..#.#..#.', '.#########.', '...........'],
    settings: ['.***.......', '#***#######', '.***.......', '...........', '.......***.', '#######***#', '.......***.', '...........', '....***....', '####***####', '....***....'],
    close: ['...........', '.#.......#.', '..#.....#..', '...#...#...', '....#.#....', '.....#.....', '....#.#....', '...#...#...', '..#.....#..', '.#.......#.', '...........'],
  };

  // Giant cursor for illustrations ('#' outline, '*' fill).
  const BIG_CURSOR = [
    '#...........', '##..........', '#*#.........', '#**#........', '#***#.......', '#****#......', '#*****#.....',
    '#******#....', '#*******#...', '#********#..', '#*****#####.', '#**#**#.....', '#*#.#**#....', '##..#**#....',
    '#....#**#...', '.....#**#...', '......#**#..', '......#**#..', '.......##...',
  ];

  function layout(text, font, tracking = 1) {
    const rowsN = font === LOWER ? 9 : 7;
    const caps = font === CAPS || font === BOLD;
    const cells = [];
    let x = 0;
    const chars = [...String(text)];
    chars.forEach((ch, i) => {
      const key = caps ? ch.toUpperCase() : ch;
      const g = font[key] || font[ch] || (caps ? font['?'] : null);
      if (!g) return;
      g.forEach((row, y) => {
        [...row].forEach((c, gx) => { if (c !== '.') cells.push([x + gx, y, c === '*' ? 1 : 0]); });
      });
      x += g[0].length + (i < chars.length - 1 ? tracking : 0);
    });
    return { w: x, h: rowsN, cells };
  }

  function grid(rows) {
    const cells = [];
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') cells.push([x, y, c === '*' ? 1 : 0]); }));
    return { w: rows[0].length, h: rows.length, cells };
  }

  /**
   * Render a cell set as SVG. 1 viewBox unit = 1 pixel cell, so size it with CSS.
   * shape: square | dot | ring | plus | cross
   * gap: 0..0.6 fraction of a cell left empty between pixels.
   */
  function svg(bm, o = {}) {
    const shape = o.shape || 'square';
    const gap = o.gap != null ? +o.gap : shape === 'square' ? 0 : 0.14;
    const fill = o.fill || 'currentColor';
    const accent = o.accent || 'var(--signal, #0D99FF)';
    const pad = o.pad || 0;
    const seam = shape === 'square' && !gap ? 0.04 : 0;
    const s = 1 - gap + seam, off = gap / 2 - seam / 2;
    const r = (n) => +n.toFixed(3);
    let a = '', b = '';
    for (const [x, y, k] of bm.cells) {
      let el;
      const X = x + pad, Y = y + pad;
      if (shape === 'dot') el = `<circle cx="${r(X + 0.5)}" cy="${r(Y + 0.5)}" r="${r(s / 2)}"/>`;
      else if (shape === 'ring') el = `<circle cx="${r(X + 0.5)}" cy="${r(Y + 0.5)}" r="${r(s / 2 - 0.09)}"/>`;
      else if (shape === 'plus') el = `<path d="M${r(X + 0.5)} ${r(Y + off)}V${r(Y + 1 - off)}M${r(X + off)} ${r(Y + 0.5)}H${r(X + 1 - off)}"/>`;
      else if (shape === 'cross') el = `<path d="M${r(X + off)} ${r(Y + off)}L${r(X + 1 - off)} ${r(Y + 1 - off)}M${r(X + 1 - off)} ${r(Y + off)}L${r(X + off)} ${r(Y + 1 - off)}"/>`;
      else el = `<rect x="${r(X + off)}" y="${r(Y + off)}" width="${r(s)}" height="${r(s)}"/>`;
      if (k && !o.mono) b += el; else a += el;
    }
    const W = bm.w + pad * 2, H = bm.h + pad * 2;
    const stroked = shape === 'ring' || shape === 'plus' || shape === 'cross';
    const paint = (c) => (stroked ? `fill="none" stroke="${c}" stroke-width="${shape === 'ring' ? 0.18 : 0.22}"` : `fill="${c}"`);
    const label = o.title ? `<title>${String(o.title).replace(/[<&]/g, '')}</title>` : '';
    const attrs = o.title ? `role="img" aria-label="${String(o.title).replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${attrs} class="${o.className || 'px-svg'}"${shape === 'square' && !gap ? ' shape-rendering="crispEdges"' : ''}>${label}<g ${paint(fill)}>${a}</g>${b ? `<g ${paint(accent)}>${b}</g>` : ''}</svg>`;
  }

  const text = (str, o = {}) => svg(layout(str, CAPS, o.tracking ?? 1), { title: o.title ?? str, ...o });
  // Logo geometry, in units (1 unit = 1 logo pixel).
  const WORD = () => layout('PIXELSPEC', BOLD, 1);                      // 60 x 7
  function WORD_STACK() {                                                  // 32 x 16: two lines, 2u leading
    const a = layout('PIXEL', BOLD, 1), b = layout('SPEC', BOLD, 1);
    return { w: Math.max(a.w, b.w), h: 16, cells: a.cells.concat(b.cells.map(([x, y, k]) => [x, y + 9, k])) };
  }
  const scaled = (bm, n) => ({ w: bm.w * n, h: bm.h * n, cells: bm.cells.flatMap(([x, y, k]) => { const o = []; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) o.push([x * n + a, y * n + b, k]); return o; }) });
  const beside = (a, b, gap, dy = 0) => ({ w: a.w + gap + b.w, h: Math.max(a.h, b.h + dy), cells: a.cells.concat(b.cells.map(([x, y, k]) => [x + a.w + gap, y + dy, k])) });
  // Stacked lockup: the mark at 2x is exactly as tall as the two lines of type (16u).
  const LOCKUP = () => beside(scaled(grid(MARK), 2), WORD_STACK(), 4);  // 52 x 16
  // Inline lockup for nav bars: mark at 1x, one line of type centred on it.
  const LOCKUP_INLINE = () => beside(grid(MARK), WORD(), 3, 0.5);       // 71 x 8

  const T = { title: 'PixelSpec' };
  const wordmark = (o = {}) => svg(o.stack ? WORD_STACK() : WORD(), { ...T, ...o });
  const mark = (o = {}) => svg(grid(MARK), { ...T, ...o });
  const lockup = (o = {}) => svg(o.inline ? LOCKUP_INLINE() : LOCKUP(), { ...T, ...o });
  const icon = (name, o = {}) => svg(grid(ICONS[name] || ICONS.plus), o);

  /* ----------------------------------------------------------- backgrounds */

  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr };
  }

  // Tracks the pointer relative to an element, even when the canvas sits under content.
  function pointer(el, onMove) {
    const state = { x: -1e4, y: -1e4, inside: false };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      state.x = e.clientX - r.left; state.y = e.clientY - r.top;
      state.inside = state.x >= 0 && state.y >= 0 && state.x <= r.width && state.y <= r.height;
      // Content marked data-px-shield keeps the backgrounds from drawing over it.
      state.shielded = !!(e.target && e.target.closest && e.target.closest('[data-px-shield]'));
      onMove && onMove(state);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerleave', () => { state.inside = false; onMove && onMove(state); });
    return state;
  }

  function loop(canvas, frame) {
    let visible = true, raf = 0, running = false;
    const tick = (t) => { raf = 0; if (!visible) { running = false; return; } frame(t); raf = requestAnimationFrame(tick); };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '80px' }).observe(canvas);
    start();
    return { kick: start };
  }

  /**
   * Blueprint grid: crosshair registration marks, minor ticks, diagonal hatch,
   * cells that light up, little nodes that travel along the grid, and a
   * measured cell under the cursor.
   */
  function blueprint(canvas, opts = {}) {
    const o = Object.assign({ major: 192, sub: 4, seed: 11, theme: canvas.dataset.theme || 'dark', hover: true, glows: 1, nodes: 4, label: true }, opts);
    if (canvas.dataset.major) o.major = +canvas.dataset.major;
    if (canvas.dataset.hover === 'false') o.hover = false;
    const light = o.theme === 'light';
    const C = light
      ? { bg: '#EEF1F4', hatch: 'rgba(16,40,64,.045)', line: 'rgba(16,40,64,.07)', tick: 'rgba(16,40,64,.28)', cross: 'rgba(4,8,13,.75)', glow: 'rgba(13,153,255,.07)', glowHatch: 'rgba(13,153,255,.16)', node: 'rgba(4,8,13,.55)', sig: '#0D99FF', label: 'rgba(4,8,13,.6)' }
      : { bg: '#04080D', hatch: 'rgba(40,86,130,.075)', line: 'rgba(110,150,190,.075)', tick: 'rgba(150,180,210,.32)', cross: 'rgba(225,235,245,.82)', glow: 'rgba(13,153,255,.055)', glowHatch: 'rgba(60,150,220,.13)', node: 'rgba(205,215,225,.7)', sig: '#0D99FF', label: 'rgba(170,200,230,.75)' };
    if (canvas.dataset.bg) C.bg = canvas.dataset.bg;
    let W, H, M, ox, oy, cols, rows, layer, dprv;
    let glows = [], nodes = [], shieldFn = () => false;
    const ptr = o.hover ? pointer(canvas) : { inside: false };
    let hov = { cx: -1, cy: -1, a: 0 };

    function build() {
      const { w, h, dpr } = fit(canvas);
      W = w; H = h; dprv = dpr;
      M = W < 640 ? Math.round(o.major * 0.62) : o.major;
      cols = Math.ceil(W / M) + 1; rows = Math.ceil(H / M) + 1;
      ox = Math.round(((W % M) / 2) - M); ox = ((ox % M) + M) % M; oy = Math.round(M * 0.45) % M;
      layer = document.createElement('canvas');
      layer.width = Math.round(W * dpr); layer.height = Math.round(H * dpr);
      const g = layer.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      // diagonal hatch
      g.strokeStyle = C.hatch; g.lineWidth = 6;
      g.beginPath();
      for (let c = -H; c < W + H; c += 22) { g.moveTo(c, H); g.lineTo(c + H, 0); }
      g.stroke();
      // grid lines
      g.strokeStyle = C.line; g.lineWidth = 1;
      g.beginPath();
      for (let x = ox; x <= W; x += M) { g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, H); }
      for (let y = oy; y <= H; y += M) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(W, Math.round(y) + 0.5); }
      g.stroke();
      // Text marked data-px-shield (inside this canvas's section) stays free of crosshairs and ticks.
      const cr = canvas.getBoundingClientRect();
      const shields = [...(canvas.parentElement || document).querySelectorAll('[data-px-shield]')].map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left - cr.left - 12, r.top - cr.top - 12, r.right - cr.left + 12, r.bottom - cr.top + 12];
      });
      const shielded = (X, Y) => shields.some(([a, b, c, d2]) => X >= a && X <= c && Y >= b && Y <= d2);
      shieldFn = shielded;
      // minor ticks
      const m = M / o.sub;
      g.strokeStyle = C.tick; g.lineWidth = 1;
      g.beginPath();
      for (let x = ox - M; x <= W + m; x += m) for (let y = oy - M; y <= H + m; y += m) {
        const onMajor = Math.abs(((x - ox) / M) - Math.round((x - ox) / M)) < 0.01 && Math.abs(((y - oy) / M) - Math.round((y - oy) / M)) < 0.01;
        if (onMajor) continue;
        const X = Math.round(x) + 0.5, Y = Math.round(y) + 0.5;
        if (shielded(X, Y)) continue;
        g.moveTo(X - 2.5, Y); g.lineTo(X + 2.5, Y); g.moveTo(X, Y - 2.5); g.lineTo(X, Y + 2.5);
      }
      g.stroke();
      // major crosshairs
      g.strokeStyle = C.cross; g.lineWidth = 1.25;
      g.beginPath();
      const arm = W < 640 ? 7 : 10;
      for (let x = ox; x <= W + 1; x += M) for (let y = oy; y <= H + 1; y += M) {
        const X = Math.round(x) + 0.5, Y = Math.round(y) + 0.5;
        if (shielded(X, Y)) continue;
        g.moveTo(X - arm, Y); g.lineTo(X + arm, Y); g.moveTo(X, Y - arm); g.lineTo(X, Y + arm);
      }
      g.stroke();
      // seed glowing cells and nodes
      let s = o.seed;
      const rnd = () => hash2(s++, 7, o.seed);
      glows = Array.from({ length: o.glows }, () => ({ cx: Math.floor(rnd() * cols) - 1, cy: Math.floor(rnd() * rows) - 1, t0: rnd() * 6000, dur: 5000 + rnd() * 5000 }));
      nodes = Array.from({ length: o.nodes }, () => {
        const ix = Math.floor(rnd() * cols * o.sub), iy = Math.floor(rnd() * rows * o.sub);
        return { ix, iy, tx: ix, ty: iy, t0: 0, dur: 900, wait: rnd() * 3000 };
      });
    }

    function cellRect(cx, cy) { return [ox + cx * M, oy + cy * M, M, M]; }

    function drawHatchCell(ctx, x, y, w, h, alpha, fill, hatch) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = hatch; ctx.lineWidth = 6;
      ctx.beginPath();
      // Global stripes are the lines x + y = 22k; draw the same ones inside the cell.
      for (let K = Math.floor((x + y) / 22) * 22; K <= x + w + y + h + 22; K += 22) {
        ctx.moveTo(K - (y + h), y + h); ctx.lineTo(K - y, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function frame(t) {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.setTransform(dprv, 0, 0, dprv, 0, 0);
      // glowing cells
      for (const gl of glows) {
        let p = ((t + gl.t0) % gl.dur) / gl.dur;
        if (p < 0.02 && !gl.moved) {
          gl.cx = Math.floor(hash2(gl.cx * 31 + 1, gl.cy + (t | 0), o.seed) * cols) - 1;
          gl.cy = Math.floor(hash2(gl.cy * 17 + 3, gl.cx + (t | 0), o.seed) * rows) - 1;
          gl.moved = true;
        } else if (p > 0.5) gl.moved = false;
        const a = Math.sin(Math.PI * p);
        if (a <= 0.01) continue;
        const [x, y, w, h] = cellRect(gl.cx, gl.cy);
        drawHatchCell(ctx, x, y, w, h, a, C.glow, C.glowHatch);
      }
      // traveling nodes
      const m = M / o.sub;
      ctx.fillStyle = C.node;
      for (const n of nodes) {
        if (t > n.t0 + n.dur + n.wait) {
          n.ix = n.tx; n.iy = n.ty;
          const dir = Math.floor(hash2(n.ix, n.iy, (t | 0)) * 4);
          const steps = 1 + Math.floor(hash2(n.iy, n.ix, (t | 0) + 1) * 3);
          n.tx = n.ix + (dir === 0 ? steps : dir === 1 ? -steps : 0);
          n.ty = n.iy + (dir === 2 ? steps : dir === 3 ? -steps : 0);
          n.t0 = t; n.dur = 500 + steps * 260; n.wait = 800 + hash2(n.tx, n.ty, 5) * 3200;
        }
        const p = clamp((t - n.t0) / n.dur);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const x = ox - M + (n.ix + (n.tx - n.ix) * e) * m, y = oy - M + (n.iy + (n.ty - n.iy) * e) * m;
        if (shieldFn(x, y)) continue;
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
      }
      // measured cell under the cursor
      if (o.hover) {
        const cx = Math.floor((ptr.x - ox) / M), cy = Math.floor((ptr.y - oy) / M);
        const live = ptr.inside && !ptr.shielded;
        if (live && (cx !== hov.cx || cy !== hov.cy)) { hov.cx = cx; hov.cy = cy; hov.born = t; }
        hov.a += ((live ? 1 : 0) - hov.a) * 0.12;
        if (hov.a > 0.01 && hov.born != null) {
          const [x, y, w, h] = cellRect(hov.cx, hov.cy);
          const pop = clamp((t - hov.born) / 220);
          ctx.save();
          ctx.globalAlpha = hov.a;
          ctx.strokeStyle = C.sig; ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, h);
          // handles
          ctx.fillStyle = C.sig;
          const hs = 6 * pop;
          for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) ctx.fillRect(Math.round(hx) - hs / 2 + 0.5, Math.round(hy) - hs / 2 + 0.5, hs, hs);
          if (o.label) {
            ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
            const lab = `${Math.round(w)} × ${Math.round(h)}`;
            const tw = ctx.measureText(lab).width + 12;
            ctx.fillStyle = C.sig;
            ctx.fillRect(Math.round(x + w / 2 - tw / 2), Math.round(y + h + 8), Math.round(tw), 18);
            ctx.fillStyle = '#04080D';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lab, Math.round(x + w / 2), Math.round(y + h + 17.5));
          }
          ctx.restore();
        }
      }
    }

    build();
    let rt;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduced()) frame(0); }, 60); }).observe(canvas);
    if (reduced()) { frame(0); window.addEventListener('pointermove', () => requestAnimationFrame(frame), { passive: true }); }
    else loop(canvas, frame);
  }

  /**
   * Pixel dissolve edge between two colors. Cells near the edge carry
   * minesweeper-style counts: how many pixels of the other color touch them.
   * data-top / data-bottom: colors. data-cell: cell size in px. data-flip: dissolve upward.
   */
  function dissolve(canvas, opts = {}) {
    const d = canvas.dataset;
    const o = Object.assign({
      top: d.top || cssVar('--void') || '#04080D', bottom: d.bottom || cssVar('--paper') || '#EEF1F4',
      cell: +(d.cell || 24), seed: +(d.seed || 3), numbers: d.numbers !== 'false', accent: d.accent || '#0D99FF',
      numTop: d.numTop || 'rgba(238,241,244,.55)', numBottom: d.numBottom || 'rgba(4,8,13,.45)', hover: d.hover === 'true',
      spread: +(d.spread || 0.55), scatter: +(d.scatter || 1),
    }, opts);
    let W, H, cols, rows, field, cs;
    const ptr = o.hover ? pointer(canvas) : null;
    const trail = new Map(); // "c,r" -> time

    function build() {
      const f = fit(canvas); W = f.w; H = f.h;
      cs = W < 640 ? Math.max(12, Math.round(o.cell * 0.7)) : o.cell;
      cols = Math.ceil(W / cs); rows = Math.ceil(H / cs);
      field = new Uint8Array(cols * rows);
      for (let c = 0; c < cols; c++) {
        const n = fbm(c * 0.07, 0.5, o.seed, 4);
        const n2 = fbm(c * 0.33, 4.2, o.seed + 9, 2);
        const front = rows * (0.5 + (n - 0.5) * 2 * o.spread) + Math.round((n2 - 0.5) * 2);
        for (let r = 0; r < rows; r++) {
          const dist = r - front;
          let v = dist < 0 ? 0 : 1; // 0 = top color, 1 = bottom color
          const p = 0.24 * o.scatter * Math.exp(-Math.abs(dist) / 1.3);
          if (hash2(c, r, o.seed) < p) v = 1 - v;
          // a few stray islands further out
          if (Math.abs(dist) > 3 && hash2(c * 3, r * 7, o.seed + 4) < 0.012 * o.scatter) v = 1 - v;
          // A partial last row would show thin slivers, so it always takes the bottom color.
          if ((r + 1) * cs > H) v = 1;
          field[r * cols + c] = v;
        }
      }
      draw(performance.now());
    }

    function at(c, r) { if (c < 0 || r < 0 || c >= cols || r >= rows) return -1; return field[r * cols + c]; }

    function draw(t) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = o.top; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = o.bottom;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (field[r * cols + c]) ctx.fillRect(c * cs, r * cs, cs + 0.5, cs + 0.5);
      if (o.numbers && cs >= 14) {
        ctx.font = `500 ${Math.round(cs * 0.36)}px "Geist Mono", ui-monospace, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const v = at(c, r);
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(c + dx, r + dy) === 1 - v) n++;
          if (!n || n > 4 || hash2(c, r, o.seed + 2) > 0.42) continue;
          ctx.fillStyle = v ? o.numBottom : o.numTop;
          ctx.fillText(String(n), c * cs + cs / 2, r * cs + cs / 2 + 0.5);
        }
      }
      // cursor trail
      for (const [k, t0] of trail) {
        const age = (t - t0) / 900;
        if (age >= 1) { trail.delete(k); continue; }
        const [c, r] = k.split(',').map(Number);
        ctx.globalAlpha = (1 - age) * 0.9;
        ctx.fillStyle = o.accent;
        ctx.fillRect(c * cs, r * cs, cs, cs);
        ctx.globalAlpha = 1;
      }
    }

    build();
    let rt;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 60); }).observe(canvas);
    if (o.hover) {
      let raf = 0;
      const step = (t) => { raf = 0; draw(t); if (trail.size) raf = requestAnimationFrame(step); };
      window.addEventListener('pointermove', () => {
        if (!ptr.inside) return;
        const c = Math.floor(ptr.x / cs), r = Math.floor(ptr.y / cs);
        trail.set(`${c},${r}`, performance.now());
        if (!raf) raf = requestAnimationFrame(step);
      }, { passive: true });
    }
  }

  /**
   * Halftone dot field: dot sizes follow a slow noise field inside a horizontal band.
   * data-color, data-step, data-hole ("w,h" in px, clears a box in the middle).
   */
  function halftone(canvas, opts = {}) {
    const d = canvas.dataset;
    const o = Object.assign({ color: d.color || '#0D99FF', bg: d.bg || 'transparent', step: +(d.step || 14), seed: +(d.seed || 5), hole: d.hole, holeEl: d.holeEl, speed: +(d.speed || 1), band: d.band !== 'false', hover: d.hover !== 'false' }, opts);
    const holeEls = o.holeEl ? [...(canvas.parentElement || document).querySelectorAll(o.holeEl)] : [];
    let W, H, step;
    const ptr = pointer(canvas);
    function frame(t) {
      const f = fit(canvas); W = f.w; H = f.h;
      const ctx = f.ctx;
      step = W < 640 ? Math.round(o.step * 0.8) : o.step;
      ctx.clearRect(0, 0, W, H);
      if (o.bg !== 'transparent') { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = o.color;
      const time = (t || 0) * 0.00004 * o.speed;
      let [hw, hh] = o.hole ? o.hole.split(',').map(Number) : [0, 0];
      // Holes: soft boxes cleared around elements (data-hole-el), or one centred box (data-hole).
      let holes = [];
      if (holeEls.length) {
        const cr = canvas.getBoundingClientRect();
        holes = holeEls.map((el) => {
          const er = el.getBoundingClientRect();
          const pad = Math.min(80, W * 0.06, Math.max(20, Math.min(er.width, er.height) * 0.6));
          return [er.left - cr.left + er.width / 2, er.top - cr.top + er.height / 2, er.width + pad * 2, er.height + pad * 2];
        });
      } else if (hw) {
        // Keep the cleared box inside the canvas so small screens still get dots around it.
        holes = [[W / 2, H / 2, Math.min(hw, W * 0.86), Math.min(hh, H * 0.8)]];
      }
      const cols = Math.ceil(W / step), rows = Math.ceil(H / step);
      const offX = (W - (cols - 1) * step) / 2, offY = (H - (rows - 1) * step) / 2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = offX + c * step, y = offY + r * step;
        let v = fbm(c * 0.05 + time, r * 0.09 - time * 0.6, o.seed, 4);
        v = (v - 0.3) * 1.9 * (0.35 + 0.95 * hash2(c + 91, r + 37, o.seed));
        if (o.band) { const by = Math.abs(y / H - 0.5) * 2; v *= 1 - Math.pow(by, 2.2); }
        const jitter = hash2(c, r, o.seed);
        if (jitter < 0.22) v *= 0.3;
        if (holes.length) {
          let dd = Infinity;
          for (const [hx, hy, hw2, hh2] of holes) dd = Math.min(dd, Math.max(Math.abs(x - hx) - hw2 / 2, Math.abs(y - hy) - hh2 / 2));
          if (dd < 0) continue;
          v *= clamp(dd / (step * 3));
        }
        if (o.hover && ptr.inside) {
          const pd = Math.hypot(x - ptr.x, y - ptr.y);
          if (pd < 120) v = Math.max(v, (1 - pd / 120) * 0.9);
        }
        v = clamp(v);
        if (v < 0.1) continue;
        const rad = (step / 2) * (0.22 + 0.7 * v);
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (reduced()) { frame(0); new ResizeObserver(() => frame(0)).observe(canvas); }
    else loop(canvas, frame);
  }

  /* ----------------------------------------------------------------- rulers */

  /**
   * Rulers on the top and left edge of the page. The top ruler sits
   * in the flow right under the page header and sticks with it; the left ruler is
   * fixed. Both show page coordinates, the cursor position, and the extent of the
   * element under the cursor. Enable with <body data-px-rulers>.
   */
  function rulers(opts = {}) {
    const header = opts.header || document.querySelector('body > header');
    const S = 20; // ruler thickness
    const root = document.documentElement;
    root.classList.add('px-rulers-on');

    const top = document.createElement('div');
    top.className = 'px-ruler px-ruler-x';
    top.setAttribute('aria-hidden', 'true');
    top.innerHTML = '<span class="px-ruler-corner">PX</span><canvas></canvas>';
    const left = document.createElement('div');
    left.className = 'px-ruler px-ruler-y';
    left.setAttribute('aria-hidden', 'true');
    left.innerHTML = '<canvas></canvas>';
    if (header && header.parentNode) header.after(top); else document.body.prepend(top);
    document.body.append(left);
    const cx = top.querySelector('canvas'), cy = left.querySelector('canvas');

    const C = { bg: '#08090A', tick: 'rgba(161,166,174,.26)', label: '#7D828B', sig: '#0D99FF', ink: '#0A0A0A' };
    let mx = -1, my = -1, raf = 0, inside = false, hb = 0, on = true;

    const stickTop = () => {
      hb = header ? header.getBoundingClientRect().height : 0;
      top.style.top = hb + 'px';
      left.style.top = hb + S + 'px'; // the left ruler starts under the corner square
      if (on) root.style.scrollPaddingTop = hb + S + 8 + 'px'; // anchors land below header + ruler
    };

    function ticks(ctx, len, offset, vertical) {
      // offset: page coordinate at the ruler's start
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, vertical ? S : len, vertical ? len : S);
      ctx.strokeStyle = C.tick; ctx.lineWidth = 1;
      ctx.font = '500 9px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = C.label;
      ctx.beginPath();
      const first = Math.floor(offset / 10) * 10;
      for (let v = first; v <= offset + len; v += 10) {
        const p = Math.round(v - offset) + 0.5;
        const h = v % 100 === 0 ? S : v % 50 === 0 ? 7 : 4;
        if (vertical) { ctx.moveTo(S - h, p); ctx.lineTo(S, p); } else { ctx.moveTo(p, S - h); ctx.lineTo(p, S); }
      }
      ctx.stroke();
      for (let v = Math.floor(offset / 100) * 100; v <= offset + len; v += 100) {
        const p = Math.round(v - offset);
        const tw = ctx.measureText(v).width;
        if (vertical ? p + 3 - tw < 0 : p + 3 + tw > len) continue; // never draw a clipped label
        if (vertical) { ctx.save(); ctx.translate(9, p + 3); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(v, 0, 0); ctx.restore(); }
        else { ctx.textAlign = 'left'; ctx.fillText(v, p + 3, 9); }
      }
    }

    function marker(ctx, pos, val, vertical, len) {
      ctx.fillStyle = C.sig;
      if (vertical) ctx.fillRect(0, Math.round(pos), S, 1); else ctx.fillRect(Math.round(pos), 0, 1, S);
      const text = String(Math.round(val));
      ctx.font = '600 9px "Geist Mono", ui-monospace, monospace';
      const w = ctx.measureText(text).width + 8;
      if (vertical) {
        const y = Math.max(0, Math.min(len - w, pos - w / 2));
        ctx.fillRect(2, y, S - 4, w);
        ctx.save(); ctx.translate(S / 2 + 3, y + w / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(text, 0, 0); ctx.restore();
      } else {
        const x = Math.max(0, Math.min(len - w, pos - w / 2));
        ctx.fillRect(x, 2, w, S - 4);
        ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(text, x + w / 2, S / 2 + 3);
      }
    }

    function draw() {
      raf = 0;
      // top ruler: x measured from the content edge (right of the left ruler)
      const tw = Math.max(1, cx.getBoundingClientRect().width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const y0 = hb + S, th = Math.max(1, window.innerHeight - y0); // left ruler's screen top and length
      for (const [c, w, h] of [[cx, tw, S], [cy, S, th]]) {
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
        c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const gx = cx.getContext('2d'), gy = cy.getContext('2d');
      const ox = cx.getBoundingClientRect().left; // screen x of page x = 0 ... content starts at S
      const xStart = ox - S;                       // page x at the canvas's left edge
      ticks(gx, tw, xStart + window.scrollX, false);
      ticks(gy, th, window.scrollY + y0, true);
      // Cursor markers only over the page content, never over the rulers or header.
      if (inside && mx >= S && my >= y0) {
        marker(gx, mx - ox, mx - S + window.scrollX, false, tw);
        marker(gy, my - y0, my + window.scrollY, true, th);
      }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY; inside = true;
      kick();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { inside = false; kick(); });
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', () => { stickTop(); kick(); });
    if (header) new ResizeObserver(stickTop).observe(header);
    // Rulers need room: switch them off below 861px and back on when the window grows.
    const wide = matchMedia('(min-width: 861px)');
    const apply = () => {
      on = wide.matches;
      root.classList.toggle('px-rulers-on', on);
      top.hidden = left.hidden = !on;
      if (!on) root.style.scrollPaddingTop = '';
      stickTop(); kick();
    };
    wide.addEventListener('change', apply);
    apply();
    return { redraw: kick };
  }

  /* ---------------------------------------------------------------- hydrate */

  function opts(el) {
    const d = el.dataset, o = {};
    if (d.shape) o.shape = d.shape;
    if (d.gap) o.gap = +d.gap;
    if (d.fill) o.fill = d.fill;
    if (d.accent) o.accent = d.accent;
    if (d.mono != null) o.mono = true;
    if (d.tracking) o.tracking = +d.tracking;
    return o;
  }

  function hydrate(root = document) {
    root.querySelectorAll('[data-px-text]').forEach((el) => { el.innerHTML = text(el.dataset.pxText, { title: el.getAttribute('aria-label') || el.dataset.pxText, ...opts(el) }); });
    root.querySelectorAll('[data-px-logo]').forEach((el) => {
      const kind = el.dataset.pxLogo, o = opts(el);
      el.innerHTML = kind === 'mark' ? mark(o)
        : kind === 'lockup' ? lockup(o)
        : kind === 'lockup-inline' ? lockup({ ...o, inline: true })
        : kind === 'wordmark-stack' ? wordmark({ ...o, stack: true })
        : wordmark(o);
    });
    root.querySelectorAll('[data-px-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.pxIcon, opts(el)); });
    root.querySelectorAll('[data-px-cursor]').forEach((el) => { el.innerHTML = svg(grid(BIG_CURSOR), opts(el)); });
    root.querySelectorAll('canvas[data-px-bg]').forEach((c) => {
      if (c.__px) return; c.__px = 1;
      const kind = c.dataset.pxBg;
      if (kind === 'blueprint') blueprint(c);
      else if (kind === 'dissolve') dissolve(c);
      else if (kind === 'halftone') halftone(c);
    });
  }

  window.PX = { CAPS, BOLD, LOWER, MARK, WORD, WORD_STACK, LOCKUP, LOCKUP_INLINE, scaled, beside, ICONS, BIG_CURSOR, layout, grid, svg, text, wordmark, mark, lockup, icon, blueprint, dissolve, halftone, rulers, hydrate, noise: { hash2, vnoise, fbm } };

  const ready = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    hydrate();
    // Rulers only where there is room and a mouse to point with.
    if (document.body && document.body.hasAttribute && document.body.hasAttribute('data-px-rulers') && window.matchMedia && matchMedia('(pointer: fine)').matches) rulers();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
