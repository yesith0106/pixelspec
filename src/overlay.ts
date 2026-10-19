import { gapRects, shortName, textRects, type Gap } from './inspect';
import { clamp, esc, fmt, mkRect, num, rectOf, type Rect } from './util';

const r2 = (n: number) => Math.round(n * 100) / 100;
const vw = () => document.documentElement.clientWidth || window.innerWidth;
const vh = () => document.documentElement.clientHeight || window.innerHeight;

function div(cls: string, x: number, y: number, w: number, h: number): string {
  if (!(w > 0 && h > 0)) return '';
  return `<div class="${cls}" style="left:${r2(x)}px;top:${r2(y)}px;width:${r2(w)}px;height:${r2(h)}px"></div>`;
}

/** Centered pill, clamped to the viewport. */
function pill(cls: string, x: number, y: number, text: string): string {
  const cx = clamp(x, 26, vw() - 26);
  const cy = clamp(y, 10, vh() - 10);
  return `<div class="pill ${cls}" style="left:${r2(cx)}px;top:${r2(cy)}px">${esc(text)}</div>`;
}

/** Left-anchored pill. */
function pillL(cls: string, x: number, y: number, text: string): string {
  const cx = clamp(x, 4, vw() - 60);
  const cy = clamp(y, 10, vh() - 10);
  return `<div class="pill pill-l ${cls}" style="left:${r2(cx)}px;top:${r2(cy)}px">${esc(text)}</div>`;
}

function ring(o: Rect, i: Rect, cls: string): string {
  return (
    div(cls, o.left, o.top, o.width, i.top - o.top) +
    div(cls, o.left, i.bottom, o.width, o.bottom - i.bottom) +
    div(cls, o.left, i.top, i.left - o.left, i.height) +
    div(cls, i.right, i.top, o.right - i.right, i.height)
  );
}

export interface Boxes {
  margin: Rect;
  border: Rect;
  padding: Rect;
  content: Rect;
  /** [top, right, bottom, left] */
  m: number[];
  b: number[];
  p: number[];
}

export function boxes(el: Element, cs = getComputedStyle(el)): Boxes {
  const border = rectOf(el);
  const m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(num);
  const b = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(num);
  const p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(num);
  const mp = m.map((v) => Math.max(0, v));
  const margin = mkRect(border.left - mp[3], border.top - mp[0], border.right + mp[1], border.bottom + mp[2]);
  const padding = mkRect(border.left + b[3], border.top + b[0], border.right - b[1], border.bottom - b[2]);
  const content = mkRect(padding.left + p[3], padding.top + p[0], padding.right - p[1], padding.bottom - p[2]);
  return { margin, border, padding, content, m, b, p };
}

function sideLabels(outer: Rect, inner: Rect, v: number[], cls: string): string {
  let o = '';
  const lab = (val: number, x: number, y: number, room: number, need: number) =>
    val && room >= need ? `<div class="sv ${cls}" style="left:${r2(x)}px;top:${r2(y)}px">${fmt(val)}</div>` : '';
  o += lab(v[0], inner.left + inner.width / 2, outer.top + (inner.top - outer.top) / 2, inner.top - outer.top, 12);
  o += lab(v[2], inner.left + inner.width / 2, inner.bottom + (outer.bottom - inner.bottom) / 2, outer.bottom - inner.bottom, 12);
  o += lab(v[3], outer.left + (inner.left - outer.left) / 2, inner.top + inner.height / 2, inner.left - outer.left, 18);
  o += lab(v[1], inner.right + (outer.right - inner.right) / 2, inner.top + inner.height / 2, outer.right - inner.right, 18);
  return o;
}

export function drawBoxModel(bx: Boxes, labels: boolean): string {
  let o =
    ring(bx.margin, bx.border, 'bx-m') +
    ring(bx.border, bx.padding, 'bx-b') +
    ring(bx.padding, bx.content, 'bx-p') +
    div('bx-c', bx.content.left, bx.content.top, bx.content.width, bx.content.height);
  if (labels) {
    o += sideLabels(bx.padding, bx.content, bx.p, 'sv-p');
    o += sideLabels(bx.margin, bx.border, bx.m.map((v) => Math.max(0, v)), 'sv-m');
  }
  return o;
}

export function drawOutline(r: Rect, cls: string): string {
  return div(`ol ${cls}`, r.left, r.top, r.width, r.height);
}

/** Tag name above, dimensions below. */
export function drawLabels(el: Element, r: Rect, kind: 'sel' | 'hov'): string {
  if (r.bottom < 0 || r.top > vh() || r.right < 0 || r.left > vw()) return '';
  const tagY = r.top - 12 < 4 ? r.top + 12 : r.top - 12;
  const dimY = r.bottom + 13 > vh() - 4 ? r.bottom - 13 : r.bottom + 13;
  return pillL(`tag-${kind}`, Math.max(r.left, 4), tagY, shortName(el)) + pill(`dim-${kind}`, r.left + r.width / 2, dimY, `${fmt(r.width)} × ${fmt(r.height)}`);
}

/* ------------------------------------------------------------------ */
/* Redlines                                                            */
/* ------------------------------------------------------------------ */

function hLine(x1: number, x2: number, y: number): string {
  const d = x2 - x1;
  if (d < 0.5) return '';
  return div('dl', x1, y - 0.5, d, 1) + div('dcap', x1 - 0.5, y - 4, 1, 8) + div('dcap', x2 - 0.5, y - 4, 1, 8) + pill('dp', x1 + d / 2, y + 11, fmt(d));
}

function vLine(y1: number, y2: number, x: number): string {
  const d = y2 - y1;
  if (d < 0.5) return '';
  return div('dl', x - 0.5, y1, 1, d) + div('dcap', x - 4, y1 - 0.5, 8, 1) + div('dcap', x - 4, y2 - 0.5, 8, 1) + pillL('dp', x + 6, y1 + d / 2, fmt(d));
}

const hDash = (x1: number, x2: number, y: number) => div('dd-h', Math.min(x1, x2), y - 0.5, Math.abs(x2 - x1), 1);
const vDash = (y1: number, y2: number, x: number) => div('dd-v', x - 0.5, Math.min(y1, y2), 1, Math.abs(y2 - y1));

/**
 * Figma-style distance measurement from `a` (anchor) to `b` (target).
 * Handles separated, intersecting and nested rects.
 */
export function drawMeasure(a: Rect, b: Rect): string {
  let o = '';
  const ovX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const ovY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

  if (ovX > 0 && ovY > 0) {
    // Nested or intersecting: measure matching edges, through the overlap's center.
    const cx = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
    const cy = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
    o += hLine(Math.min(a.left, b.left), Math.max(a.left, b.left), cy);
    o += hLine(Math.min(a.right, b.right), Math.max(a.right, b.right), cy);
    o += vLine(Math.min(a.top, b.top), Math.max(a.top, b.top), cx);
    o += vLine(Math.min(a.bottom, b.bottom), Math.max(a.bottom, b.bottom), cx);
    return o;
  }

  if (ovX <= 0) {
    const aLeft = a.right <= b.left;
    const x1 = aLeft ? a.right : b.right;
    const x2 = aLeft ? b.left : a.left;
    let y: number;
    if (ovY > 0) {
      y = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
    } else {
      y = a.top + a.height / 2;
      const ex = aLeft ? b.left : b.right;
      o += y < b.top ? vDash(y, b.top, ex) : vDash(b.bottom, y, ex);
    }
    o += hLine(x1, x2, y);
  }

  if (ovY <= 0) {
    const aTop = a.bottom <= b.top;
    const y1 = aTop ? a.bottom : b.bottom;
    const y2 = aTop ? b.top : a.top;
    let x: number;
    if (ovX > 0) {
      x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
    } else {
      x = a.left + a.width / 2;
      const ey = aTop ? b.top : b.bottom;
      o += x < b.left ? hDash(x, b.left, ey) : hDash(b.right, x, ey);
    }
    o += vLine(y1, y2, x);
  }
  return o;
}

/* ------------------------------------------------------------------ */
/* Spacing, text, guides                                               */
/* ------------------------------------------------------------------ */

export function drawGaps(gaps: Gap[]): string {
  let o = '';
  for (const g of gaps) {
    o += div('gap', g.rect.left, g.rect.top, g.rect.width, g.rect.height);
    o += pill('gp', g.rect.left + g.rect.width / 2, g.rect.top + g.rect.height / 2, fmt(g.size));
  }
  return o;
}

export function drawChildGaps(el: Element): string {
  return drawGaps(gapRects(el));
}

export function drawTextLines(el: Element): string {
  let o = '';
  for (const r of textRects(el)) o += div('tl', r.left, r.top, r.width, r.height);
  return o;
}

export function drawEdgeGuides(r: Rect): string {
  const W = vw();
  const H = vh();
  return (
    div('gd-v', r.left - 0.5, 0, 1, H) +
    div('gd-v', r.right - 0.5, 0, 1, H) +
    div('gd-h', 0, r.top - 0.5, W, 1) +
    div('gd-h', 0, r.bottom - 0.5, W, 1)
  );
}

export function drawCrosshair(x: number, y: number): string {
  return (
    div('ch', x, 0, 1, vh()) +
    div('ch', 0, y, vw(), 1) +
    pillL('coord', x + 10, y + 18, `${Math.round(x)}, ${Math.round(y)}  ·  page ${Math.round(x + scrollX)}, ${Math.round(y + scrollY)}`)
  );
}

export function drawMarker(r: Rect, n: number): string {
  const x = clamp(r.left, 2, vw() - 22);
  const y = clamp(r.top, 2, vh() - 22);
  return `<div class="mk" style="left:${r2(x - 9)}px;top:${r2(y - 9)}px">${n}</div>`;
}
