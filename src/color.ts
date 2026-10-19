export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const cache = new Map<string, RGBA | null>();
let ctx: CanvasRenderingContext2D | null | undefined;

function getCtx(): CanvasRenderingContext2D | null {
  if (ctx === undefined) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    ctx = c.getContext('2d', { willReadFrequently: true });
  }
  return ctx;
}

const RGB_RE = /^rgba?\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i;
const HEX_RE = /^#([0-9a-f]{6})$/i;

function fromRgbString(str: string): RGBA | null {
  const m = RGB_RE.exec(str);
  if (!m) return null;
  let a = m[4] === undefined ? 1 : parseFloat(m[4]);
  if (m[5]) a /= 100;
  return { r: +m[1], g: +m[2], b: +m[3], a };
}

/**
 * Parse any CSS color string (rgb, hex, hsl, oklch, color(), named…) into sRGB.
 * Computed styles are usually rgb()/rgba(); modern color spaces fall back to canvas.
 */
export function parseColor(input: string | null | undefined): RGBA | null {
  if (!input) return null;
  const str = input.trim();
  if (str === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hit = cache.get(str);
  if (hit !== undefined) return hit;

  let out = fromRgbString(str);
  if (!out) {
    const c = getCtx();
    if (c) {
      const sentinel = '#010203';
      c.fillStyle = sentinel;
      c.fillStyle = str;
      const norm = String(c.fillStyle);
      if (norm !== sentinel || /^#010203$/i.test(str)) {
        const hex = HEX_RE.exec(norm);
        if (hex) {
          const n = parseInt(hex[1], 16);
          out = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
        } else {
          out = fromRgbString(norm);
          if (!out) {
            c.clearRect(0, 0, 1, 1);
            c.fillRect(0, 0, 1, 1);
            const d = c.getImageData(0, 0, 1, 1).data;
            out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
          }
        }
      }
    }
  }
  cache.set(str, out);
  return out;
}

const h2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

export function toHex(c: RGBA, withAlpha = true): string {
  const base = `#${h2(c.r)}${h2(c.g)}${h2(c.b)}`.toUpperCase();
  return withAlpha && c.a < 1 ? base + h2(c.a * 255).toUpperCase() : base;
}

/** "#1E1E1E" or "#1E1E1E · 50%" */
export function describeColor(c: RGBA): string {
  return c.a < 1 ? `${toHex(c, false)} · ${Math.round(c.a * 100)}%` : toHex(c);
}

/** Hex for a CSS color string, or the raw string if it can't be parsed. */
export function hexOf(css: string): string {
  const c = parseColor(css);
  return c ? toHex(c) : css;
}

/** Alpha-composite `top` over `bottom`. */
export function over(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a;
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
}

function luminance(c: RGBA): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG 2 contrast ratio. */
export function contrast(a: RGBA, b: RGBA): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Walk up the tree compositing background colors until an opaque one is hit.
 * Background images are not sampled, only flagged.
 */
export function effectiveBackground(el: Element): { color: RGBA; hasImage: boolean } {
  const layers: RGBA[] = [];
  let hasImage = false;
  let node: Element | null = el;
  while (node) {
    const cs = getComputedStyle(node);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') hasImage = true;
    const c = parseColor(cs.backgroundColor);
    if (c && c.a > 0) {
      layers.push(c);
      if (c.a >= 1) break;
    }
    node = node.parentElement;
  }
  let result: RGBA = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
  return { color: result, hasImage };
}

export function isTransparent(css: string): boolean {
  const c = parseColor(css);
  return !c || c.a === 0;
}
