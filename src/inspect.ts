import { contrast, effectiveBackground, hexOf, isTransparent, over, parseColor } from './color';
import { renderedFont, weightName } from './font';
import { fmt, fmtPx, mkRect, num, rectOf, sides4, trunc, type Rect } from './util';

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export function classList(el: Element): string[] {
  const c = el.getAttribute('class');
  return c ? c.trim().split(/\s+/).filter(Boolean) : [];
}

/** `div#id.cls1.cls2` */
export function shortName(el: Element, maxClasses = 2): string {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  const cls = classList(el);
  if (cls.length) s += '.' + cls.slice(0, maxClasses).join('.') + (cls.length > maxClasses ? '…' : '');
  return s;
}

const cssEscape = (s: string) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&'));

/** A reasonably short, reasonably unique selector. */
export function cssSelector(el: Element, maxDepth = 5): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && parts.length < maxDepth) {
    const tag = node.tagName.toLowerCase();
    if (node.id && !/^\d/.test(node.id)) {
      parts.unshift(`#${cssEscape(node.id)}`);
      break;
    }
    if (node === document.body || node === document.documentElement) {
      parts.unshift(tag);
      break;
    }
    let part = tag;
    const cls = classList(node)
      .filter((c) => c.length < 32 && !/[:[\]/@!]/.test(c))
      .slice(0, 2);
    if (cls.length) part += cls.map((c) => '.' + cssEscape(c)).join('');
    const parent: Element | null = node.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((s) => s.tagName === node!.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
}

/* ------------------------------------------------------------------ */
/* Framework components                                                */
/* ------------------------------------------------------------------ */

export interface ComponentInfo {
  framework: 'React' | 'Vue' | 'Svelte';
  names: string[];
  source?: string;
}

const REACT_SKIP = /^(Fragment|Suspense|StrictMode|Profiler|Provider|Consumer|Context|ForwardRef|Memo)$/;

export function componentInfo(el: Element): ComponentInfo | null {
  const anyEl = el as any;

  // React (16+): fiber pointer stored on the DOM node.
  const fiberKey = Object.keys(anyEl).find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
  if (fiberKey) {
    let f = anyEl[fiberKey];
    const names: string[] = [];
    let source: string | undefined;
    let guard = 0;
    while (f && names.length < 5 && guard++ < 200) {
      const t = f.type;
      if (t && typeof t !== 'string') {
        const name: string | undefined =
          typeof t === 'function'
            ? t.displayName || t.name
            : t.displayName || t.render?.displayName || t.render?.name || t.type?.displayName || t.type?.name;
        if (name && !REACT_SKIP.test(name)) {
          names.push(name);
          const src = f._debugSource;
          if (!source && src?.fileName) source = `${src.fileName}:${src.lineNumber}`;
        }
      }
      f = f.return;
    }
    if (names.length) return { framework: 'React', names, source };
  }

  // Vue 3
  let n: any = el;
  for (let i = 0; n && i < 8; i++, n = n.parentElement) {
    const inst = n.__vueParentComponent;
    if (inst) {
      const names: string[] = [];
      let source: string | undefined;
      let cur = inst;
      while (cur && names.length < 5) {
        const name = cur.type?.name || cur.type?.__name;
        if (name) names.push(name);
        if (!source && cur.type?.__file) source = cur.type.__file;
        cur = cur.parent;
      }
      if (names.length) return { framework: 'Vue', names, source };
    }
    // Vue 2
    const vm = n.__vue__;
    if (vm) {
      const names: string[] = [];
      let cur = vm;
      while (cur && names.length < 5) {
        const name = cur.$options?.name || cur.$options?._componentTag;
        if (name) names.push(name);
        cur = cur.$parent;
      }
      if (names.length) return { framework: 'Vue', names, source: vm.$options?.__file };
    }
  }

  // Svelte (dev mode)
  const meta = anyEl.__svelte_meta;
  if (meta?.loc) {
    const file: string = meta.loc.file || '';
    const name = file.split('/').pop()?.replace(/\.svelte$/, '') || 'Component';
    return { framework: 'Svelte', names: [name], source: `${file}:${meta.loc.line}` };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Accessibility                                                       */
/* ------------------------------------------------------------------ */

export function role(el: Element): { role: string; implicit: boolean } {
  const explicit = el.getAttribute('role');
  if (explicit) return { role: explicit, implicit: false };
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  const map: Record<string, string> = {
    a: el.hasAttribute('href') ? 'link' : 'generic',
    button: 'button', nav: 'navigation', main: 'main', header: 'banner', footer: 'contentinfo',
    aside: 'complementary', form: 'form', table: 'table', thead: 'rowgroup', tbody: 'rowgroup', tr: 'row',
    th: 'columnheader', td: 'cell', ul: 'list', ol: 'list', li: 'listitem', img: el.getAttribute('alt') === '' ? 'presentation' : 'img',
    textarea: 'textbox', select: el.hasAttribute('multiple') ? 'listbox' : 'combobox', option: 'option',
    article: 'article', dialog: 'dialog', section: 'region', hr: 'separator', progress: 'progressbar',
    h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
    p: 'paragraph', label: 'label', fieldset: 'group', details: 'group', summary: 'button', svg: 'graphics-document',
  };
  if (tag === 'input') {
    const inputRoles: Record<string, string> = {
      checkbox: 'checkbox', radio: 'radio', range: 'slider', button: 'button', submit: 'button', reset: 'button',
      image: 'button', number: 'spinbutton', search: 'searchbox', email: 'textbox', tel: 'textbox', url: 'textbox',
      text: 'textbox', password: 'textbox', hidden: 'none',
    };
    return { role: inputRoles[type] || 'textbox', implicit: true };
  }
  return { role: map[tag] || 'generic', implicit: true };
}

export function accessibleName(el: Element): string {
  const label = el.getAttribute('aria-label');
  if (label) return label.trim();
  const by = el.getAttribute('aria-labelledby');
  if (by) {
    const txt = by
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() || '')
      .join(' ')
      .trim();
    if (txt) return txt;
  }
  const tag = el.tagName.toLowerCase();
  if (tag === 'img' || (tag === 'input' && el.getAttribute('type') === 'image')) return el.getAttribute('alt') ?? '';
  if (/^(input|select|textarea)$/.test(tag)) {
    const id = el.id;
    const lbl = (id && document.querySelector(`label[for="${cssEscape(id)}"]`)) || el.closest('label');
    if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    const ph = el.getAttribute('placeholder');
    if (ph) return ph;
  }
  const title = el.getAttribute('title');
  if (title) return title;
  const r = role(el).role;
  if (/^(link|button|heading|listitem|cell|columnheader|option|tab|menuitem|label|summary)$/.test(r)) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return '';
}

export function isFocusable(el: Element): boolean {
  if ((el as HTMLElement).tabIndex >= 0) return true;
  return el.matches('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"]');
}

/* ------------------------------------------------------------------ */
/* Text & geometry helpers                                             */
/* ------------------------------------------------------------------ */

export function directText(el: Element): string {
  let s = '';
  for (const n of Array.from(el.childNodes)) if (n.nodeType === 3) s += n.textContent;
  return s.replace(/\s+/g, ' ').trim();
}

export function visibleText(el: Element): string {
  const t = (el as HTMLElement).innerText ?? el.textContent ?? '';
  return t.replace(/\s+/g, ' ').trim();
}

/** Client rects of each line of direct text in the element. */
export function textRects(el: Element, limit = 300): Rect[] {
  const out: Rect[] = [];
  const range = document.createRange();
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType !== 3 || !n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width > 0 && r.height > 0) out.push(mkRect(r.left, r.top, r.right, r.bottom));
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export interface Gap {
  rect: Rect;
  size: number;
  axis: 'x' | 'y';
}

/** Visible in-flow children, in DOM order. */
export function flowChildren(el: Element): Element[] {
  const out: Element[] = [];
  for (const k of Array.from(el.children)) {
    const cs = getComputedStyle(k);
    if (cs.display === 'none' || cs.display === 'contents' || cs.position === 'absolute' || cs.position === 'fixed') continue;
    const r = k.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0) continue;
    out.push(k);
  }
  return out;
}

/** Empty space between consecutive children (flex gap, grid gap, margins, etc). */
export function gapRects(el: Element): Gap[] {
  const kids = flowChildren(el).map(rectOf);
  const out: Gap[] = [];
  for (let i = 0; i < kids.length - 1; i++) {
    const a = kids[i];
    const b = kids[i + 1];
    const ovY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const ovX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const top = Math.min(a.top, b.top);
    const bottom = Math.max(a.bottom, b.bottom);
    const left = Math.min(a.left, b.left);
    const right = Math.max(a.right, b.right);
    if (ovY > 0 && b.left - a.right >= 0.5) out.push({ axis: 'x', size: b.left - a.right, rect: mkRect(a.right, top, b.left, bottom) });
    else if (ovY > 0 && a.left - b.right >= 0.5) out.push({ axis: 'x', size: a.left - b.right, rect: mkRect(b.right, top, a.left, bottom) });
    else if (ovX > 0 && b.top - a.bottom >= 0.5) out.push({ axis: 'y', size: b.top - a.bottom, rect: mkRect(left, a.bottom, right, b.top) });
    else if (ovX > 0 && a.top - b.bottom >= 0.5) out.push({ axis: 'y', size: a.top - b.bottom, rect: mkRect(left, b.bottom, right, a.top) });
  }
  return out;
}

/** Straight-line gap between two rects if they are separated along an axis. */
export function separation(a: Rect, b: Rect): string {
  const parts: string[] = [];
  if (b.left >= a.right) parts.push(`${fmt(b.left - a.right)} →`);
  else if (a.left >= b.right) parts.push(`← ${fmt(a.left - b.right)}`);
  if (b.top >= a.bottom) parts.push(`${fmt(b.top - a.bottom)} ↓`);
  else if (a.top >= b.bottom) parts.push(`↑ ${fmt(a.top - b.bottom)}`);
  return parts.join('  ') || 'overlapping';
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export function pxSides(cs: CSSStyleDeclaration, prefix: string, suffix = ''): string {
  const g = (s: string) => fmtPx(cs.getPropertyValue(`${prefix}-${s}${suffix}`));
  return sides4(g('top'), g('right'), g('bottom'), g('left'));
}

export function radiusSummary(cs: CSSStyleDeclaration): string {
  const v = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((x) =>
    x.includes('%') || x.includes(' ') ? x : fmtPx(x),
  );
  return sides4(v[0], v[1], v[2], v[3]);
}

export function borderSummary(cs: CSSStyleDeclaration): string | null {
  const sides = ['top', 'right', 'bottom', 'left'].map((s) => ({
    s,
    w: num(cs.getPropertyValue(`border-${s}-width`)),
    st: cs.getPropertyValue(`border-${s}-style`),
    c: cs.getPropertyValue(`border-${s}-color`),
  }));
  const vis = sides.filter((x) => x.w > 0 && x.st !== 'none' && x.st !== 'hidden');
  if (!vis.length) return null;
  const key = (x: (typeof sides)[0]) => `${fmt(x.w)}px ${x.st} ${hexOf(x.c)}`;
  if (vis.length === 4 && vis.every((x) => key(x) === key(vis[0]))) return key(vis[0]);
  return vis.map((x) => `${x.s}: ${key(x)}`).join(', ');
}

export function lineHeightInfo(cs: CSSStyleDeclaration): { px: number; text: string } {
  const fs = num(cs.fontSize);
  if (cs.lineHeight === 'normal') return { px: fs * 1.2, text: `normal (≈${fmt(fs * 1.2)}px)` };
  const lh = num(cs.lineHeight);
  return { px: lh, text: `${fmt(lh)}px · ${fmt(lh / fs, 3)}` };
}

export function letterSpacingInfo(cs: CSSStyleDeclaration): string {
  if (cs.letterSpacing === 'normal') return 'normal · 0';
  const fs = num(cs.fontSize) || 16;
  const ls = num(cs.letterSpacing);
  return `${fmt(ls)}px · ${fmt(ls / fs, 3)}em · ${fmt((ls / fs) * 100, 1)}%`;
}

export function contrastInfo(el: Element, cs = getComputedStyle(el)) {
  const fg = parseColor(cs.color);
  if (!fg) return null;
  const { color: bg, hasImage } = effectiveBackground(el);
  const ratio = contrast(over(fg, bg), bg);
  const fs = num(cs.fontSize);
  const large = fs >= 24 || (fs >= 18.66 && num(cs.fontWeight) >= 700);
  return {
    ratio,
    bg,
    hasImage,
    large,
    aa: ratio >= (large ? 3 : 4.5),
    aaa: ratio >= (large ? 4.5 : 7),
  };
}

export function layoutSummary(cs: CSSStyleDeclaration): string {
  const d = cs.display;
  const parts = [d];
  if (d.includes('flex')) {
    parts.push(cs.flexDirection);
    if (cs.flexWrap !== 'nowrap') parts.push(cs.flexWrap);
    if (cs.justifyContent !== 'normal') parts.push(`justify ${cs.justifyContent}`);
    if (cs.alignItems !== 'normal') parts.push(`align ${cs.alignItems}`);
  }
  if (d.includes('grid')) {
    parts.push(`cols ${trunc(cs.gridTemplateColumns, 60)}`);
    if (cs.gridTemplateRows !== 'none') parts.push(`rows ${trunc(cs.gridTemplateRows, 40)}`);
  }
  if ((d.includes('flex') || d.includes('grid')) && (cs.rowGap !== 'normal' || cs.columnGap !== 'normal')) {
    const rg = cs.rowGap === 'normal' ? '0' : fmtPx(cs.rowGap);
    const cg = cs.columnGap === 'normal' ? '0' : fmtPx(cs.columnGap);
    parts.push(`gap ${rg === cg ? rg : `${rg} ${cg}`}`);
  }
  return parts.join(', ');
}

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

export function cssFor(el: Element): string {
  const cs = getComputedStyle(el);
  const r = rectOf(el);
  const lines: string[] = [];
  const add = (p: string, v: string | null | undefined, skip: string[] = []) => {
    if (v && !skip.includes(v)) lines.push(`  ${p}: ${v};`);
  };
  add('width', `${fmt(r.width)}px`);
  add('height', `${fmt(r.height)}px`);
  add('display', cs.display);
  if (cs.position !== 'static') {
    add('position', cs.position);
    for (const s of ['top', 'right', 'bottom', 'left'] as const) add(s, cs[s], ['auto']);
  }
  add('z-index', cs.zIndex, ['auto']);
  if (cs.display.includes('flex')) {
    add('flex-direction', cs.flexDirection, ['row']);
    add('flex-wrap', cs.flexWrap, ['nowrap']);
    add('justify-content', cs.justifyContent, ['normal']);
    add('align-items', cs.alignItems, ['normal']);
  }
  if (cs.display.includes('grid')) {
    add('grid-template-columns', cs.gridTemplateColumns, ['none']);
    add('grid-template-rows', cs.gridTemplateRows, ['none']);
  }
  if (cs.display.includes('flex') || cs.display.includes('grid')) {
    add('row-gap', cs.rowGap, ['normal', '0px']);
    add('column-gap', cs.columnGap, ['normal', '0px']);
  }
  const pad = pxSides(cs, 'padding');
  if (pad !== '0') add('padding', pad.split(' ').map((v) => `${v}px`).join(' '));
  const mar = pxSides(cs, 'margin');
  if (mar !== '0') add('margin', mar.split(' ').map((v) => `${v}px`).join(' '));
  const border = borderSummary(cs);
  if (border && !border.includes(':')) add('border', border);
  else if (border) lines.push(`  /* border: ${border} */`);
  const rad = radiusSummary(cs);
  if (rad !== '0') add('border-radius', rad.split(' ').map((v) => (/^[\d.]+$/.test(v) ? `${v}px` : v)).join(' '));
  if (!isTransparent(cs.backgroundColor)) add('background-color', hexOf(cs.backgroundColor));
  add('background-image', cs.backgroundImage, ['none']);
  add('color', hexOf(cs.color));
  add('font-family', cs.fontFamily);
  add('font-size', cs.fontSize);
  add('font-weight', cs.fontWeight);
  add('font-style', cs.fontStyle, ['normal']);
  add('line-height', cs.lineHeight);
  add('letter-spacing', cs.letterSpacing, ['normal', '0px']);
  add('text-align', cs.textAlign, ['start']);
  add('text-transform', cs.textTransform, ['none']);
  add('box-shadow', cs.boxShadow, ['none']);
  add('opacity', cs.opacity, ['1']);
  add('transform', cs.transform, ['none']);
  add('filter', cs.filter, ['none']);
  add('overflow', cs.overflow, ['visible']);
  return `${cssSelector(el)} {\n${lines.join('\n')}\n}`;
}

export type AIDetail = 'compact' | 'full';

/**
 * Token-lean description: two short lines, only non-default values.
 *   button.cta "Start free trial" <Button> src/Header.tsx:12
 *   126×34 p:10 18 r:999 | system-ui 14/14 w600 ls:.01em | c:#FFF bg:#3581F6 contrast:3.7(fails AA)
 */
export function describeCompact(el: Element, note?: string): string {
  const cs = getComputedStyle(el);
  const r = rectOf(el);
  const comp = componentInfo(el);
  // Containers: skip the descendant text dump (and the inherited typography that goes with it).
  const text = trunc(directText(el) || (el.children.length <= 2 ? visibleText(el) : ''), 40);
  const hex = (css: string) => hexOf(css).replace(/^#([0-9A-F])\1([0-9A-F])\2([0-9A-F])\3$/, '#$1$2$3');

  let head = cssSelector(el, 3).replace(/ > /g, '>');
  if (text) head += ` "${text}"`;
  if (comp) head += ` <${comp.names[0]}>${comp.source ? ` ${comp.source.replace(/^.*?\/src\//, 'src/')}` : ''}`;

  const box: string[] = [`${fmt(r.width, 0)}×${fmt(r.height, 0)}`];
  const pad = pxSides(cs, 'padding');
  const mar = pxSides(cs, 'margin');
  if (pad !== '0') box.push(`p:${pad}`);
  if (mar !== '0') box.push(`m:${mar}`);
  const border = borderSummary(cs);
  if (border) box.push(`b:${border.replace(/px /, ' ').replace(' solid', '')}`);
  const rad = radiusSummary(cs);
  if (rad !== '0') box.push(`r:${rad}`);
  if (cs.boxShadow !== 'none') box.push('shadow');
  if (cs.opacity !== '1') box.push(`o:${cs.opacity}`);

  const groups = [box.join(' ')];
  const d = cs.display;
  if (d.includes('flex') || d.includes('grid')) {
    const lay = [d.includes('grid') ? 'grid' : cs.flexDirection.startsWith('column') ? 'col' : 'row'];
    const gap = cs.rowGap === cs.columnGap ? cs.rowGap : `${cs.rowGap} ${cs.columnGap}`;
    if (gap !== 'normal' && gap !== '0px') lay.push(`gap:${gap.replace(/px/g, '')}`);
    if (!/normal|flex-start|start/.test(cs.justifyContent)) lay.push(`jc:${cs.justifyContent}`);
    if (!/normal|stretch/.test(cs.alignItems)) lay.push(`ai:${cs.alignItems}`);
    if (d.includes('grid')) lay.push(`cols:${cs.gridTemplateColumns.split(' ').length}`);
    groups.push(lay.join(' '));
  }
  if (text) {
    const t = [`${renderedFont(cs.fontFamily)} ${fmtPx(cs.fontSize)}/${fmt(lineHeightInfo(cs).px, 1)} w${cs.fontWeight}`];
    if (cs.letterSpacing !== 'normal' && num(cs.letterSpacing) !== 0) t.push(`ls:${fmt(num(cs.letterSpacing) / (num(cs.fontSize) || 16), 3)}em`);
    if (cs.textTransform !== 'none') t.push(cs.textTransform);
    groups.push(t.join(' '));
  }
  const col = text ? [`c:${hex(cs.color)}`] : [];
  if (!isTransparent(cs.backgroundColor)) col.push(`bg:${hex(cs.backgroundColor)}`);
  const ci = text ? contrastInfo(el, cs) : null;
  if (ci && !ci.aa) col.push(`contrast:${fmt(ci.ratio, 1)}(fails AA)`);
  if (col.length) groups.push(col.join(' '));

  return `${note ? `${note}\n` : ''}${head}\n${groups.join(' | ')}`;
}

export function describe(el: Element, detail: AIDetail, note?: string): string {
  return detail === 'full' ? describeForAI(el, note) : describeCompact(el, note);
}

/** Markdown description intended to be pasted into an AI coding agent. */
export function describeForAI(el: Element, note?: string): string {
  const cs = getComputedStyle(el);
  const r = rectOf(el);
  const comp = componentInfo(el);
  const text = trunc(visibleText(el), 100);
  const lines: string[] = [];
  lines.push(`**\`${cssSelector(el)}\`**`);
  if (note) lines.push(`- Feedback: ${note}`);
  const cls = el.getAttribute('class');
  lines.push(`- Element: \`<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}${cls ? ` class="${trunc(cls, 120)}"` : ''}>\``);
  if (text) lines.push(`- Text: "${text}"`);
  if (comp) lines.push(`- ${comp.framework} component: ${comp.names.map((n) => `<${n}>`).join(' in ')}${comp.source ? ` (${comp.source})` : ''}`);
  lines.push(`- Size: ${fmt(r.width)} × ${fmt(r.height)} at x ${fmt(r.left + scrollX)}, y ${fmt(r.top + scrollY)} (page)`);
  const box: string[] = [];
  const pad = pxSides(cs, 'padding');
  const mar = pxSides(cs, 'margin');
  if (pad !== '0') box.push(`padding ${pad}`);
  if (mar !== '0') box.push(`margin ${mar}`);
  const border = borderSummary(cs);
  if (border) box.push(`border ${border}`);
  const rad = radiusSummary(cs);
  if (rad !== '0') box.push(`radius ${rad}`);
  if (box.length) lines.push(`- Box: ${box.join(' · ')}`);
  lines.push(`- Layout: ${layoutSummary(cs)}${cs.position !== 'static' ? `, position ${cs.position}` : ''}`);
  const gaps = gapRects(el);
  if (gaps.length) lines.push(`- Measured gaps between children: ${[...new Set(gaps.map((g) => fmt(g.size)))].join(', ')}`);
  if (text) {
    const lh = lineHeightInfo(cs);
    lines.push(
      `- Typography: ${renderedFont(cs.fontFamily)} ${fmtPx(cs.fontSize)}px / ${lh.text}, weight ${cs.fontWeight}, letter-spacing ${letterSpacingInfo(cs)}`,
    );
  }
  const colors = [`text ${hexOf(cs.color)}`];
  if (!isTransparent(cs.backgroundColor)) colors.push(`background ${hexOf(cs.backgroundColor)}`);
  const ci = text ? contrastInfo(el, cs) : null;
  if (ci) colors.push(`contrast ${fmt(ci.ratio, 2)}:1${ci.aa ? '' : ' (fails AA)'}`);
  lines.push(`- Colors: ${colors.join(', ')}`);
  if (cs.boxShadow !== 'none') lines.push(`- Shadow: ${cs.boxShadow}`);
  return lines.join('\n');
}
