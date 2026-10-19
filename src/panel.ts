import { describeColor, isTransparent, parseColor, toHex } from './color';
import { renderedFont, splitFamilies, weightName } from './font';
import {
  accessibleName, borderSummary, classList, componentInfo, contrastInfo, cssSelector, directText, flowChildren,
  gapRects, isFocusable, letterSpacingInfo, lineHeightInfo, pxSides, radiusSummary, role, separation, textRects, visibleText,
} from './inspect';
import { I } from './icons';
import { esc, fmt, fmtPx, num, rectOf, trunc } from './util';

type RowOpts = { swatch?: string; html?: boolean; copy?: string; muted?: boolean };

function row(label: string, value: string, o: RowOpts = {}): string {
  const copy = o.copy ?? value;
  const sw = o.swatch ? `<i class="sw"><i style="background:${esc(o.swatch)}"></i></i>` : '';
  return `<div class="row"><span class="k">${esc(label)}</span><span class="v${o.muted ? ' mu' : ''}" data-copy="${esc(copy)}" title="Click to copy">${sw}${o.html ? value : esc(value)}</span></div>`;
}

function section(id: string, title: string, body: string, closed: Set<string>, badge = ''): string {
  if (!body) return '';
  return `<details data-sec="${id}"${closed.has(id) ? '' : ' open'}><summary>${esc(title)}${badge ? `<span class="badge">${badge}</span>` : ''}</summary><div class="sb">${body}</div></details>`;
}

const v0 = (n: number) => (n ? fmt(n) : '–');

function boxDiagram(cs: CSSStyleDeclaration, w: number, h: number): string {
  const s = (p: string, suf = '') => ['top', 'right', 'bottom', 'left'].map((x) => num(cs.getPropertyValue(`${p}-${x}${suf}`)));
  const m = s('margin');
  const b = s('border', '-width');
  const p = s('padding');
  const layer = (cls: string, label: string, v: number[], inner: string) =>
    `<div class="bm ${cls}"><span class="bl">${label}</span><span class="t">${v0(v[0])}</span><span class="l">${v0(v[3])}</span><div class="in">${inner}</div><span class="r">${v0(v[1])}</span><span class="b">${v0(v[2])}</span></div>`;
  const cw = w - b[1] - b[3] - p[1] - p[3];
  const ch = h - b[0] - b[2] - p[0] - p[2];
  return layer('bm-m', 'margin', m, layer('bm-b', 'border', b, layer('bm-p', 'padding', p, `<div class="bm-c">${fmt(cw)} × ${fmt(ch)}</div>`)));
}

function colorRow(label: string, css: string): string {
  const c = parseColor(css);
  if (!c) return row(label, css);
  return row(label, describeColor(c), { swatch: css, copy: toHex(c) });
}

/** Full property list, grouped in collapsible sections. */
export function detailsHTML(el: Element, closed: Set<string>): string {
  const cs = getComputedStyle(el);
  const r = rectOf(el);
  const tag = el.tagName.toLowerCase();
  const comp = componentInfo(el);
  const text = visibleText(el);
  const parent = el.parentElement;
  let h = '';

  /* Element --------------------------------------------------------- */
  let b = row('Selector', cssSelector(el));
  if (comp) {
    b += row(comp.framework, comp.names.map((n) => `<${n}>`).join(' ‹ '));
    if (comp.source) b += row('Source', comp.source);
  }
  const ro = role(el);
  b += row('Role', ro.role + (ro.implicit ? ' (implicit)' : ''), { copy: ro.role, muted: ro.implicit });
  const name = accessibleName(el);
  if (name) b += row('Name', trunc(name, 80), { copy: name });
  if (text) b += row('Text', `“${trunc(text, 120)}”`, { copy: text });
  b += row('Children', `${el.children.length} element${el.children.length === 1 ? '' : 's'}`);
  h += section('el', 'Element', b, closed);

  /* Size & position ------------------------------------------------- */
  b = row('Size', `${fmt(r.width)} × ${fmt(r.height)}`);
  b += row('Viewport', `x ${fmt(r.left)}  y ${fmt(r.top)}`, { copy: `${fmt(r.left)}, ${fmt(r.top)}` });
  b += row('Page', `x ${fmt(r.left + scrollX)}  y ${fmt(r.top + scrollY)}`, { copy: `${fmt(r.left + scrollX)}, ${fmt(r.top + scrollY)}` });
  for (const [k, v, skip] of [
    ['Min width', cs.minWidth, ['0px', 'auto']], ['Max width', cs.maxWidth, ['none']],
    ['Min height', cs.minHeight, ['0px', 'auto']], ['Max height', cs.maxHeight, ['none']],
    ['Aspect ratio', cs.aspectRatio, ['auto']],
  ] as [string, string, string[]][]) {
    if (v && !skip.includes(v)) b += row(k, v);
  }
  if (parent) {
    const pr = rectOf(parent);
    b += row('In parent', `↑${fmt(r.top - pr.top)}  →${fmt(pr.right - r.right)}  ↓${fmt(pr.bottom - r.bottom)}  ←${fmt(r.left - pr.left)}`);
  }
  const prev = el.previousElementSibling;
  const next = el.nextElementSibling;
  if (prev) b += row('Prev sibling', separation(rectOf(prev), r));
  if (next) b += row('Next sibling', separation(r, rectOf(next)));
  h += section('size', 'Size & position', b, closed);

  /* Box model ------------------------------------------------------- */
  b = boxDiagram(cs, r.width, r.height);
  b += row('Padding', pxSides(cs, 'padding'));
  b += row('Margin', pxSides(cs, 'margin'));
  b += row('Border', pxSides(cs, 'border', '-width'));
  b += row('Box sizing', cs.boxSizing);
  h += section('box', 'Box model', b, closed);

  /* Layout ---------------------------------------------------------- */
  b = row('Display', cs.display);
  b += row('Position', cs.position);
  if (cs.position !== 'static') {
    const ins = (['top', 'right', 'bottom', 'left'] as const).map((s) => `${s} ${cs[s]}`).join('  ');
    b += row('Inset', ins, { copy: (['top', 'right', 'bottom', 'left'] as const).map((s) => cs[s]).join(' ') });
  }
  if (cs.zIndex !== 'auto') b += row('Z-index', cs.zIndex);
  if (cs.float !== 'none') b += row('Float', cs.float);
  if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') b += row('Overflow', cs.overflowX === cs.overflowY ? cs.overflowX : `${cs.overflowX} ${cs.overflowY}`);
  const isFlex = cs.display.includes('flex');
  const isGrid = cs.display.includes('grid');
  if (isFlex) {
    b += row('Direction', cs.flexDirection);
    b += row('Wrap', cs.flexWrap);
    b += row('Justify', cs.justifyContent);
    b += row('Align items', cs.alignItems);
    if (cs.flexWrap !== 'nowrap') b += row('Align content', cs.alignContent);
  }
  if (isGrid) {
    b += row('Columns', cs.gridTemplateColumns);
    b += row('Rows', cs.gridTemplateRows);
    b += row('Auto flow', cs.gridAutoFlow);
    b += row('Justify items', cs.justifyItems);
    b += row('Align items', cs.alignItems);
  }
  if (isFlex || isGrid) {
    b += row('Row gap', cs.rowGap === 'normal' ? 'normal' : fmtPx(cs.rowGap));
    b += row('Column gap', cs.columnGap === 'normal' ? 'normal' : fmtPx(cs.columnGap));
  }
  const gaps = gapRects(el);
  if (gaps.length) {
    const xs = [...new Set(gaps.filter((g) => g.axis === 'x').map((g) => fmt(g.size)))];
    const ys = [...new Set(gaps.filter((g) => g.axis === 'y').map((g) => fmt(g.size)))];
    if (xs.length) b += row('Measured ↔', xs.join(', '));
    if (ys.length) b += row('Measured ↕', ys.join(', '));
  }
  const kids = flowChildren(el).length;
  if (kids) b += row('Flow children', String(kids));
  if (parent) {
    const pcs = getComputedStyle(parent);
    if (pcs.display.includes('flex')) {
      b += row('Flex', `${cs.flexGrow} ${cs.flexShrink} ${cs.flexBasis}`);
      if (cs.alignSelf !== 'auto') b += row('Align self', cs.alignSelf);
      if (cs.order !== '0') b += row('Order', cs.order);
    }
    if (pcs.display.includes('grid')) {
      b += row('Grid column', cs.gridColumn);
      b += row('Grid row', cs.gridRow);
      if (cs.justifySelf !== 'auto') b += row('Justify self', cs.justifySelf);
      if (cs.alignSelf !== 'auto') b += row('Align self', cs.alignSelf);
    }
  }
  h += section('layout', 'Layout', b, closed, isFlex ? 'flex' : isGrid ? 'grid' : '');

  /* Typography ------------------------------------------------------ */
  const isField = /^(input|textarea|select|button)$/.test(tag);
  if (text || isField) {
    const fs = num(cs.fontSize);
    const lh = lineHeightInfo(cs);
    const fams = splitFamilies(cs.fontFamily);
    const used = renderedFont(cs.fontFamily);
    b = `<div class="spec" style="font-family:${esc(cs.fontFamily)};font-weight:${esc(cs.fontWeight)};font-style:${esc(cs.fontStyle)};letter-spacing:${esc(cs.letterSpacing)}">Ag<span>${esc(
      trunc(directText(el) || text, 40),
    )}</span></div>`;
    b += row('Font', used, { copy: used });
    if (fams.length > 1 || fams[0] !== used) b += row('Stack', cs.fontFamily, { muted: true });
    b += row('Size', `${fmt(fs)}px · ${fmt(fs / 16, 3)}rem`, { copy: `${fmt(fs)}px` });
    b += row('Weight', `${cs.fontWeight} ${weightName(cs.fontWeight)}`, { copy: cs.fontWeight });
    b += row('Line height', lh.text, { copy: cs.lineHeight });
    b += row('Letter spacing', letterSpacingInfo(cs), { copy: cs.letterSpacing });
    if (cs.wordSpacing !== '0px' && cs.wordSpacing !== 'normal') b += row('Word spacing', cs.wordSpacing);
    if (cs.fontStyle !== 'normal') b += row('Style', cs.fontStyle);
    b += row('Align', cs.textAlign);
    if (cs.textTransform !== 'none') b += row('Transform', cs.textTransform);
    if (cs.textDecorationLine !== 'none') b += row('Decoration', `${cs.textDecorationLine} ${cs.textDecorationStyle} ${toHexMaybe(cs.textDecorationColor)}`);
    if (cs.textIndent !== '0px') b += row('Indent', cs.textIndent);
    if (cs.whiteSpace !== 'normal') b += row('White space', cs.whiteSpace);
    if (cs.textOverflow !== 'clip') b += row('Overflow', cs.textOverflow);
    if (cs.verticalAlign !== 'baseline') b += row('Vertical align', cs.verticalAlign);
    const clampV = cs.getPropertyValue('-webkit-line-clamp');
    if (clampV && clampV !== 'none') b += row('Line clamp', clampV);
    if (cs.fontVariantNumeric && cs.fontVariantNumeric !== 'normal') b += row('Numeric', cs.fontVariantNumeric);
    if (cs.fontFeatureSettings && cs.fontFeatureSettings !== 'normal') b += row('Features', cs.fontFeatureSettings);
    if (cs.fontStretch && cs.fontStretch !== '100%' && cs.fontStretch !== 'normal') b += row('Stretch', cs.fontStretch);
    const smooth = cs.getPropertyValue('-webkit-font-smoothing');
    if (smooth && smooth !== 'auto') b += row('Smoothing', smooth);
    if (cs.textShadow !== 'none') b += row('Text shadow', cs.textShadow);
    const lines = textRects(el).length;
    if (lines) b += row('Rendered lines', String(lines));
    h += section('type', 'Typography', b, closed, `${fmt(fs)}/${fmt(lh.px)}`);
  }

  /* Colors ---------------------------------------------------------- */
  b = colorRow('Text', cs.color);
  if (!isTransparent(cs.backgroundColor)) b += colorRow('Background', cs.backgroundColor);
  if (cs.backgroundImage !== 'none') b += row('Bg image', trunc(cs.backgroundImage, 90), { swatch: cs.backgroundImage, copy: cs.backgroundImage });
  const bset = new Set<string>();
  for (const s of ['top', 'right', 'bottom', 'left']) {
    if (num(cs.getPropertyValue(`border-${s}-width`)) > 0 && cs.getPropertyValue(`border-${s}-style`) !== 'none') bset.add(cs.getPropertyValue(`border-${s}-color`));
  }
  for (const c of bset) b += colorRow('Border', c);
  if (cs.outlineStyle !== 'none' && num(cs.outlineWidth) > 0) b += colorRow('Outline', cs.outlineColor);
  const fill = cs.getPropertyValue('fill');
  if (el instanceof SVGElement && fill && fill !== 'none') b += colorRow('Fill', fill);
  const stroke = cs.getPropertyValue('stroke');
  if (el instanceof SVGElement && stroke && stroke !== 'none') b += colorRow('Stroke', stroke);
  if (text) {
    const ci = contrastInfo(el, cs);
    if (ci) {
      const badge = (ok: boolean, label: string) => `<span class="wc ${ok ? 'ok' : 'no'}">${label} ${ok ? '✓' : '✕'}</span>`;
      b += row('Contrast', `<b>${fmt(ci.ratio, 2)}:1</b> ${badge(ci.aa, 'AA')}${badge(ci.aaa, 'AAA')}`, { html: true, copy: `${fmt(ci.ratio, 2)}:1` });
      b += row('Against', `${describeColor(ci.bg)}${ci.hasImage ? ' (bg image ignored)' : ''}${ci.large ? ' · large text' : ''}`, {
        swatch: `rgb(${ci.bg.r},${ci.bg.g},${ci.bg.b})`,
        copy: toHex(ci.bg),
        muted: true,
      });
    }
  }
  h += section('color', 'Colors', b, closed);

  /* Appearance ------------------------------------------------------ */
  b = '';
  const border = borderSummary(cs);
  if (border) b += row('Border', border);
  const rad = radiusSummary(cs);
  if (rad !== '0') b += row('Radius', rad);
  if (cs.outlineStyle !== 'none' && num(cs.outlineWidth) > 0) b += row('Outline', `${fmtPx(cs.outlineWidth)}px ${cs.outlineStyle} offset ${fmtPx(cs.outlineOffset)}`);
  if (cs.boxShadow !== 'none') b += row('Shadow', cs.boxShadow);
  if (cs.opacity !== '1') b += row('Opacity', `${fmt(num(cs.opacity) * 100, 1)}%`, { copy: cs.opacity });
  if (cs.transform !== 'none') b += row('Transform', cs.transform);
  if (cs.filter !== 'none') b += row('Filter', cs.filter);
  const bdf = cs.getPropertyValue('backdrop-filter');
  if (bdf && bdf !== 'none') b += row('Backdrop', bdf);
  if (cs.mixBlendMode !== 'normal') b += row('Blend', cs.mixBlendMode);
  if (cs.visibility !== 'visible') b += row('Visibility', cs.visibility);
  if (cs.cursor !== 'auto') b += row('Cursor', cs.cursor);
  if (cs.transitionDuration && !/^0s(, 0s)*$/.test(cs.transitionDuration)) b += row('Transition', `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`);
  if (cs.animationName !== 'none') b += row('Animation', `${cs.animationName} ${cs.animationDuration}`);
  if (cs.objectFit && cs.objectFit !== 'fill') b += row('Object fit', cs.objectFit);
  if (cs.pointerEvents !== 'auto') b += row('Pointer events', cs.pointerEvents);
  h += section('look', 'Appearance', b, closed);

  /* Accessibility --------------------------------------------------- */
  b = row('Role', ro.role);
  b += row('Accessible name', name || '(none)', { muted: !name, copy: name });
  b += row('Focusable', isFocusable(el) ? 'yes' : 'no');
  const ti = el.getAttribute('tabindex');
  if (ti !== null) b += row('Tabindex', ti);
  for (const a of Array.from(el.attributes)) if (a.name.startsWith('aria-')) b += row(a.name, trunc(a.value, 80), { copy: a.value });
  if (tag === 'img') b += row('Alt', el.getAttribute('alt') ?? '(missing)', { muted: !el.hasAttribute('alt') });
  if ((r.width < 24 || r.height < 24) && isFocusable(el)) b += row('Target size', `${fmt(r.width)} × ${fmt(r.height)} (below 24 × 24)`);
  h += section('a11y', 'Accessibility', b, closed);

  /* Attributes ------------------------------------------------------ */
  b = '';
  for (const a of Array.from(el.attributes)) {
    if (a.name.startsWith('aria-')) continue;
    b += row(a.name, trunc(a.value, 140) || '""', { copy: a.value });
  }
  h += section('attrs', 'Attributes', b, closed, String(el.attributes.length));

  return h;
}

function toHexMaybe(css: string): string {
  const c = parseColor(css);
  return c ? describeColor(c) : css;
}

/* ------------------------------------------------------------------ */
/* Spec card: the at-a-glance summary at the top of the popover        */
/* ------------------------------------------------------------------ */

const chip = (label: string, copy: string, opts: { swatch?: string; dim?: string; cls?: string; icon?: string; name?: string } = {}) =>
  `<button class="chip${opts.cls ? ` ${opts.cls}` : ''}" data-copy="${esc(copy)}" title="${opts.name ? `${esc(opts.name)}. ` : ''}Click to copy">${
    opts.swatch ? `<i class="sw"><i style="background:${esc(opts.swatch)}"></i></i>` : ''
  }${opts.icon ? `<span class="ci" aria-label="${esc(opts.name ?? '')}">${opts.icon}</span>` : ''}${opts.dim ? `<span class="cd">${esc(opts.dim)}</span>` : ''}${esc(label)}</button>`;

const specRow = (label: string, chips: string) => (chips ? `<div class="sr"><span class="sk">${esc(label)}</span><div class="sc">${chips}</div></div>` : '');

const px = (v: string) => v.split(' ').map((x) => (/^-?[\d.]+$/.test(x) && x !== '0' ? `${x}px` : x)).join(' ');

export function specsHTML(el: Element): string {
  const cs = getComputedStyle(el);
  const r = rectOf(el);
  const text = directText(el) || (el.children.length <= 2 ? visibleText(el) : '');
  let h = '';

  h += specRow('Size', chip(`${fmt(r.width)} × ${fmt(r.height)}`, `width: ${fmt(r.width)}px; height: ${fmt(r.height)}px;`));

  const pad = pxSides(cs, 'padding');
  const mar = pxSides(cs, 'margin');
  let sp = '';
  if (pad !== '0') sp += chip(pad, px(pad), { icon: I.padding, name: 'Padding', cls: 'c-pad' });
  if (mar !== '0') sp += chip(mar, px(mar), { icon: I.margin, name: 'Margin', cls: 'c-mar' });
  const d = cs.display;
  const isFlex = d.includes('flex');
  const isGrid = d.includes('grid');
  if (isFlex || isGrid) {
    const rg = cs.rowGap === 'normal' ? '0' : fmtPx(cs.rowGap);
    const cg = cs.columnGap === 'normal' ? '0' : fmtPx(cs.columnGap);
    const gap = rg === cg ? rg : `${rg} ${cg}`;
    const vertical = isFlex && cs.flexDirection.startsWith('column');
    if (gap !== '0') sp += chip(gap, px(gap), { icon: vertical ? I.gapV : I.gapH, name: 'Gap', cls: 'c-gap' });
  } else {
    const rects = gapRects(el);
    const gaps = [...new Set(rects.map((g) => fmt(g.size)))];
    const vertical = rects.length > 0 && rects.every((g) => g.axis === 'y');
    if (gaps.length) sp += chip(gaps.slice(0, 3).join(', '), gaps.join(', '), { icon: vertical ? I.gapV : I.gapH, name: 'Space between children', cls: 'c-gap' });
  }
  h += specRow('Spacing', sp);

  if (isFlex || isGrid) {
    const dir = isGrid ? `grid · ${cs.gridTemplateColumns.split(' ').length} cols` : `flex ${cs.flexDirection}${cs.flexWrap !== 'nowrap' ? ' wrap' : ''}`;
    let lay = chip(dir, isGrid ? `display: grid; grid-template-columns: ${cs.gridTemplateColumns};` : `display: flex; flex-direction: ${cs.flexDirection};`);
    if (cs.justifyContent !== 'normal') lay += chip(cs.justifyContent, `justify-content: ${cs.justifyContent};`, { dim: 'justify ' });
    if (cs.alignItems !== 'normal') lay += chip(cs.alignItems, `align-items: ${cs.alignItems};`, { dim: 'align ' });
    h += specRow('Layout', lay);
  }

  if (text) {
    const fs = num(cs.fontSize);
    const lh = lineHeightInfo(cs);
    const font = renderedFont(cs.fontFamily);
    let t = chip(font, cs.fontFamily);
    t += chip(`${fmt(fs)} / ${fmt(lh.px, 1)}`, `font-size: ${fmt(fs)}px; line-height: ${cs.lineHeight};`);
    t += chip(`${cs.fontWeight}${weightName(cs.fontWeight) ? ` ${weightName(cs.fontWeight)}` : ''}`, cs.fontWeight);
    if (cs.letterSpacing !== 'normal' && num(cs.letterSpacing) !== 0) {
      const em = fmt(num(cs.letterSpacing) / (fs || 16), 3);
      t += chip(`${fmt(num(cs.letterSpacing))}px · ${em}em`, cs.letterSpacing, { dim: 'tracking ' });
    }
    if (cs.textTransform !== 'none') t += chip(cs.textTransform, cs.textTransform);
    h += specRow('Type', t);
  }

  let col = '';
  if (text) col += colorChip(cs.color, 'Text ');
  if (!isTransparent(cs.backgroundColor)) col += colorChip(cs.backgroundColor, 'Fill ');
  if (cs.backgroundImage !== 'none' && cs.backgroundImage.includes('gradient')) col += chip('gradient', cs.backgroundImage, { swatch: cs.backgroundImage });
  if (text) {
    const ci = contrastInfo(el, cs);
    if (ci) col += `<span class="cr ${ci.aa ? 'ok' : 'no'}" title="${ci.aa ? 'Passes' : 'Fails'} WCAG AA${ci.large ? ' (large text)' : ''}">${fmt(ci.ratio, 1)}:1 ${ci.aa ? 'AA' : 'fails AA'}</span>`;
  }
  h += specRow('Color', col);

  let look = '';
  const rad = radiusSummary(cs);
  if (rad !== '0') look += chip(rad, `border-radius: ${px(rad)};`, { dim: 'Radius ' });
  const border = borderSummary(cs);
  if (border) look += chip(border.length > 28 ? 'mixed' : border, border, { dim: 'Border ' });
  if (cs.boxShadow !== 'none') look += chip('shadow', `box-shadow: ${cs.boxShadow};`);
  if (cs.opacity !== '1') look += chip(`${fmt(num(cs.opacity) * 100, 0)}%`, cs.opacity, { dim: 'Opacity ' });
  h += specRow('Style', look);

  return `<div class="specs">${h}</div>`;
}

function colorChip(css: string, dim: string): string {
  const c = parseColor(css);
  if (!c) return '';
  return chip(describeColor(c), toHex(c), { swatch: css, dim });
}
