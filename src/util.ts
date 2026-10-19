export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

export function mkRect(left: number, top: number, right: number, bottom: number): Rect {
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/** parseFloat that never returns NaN. */
export function num(v: string | null | undefined): number {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
}

/** Round to at most `digits` decimals and drop trailing zeros. */
export function fmt(n: number, digits = 2): string {
  const f = 10 ** digits;
  const r = Math.round(n * f) / f;
  return String(Object.is(r, -0) ? 0 : r);
}

/** "12.5px" -> "12.5" */
export function fmtPx(v: string): string {
  return fmt(num(v));
}

/** Collapse four side values into CSS shorthand form. */
export function sides4(t: string, r: string, b: string, l: string): string {
  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

export function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      /* ignore */
    }
    ta.remove();
    return ok;
  }
}
