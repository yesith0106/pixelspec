import { I } from './icons';
import { classList, componentInfo, cssFor, cssSelector, describe, describeCompact, describeForAI, type AIDetail } from './inspect';
import {
  boxes, drawBoxModel, drawChildGaps, drawCrosshair, drawEdgeGuides, drawLabels, drawMeasure, drawOutline, drawTextLines,
} from './overlay';
import { detailsHTML, specsHTML } from './panel';
import { STYLES } from './styles';
import { clamp, copyText, esc, rectOf, trunc, type Rect } from './util';

export type CopyKind = 'value' | 'css' | 'ai' | 'selector' | 'notes';

export interface InspectaOptions {
  /** Keyboard shortcut that toggles the inspector. Default `alt+shift+i`. Modifiers: alt, shift, ctrl, meta, mod (ctrl or ⌘). */
  hotkey?: string;
  /** Start with the inspector switched on. Default `false`. */
  startActive?: boolean;
  /** Show the floating toolbar. Default `true`. */
  showToolbar?: boolean;
  /** Initial toolbar corner (the user can drag it anywhere). Default `bottom-right`. */
  position?: 'bottom-right' | 'bottom-left';
  /** Initial "Copy for AI" detail. Users can change it in settings; Shift while copying uses the other one. */
  aiDetail?: AIDetail;
  /** Remember settings, toolbar position and feedback across reloads (localStorage). Default `true`. */
  persist?: boolean;
  /** Called whenever something is copied. */
  onCopy?: (text: string, kind: CopyKind) => void;
}

export interface InspectaNote {
  id: number;
  element: Element | null;
  selector: string;
  text: string;
  /** Quoted page text, when the feedback was left on a text selection. */
  quote?: string;
}

interface Settings {
  detail: AIDetail;
  spacing: boolean;
  textLines: boolean;
  hoverBox: boolean;
  guides: boolean;
  markers: boolean;
  clearOnCopy: boolean;
  dock: { x: number; y: number } | null;
  tourDone: boolean;
  measured: boolean;
}

const VERSION = '0.2.0';
const INTERACTIVE = 'a,button,input,textarea,select,option,label,summary,[contenteditable=""],[contenteditable="true"],[draggable="true"],[role="button"],[role="link"]';
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function matchHotkey(e: KeyboardEvent, spec: string): boolean {
  const parts = spec.toLowerCase().split('+').map((s) => s.trim());
  const key = parts.pop() ?? '';
  const has = (...k: string[]) => k.some((x) => parts.includes(x));
  const mod = has('mod');
  const wantCtrl = has('ctrl', 'control') || (mod && !isMac);
  const wantMeta = has('meta', 'cmd') || (mod && isMac);
  if (e.altKey !== has('alt', 'option') || e.shiftKey !== has('shift') || e.ctrlKey !== wantCtrl || e.metaKey !== wantMeta) return false;
  if (/^[a-z]$/.test(key)) return e.code === `Key${key.toUpperCase()}`;
  if (/^\d$/.test(key)) return e.code === `Digit${key}`;
  return e.key.toLowerCase() === key;
}

function hotkeyLabel(spec: string): string {
  const map: Record<string, string> = isMac
    ? { alt: '⌥', option: '⌥', shift: '⇧', ctrl: '⌃', control: '⌃', meta: '⌘', cmd: '⌘', mod: '⌘' }
    : { alt: 'Alt+', option: 'Alt+', shift: 'Shift+', ctrl: 'Ctrl+', control: 'Ctrl+', meta: 'Win+', cmd: 'Win+', mod: 'Ctrl+' };
  return spec
    .toLowerCase()
    .split('+')
    .map((p, i, a) => (i === a.length - 1 ? p.toUpperCase() : map[p.trim()] ?? `${p}+`))
    .join('');
}

function isEditable(el: Element | null): boolean {
  return !!el && ((el as HTMLElement).isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

const ib = (act: string, icon: string, tip: string, kbd = '', cls = '') =>
  `<button class="ib${cls ? ` ${cls}` : ''}" data-act="${act}" aria-label="${esc(tip)}" data-tip="${esc(tip)}"${kbd ? ` data-kbd="${esc(kbd)}"` : ''}>${icon}</button>`;

export class Inspecta {
  private host: HTMLElement;
  private root: ShadowRoot;
  private layer: HTMLElement;
  private marks: HTMLElement;
  private pop: HTMLElement;
  private hint: HTMLElement;
  private dock: HTMLElement;
  private menu: HTMLElement;
  private tb: HTMLElement;
  private toastEl: HTMLElement;
  private pageStyle: HTMLStyleElement;
  private pauseStyle: HTMLStyleElement;

  private active = false;
  private hovered: Element | null = null;
  private selected: Element | null = null;
  private quote: string | null = null;
  private editing: number | null = null;
  private alt = false;
  private mouse = { x: -1, y: -1 };
  private down: { x: number; y: number } | null = null;
  private notes: InspectaNote[] = [];
  private noteSeq = 0;
  private raf = 0;
  private lastLayer = '';
  private markEls = new Map<number, HTMLElement>();
  private menuOpen = false;
  private paused = false;
  private pausedAnims: Animation[] = [];
  private pausedVideos: HTMLMediaElement[] = [];
  private closed = new Set<string>(['attrs']);
  private moreOpen = false;
  private dockDrag: { sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  private suppressClick = false;
  private toastTimer = 0;
  private popPos = '';
  private s: Settings;
  private opts: InspectaOptions & { hotkey: string; showToolbar: boolean; position: 'bottom-right' | 'bottom-left'; persist: boolean };

  constructor(options: InspectaOptions = {}) {
    const defined = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as InspectaOptions;
    this.opts = { hotkey: 'alt+shift+i', showToolbar: true, position: 'bottom-right', persist: true, ...defined };
    this.s = {
      detail: this.opts.aiDetail ?? 'compact',
      spacing: true,
      textLines: true,
      hoverBox: false,
      guides: false,
      markers: true,
      clearOnCopy: false,
      dock: null,
      tourDone: false,
      measured: false,
      ...this.load<Partial<Settings>>('settings', {}),
    };
    delete (this.s as Partial<Settings> & { color?: string }).color;

    this.host = document.createElement('inspecta-overlay');
    this.host.setAttribute('data-inspecta', '');
    this.host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;display:block;';
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${STYLES}</style><div class="ui">
      <div class="layer"></div><div class="marks"></div>
      <div class="pop" hidden role="dialog" aria-label="Element inspector"></div>
      <div class="hint" hidden></div>
      <div class="dock"><div class="menu" hidden role="menu" aria-label="Settings"></div><div class="tb" role="toolbar" aria-label="Inspecta"></div></div>
      <div class="toast" role="status" aria-live="polite"></div></div>`;
    const q = <T extends HTMLElement>(s: string) => this.root.querySelector(s) as T;
    this.layer = q('.layer');
    this.marks = q('.marks');
    this.pop = q('.pop');
    this.hint = q('.hint');
    this.dock = q('.dock');
    this.menu = q('.menu');
    this.tb = q('.tb');
    this.toastEl = q('.toast');
    if (!this.opts.showToolbar) this.dock.style.display = 'none';
    document.documentElement.appendChild(this.host);

    this.pageStyle = document.createElement('style');
    this.pageStyle.textContent = 'html[data-inspecta-active], html[data-inspecta-active] * { cursor: crosshair !important; }';
    this.pauseStyle = document.createElement('style');
    document.head.append(this.pageStyle, this.pauseStyle);

    for (const n of this.load<Omit<InspectaNote, 'element'>[]>(this.notesKey(), [])) {
      this.notes.push({ ...n, element: null });
      this.noteSeq = Math.max(this.noteSeq, n.id);
    }

    this.root.addEventListener('click', this.onUiClick);
    this.root.addEventListener('keydown', this.onUiKey as EventListener);
    this.root.addEventListener('input', this.onUiInput);
    this.root.addEventListener('toggle', this.onToggle, true);
    this.tb.addEventListener('pointerdown', this.onDockDown);
    this.host.addEventListener('keydown', (e) => e.stopPropagation());

    window.addEventListener('pointermove', this.onMove, true);
    window.addEventListener('pointerup', this.onDockUp, true);
    for (const t of ['pointerdown', 'mousedown']) window.addEventListener(t, this.onDown, true);
    for (const t of ['pointerup', 'mouseup', 'dblclick', 'auxclick']) window.addEventListener(t, this.onSwallow, true);
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    window.addEventListener('scroll', this.onScroll, true);
    window.addEventListener('resize', this.placeDock);
    window.addEventListener('blur', this.onBlur);

    this.placeDock();
    this.renderToolbar();
    if (this.opts.startActive) this.activate();
  }

  /* ================================================================ */
  /* Public API                                                        */
  /* ================================================================ */

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    document.documentElement.setAttribute('data-inspecta-active', '');
    this.marks.hidden = false;
    this.raf = requestAnimationFrame(this.frame);
    this.renderToolbar();
    this.tb.classList.add('opening');
    setTimeout(() => this.tb.classList.remove('opening'), 250);
    this.renderHint();
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.closePop(true);
    this.hovered = null;
    this.alt = false;
    this.menuOpen = false;
    if (this.paused) this.togglePause();
    cancelAnimationFrame(this.raf);
    this.layer.innerHTML = '';
    this.lastLayer = '';
    this.marks.hidden = true;
    document.documentElement.removeAttribute('data-inspecta-active');
    this.renderToolbar();
    this.renderHint();
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  /** Open the inspector popover on an element (or `null` to close it). */
  select(el: Element | null, opts: { quote?: string; noteId?: number } = {}): void {
    if (!el) {
      this.closePop();
      return;
    }
    if (!this.active) this.activate();
    if (this.hasDraft() && (el !== this.selected || (opts.quote ?? null) !== this.quote)) {
      this.shake();
      return;
    }
    const existing = opts.noteId ?? (opts.quote ? undefined : this.notes.find((n) => n.element === el && !n.quote)?.id);
    const note = existing !== undefined ? this.notes.find((n) => n.id === existing) : undefined;
    this.selected = el;
    this.quote = opts.quote ?? note?.quote ?? null;
    this.editing = note?.id ?? null;
    this.menuOpen = false;
    if (!this.s.tourDone) this.renderHint();
    this.renderPop(true);
    this.renderToolbar();
  }

  getNotes(): InspectaNote[] {
    return this.notes.slice();
  }

  /** All feedback as text for an AI agent. `detail` defaults to the current setting. */
  notesMarkdown(detail: AIDetail = this.s.detail): string {
    const label = (n: InspectaNote) => (n.quote ? `${n.text} (re: "${trunc(n.quote, 120)}")` : n.text);
    if (detail === 'compact') {
      const items = this.notes.map(
        (n, i) => `${i + 1}. ${n.element?.isConnected ? describeCompact(n.element, label(n)) : `${label(n)}\n${n.selector} (not on page)`}`.replace(/\n/g, '\n   '),
      );
      return `UI feedback for ${location.pathname} (${innerWidth}×${innerHeight}):\n${items.join('\n')}`;
    }
    const head = `# UI feedback\n\nPage: ${location.href}\nViewport: ${innerWidth} × ${innerHeight}\n`;
    return (
      head +
      this.notes
        .map(
          (n, i) =>
            `\n## ${i + 1}. ${trunc(n.text.split('\n')[0], 80)}\n\n${
              n.element?.isConnected ? describeForAI(n.element, label(n)) : `**\`${n.selector}\`** (not on page)\n- Feedback: ${label(n)}`
            }\n`,
        )
        .join('')
    );
  }

  destroy(): void {
    this.deactivate();
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('pointerup', this.onDockUp, true);
    for (const t of ['pointerdown', 'mousedown']) window.removeEventListener(t, this.onDown, true);
    for (const t of ['pointerup', 'mouseup', 'dblclick', 'auxclick']) window.removeEventListener(t, this.onSwallow, true);
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.placeDock);
    window.removeEventListener('blur', this.onBlur);
    this.host.remove();
    this.pageStyle.remove();
    this.pauseStyle.remove();
  }

  /* ================================================================ */
  /* Persistence                                                       */
  /* ================================================================ */

  private notesKey() {
    return `notes:${location.pathname}`;
  }

  private load<T>(key: string, fallback: T): T {
    if (!this.opts.persist) return fallback;
    try {
      const raw = localStorage.getItem(`inspecta:${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private save(): void {
    if (!this.opts.persist) return;
    try {
      localStorage.setItem('inspecta:settings', JSON.stringify(this.s));
      const notes = this.notes.map(({ id, selector, text, quote }) => ({ id, selector, text, quote }));
      if (notes.length) localStorage.setItem(`inspecta:${this.notesKey()}`, JSON.stringify(notes));
      else localStorage.removeItem(`inspecta:${this.notesKey()}`);
    } catch {
      /* storage full or blocked */
    }
  }

  /* ================================================================ */
  /* Frame loop                                                        */
  /* ================================================================ */

  private frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.selected && !this.selected.isConnected) this.closePop(true);
    if (this.hovered && !this.hovered.isConnected) this.hovered = null;
    for (const n of this.notes) {
      if (!n.element?.isConnected) {
        try {
          n.element = document.querySelector(n.selector);
        } catch {
          n.element = null;
        }
      }
    }
    const html = this.drawLayer();
    if (html !== this.lastLayer) {
      this.layer.innerHTML = html;
      this.lastLayer = html;
    }
    this.drawMarks();
    if (this.selected) this.placePop(rectOf(this.selected));
  };

  private drawLayer(): string {
    const sel = this.selected;
    const hov = this.hovered;
    const s = this.s;
    let o = '';
    let labels = '';
    let top = '';
    if (s.guides) {
      if (sel) o += drawEdgeGuides(rectOf(sel));
      if (this.mouse.x >= 0) o += drawCrosshair(this.mouse.x, this.mouse.y);
    }
    if (sel) {
      if (s.spacing) o += drawBoxModel(boxes(sel), true) + drawChildGaps(sel);
      if (s.textLines) o += drawTextLines(sel);
      o += drawOutline(rectOf(sel), 'ol-sel');
    }
    if (hov && hov !== sel) {
      const hr = rectOf(hov);
      if (sel) {
        o += drawOutline(hr, 'ol-hov');
        top += drawMeasure(rectOf(sel), hr);
        if (!s.measured) {
          s.measured = true;
          this.save();
          this.pop.querySelector('.ptip')?.remove();
        }
      } else {
        if (s.hoverBox) o += drawBoxModel(boxes(hov), true);
        o += drawOutline(hr, 'ol-hov');
        if (this.alt && hov.parentElement) {
          const pr = rectOf(hov.parentElement);
          o += drawOutline(pr, 'ol-par');
          top += drawMeasure(hr, pr);
        }
      }
      labels += drawLabels(hov, hr, 'hov');
    }
    if (sel && (!hov || hov === sel) && this.alt && sel.parentElement) {
      const pr = rectOf(sel.parentElement);
      o += drawOutline(pr, 'ol-par');
      top += drawMeasure(rectOf(sel), pr);
    }
    if (sel) labels += drawLabels(sel, rectOf(sel), 'sel');
    // Measurements last so they sit above the name/size labels.
    return o + labels + top;
  }

  private drawMarks(): void {
    const seen = new Set<number>();
    if (this.s.markers) {
      const vw = document.documentElement.clientWidth;
      this.notes.forEach((n, i) => {
        if (!n.element?.isConnected) return;
        seen.add(n.id);
        let m = this.markEls.get(n.id);
        if (!m) {
          m = document.createElement('button');
          m.className = 'mk';
          m.dataset.note = String(n.id);
          this.marks.appendChild(m);
          this.markEls.set(n.id, m);
        }
        const r = rectOf(n.element);
        m.style.display = r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > vw ? 'none' : '';
        const label = String(i + 1);
        if (m.textContent !== label) m.textContent = label;
        const tip = trunc(n.text, 120);
        if (m.dataset.tip !== tip) {
          m.dataset.tip = tip;
          m.setAttribute('aria-label', `Feedback ${label}: ${tip}`);
        }
        m.style.left = `${clamp(r.right - 11, 4, vw - 26)}px`;
        m.style.top = `${clamp(r.top - 11, 4, innerHeight - 26)}px`;
        m.classList.toggle('on', this.editing === n.id);
      });
    }
    for (const [id, m] of this.markEls) {
      if (!seen.has(id)) {
        m.remove();
        this.markEls.delete(id);
      }
    }
  }

  /* ================================================================ */
  /* Popover                                                           */
  /* ================================================================ */

  private renderPop(focus = false): void {
    const el = this.selected;
    if (!el) {
      this.pop.hidden = true;
      return;
    }
    const note = this.editing !== null ? this.notes.find((n) => n.id === this.editing) : undefined;
    const tag = el.tagName.toLowerCase();
    const cls = classList(el).slice(0, 2);
    const comp = componentInfo(el);
    const html = document.documentElement;
    const scroll = this.pop.querySelector('.pbody')?.scrollTop ?? 0;
    // Drop our crosshair cursor override while reading styles so it doesn't show up as the element's cursor.
    html.removeAttribute('data-inspecta-active');
    let specs = '';
    let details = '';
    try {
      specs = specsHTML(el);
      details = detailsHTML(el, this.closed);
    } finally {
      html.setAttribute('data-inspecta-active', '');
    }
    const id = `<span class="tag">${esc(tag)}</span><code>${el.id ? `#${esc(el.id)}` : ''}${cls.length ? `.${esc(cls.join('.'))}` : ''}</code>`;
    this.pop.innerHTML = `
      <div class="ph">
        <div class="pid"><button class="ident" data-act="copy-sel" title="Click to copy selector">${id}</button>${comp ? `<span class="comp" title="${esc(comp.framework)} component">${esc(comp.names[0])}</span>` : ''}</div>
        <div class="pa">
          ${ib('copy-css', I.codeMd, 'Copy CSS')}
          <div class="nav">${ib('parent', I.up, 'Parent', '↑')}${ib('child', I.down, 'Child', '↓')}</div>
          ${ib('close', I.close, 'Close', 'Esc', 'close')}
        </div>
      </div>
      <div class="pbody">
        ${this.quote ? `<blockquote class="quote">${esc(trunc(this.quote, 200))}</blockquote>` : ''}
        ${specs}
        <details class="more"${this.moreOpen ? ' open' : ''}><summary>${I.chevron}<span>All properties</span><em>Box model, layout, type, a11y</em></summary><div class="mb">${details}</div></details>
      </div>
      <div class="pn">
        <textarea rows="2" aria-label="Feedback" placeholder="${this.quote ? 'What should change in this text?' : 'Leave feedback for your agent…'}">${esc(note?.text ?? '')}</textarea>
        <div class="pf">
          ${note ? `<button class="btn sm ghost danger" data-act="delete-note">${I.trashSm}<span>Delete</span></button>` : ''}
          <span class="grow"></span>
          <button class="btn sm ghost" data-act="close">Cancel</button>
          <button class="btn sm pri" data-act="save-note"${note?.text ? '' : ' disabled'}><span>${note ? 'Save' : 'Add feedback'}</span><kbd>↵</kbd></button>
        </div>
      </div>
      ${this.s.measured ? '' : `<div class="ptip">${I.ruler}<span>Hover another element to measure · <kbd>Alt</kbd> for parent</span></div>`}`;
    const wasHidden = this.pop.hidden;
    this.pop.hidden = false;
    const body = this.pop.querySelector('.pbody');
    if (body && !wasHidden) body.scrollTop = scroll;
    this.popPos = '';
    this.placePop(rectOf(el));
    if (focus) {
      const ta = this.pop.querySelector('textarea');
      if (ta) {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }

  private placePop(r: Rect): void {
    const pw = this.pop.offsetWidth || 360;
    const ph = this.pop.offsetHeight || 320;
    const M = 12;
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight;
    let x: number;
    let y: number;
    if (r.right + M + pw <= vw - M) {
      x = r.right + M;
      y = clamp(r.top, M, vh - ph - M);
    } else if (r.left - M - pw >= M) {
      x = r.left - M - pw;
      y = clamp(r.top, M, vh - ph - M);
    } else if (r.bottom + M + ph <= vh - M) {
      y = r.bottom + M;
      x = clamp(r.left, M, vw - pw - M);
    } else if (r.top - M - ph >= M) {
      y = r.top - M - ph;
      x = clamp(r.left, M, vw - pw - M);
    } else {
      // Element fills the screen: park the popover in the corner opposite the toolbar.
      const dr = this.dock.getBoundingClientRect();
      x = dr.left > vw / 2 ? M : vw - pw - M;
      y = M;
    }
    // Never sit on top of the toolbar: slide away from it vertically.
    const d = this.dock.getBoundingClientRect();
    if (d.width && x < d.right + 8 && x + pw > d.left - 8 && y < d.bottom + 8 && y + ph > d.top - 8) {
      y = d.top > vh / 2 ? Math.max(M, d.top - 8 - ph) : Math.min(vh - ph - M, d.bottom + 8);
    }
    const pos = `${Math.round(x)},${Math.round(y)}`;
    if (pos !== this.popPos) {
      this.popPos = pos;
      this.pop.style.left = `${Math.round(x)}px`;
      this.pop.style.top = `${Math.round(y)}px`;
    }
  }

  private hasDraft(): boolean {
    if (!this.selected) return false;
    const ta = this.pop.querySelector('textarea');
    const v = ta?.value.trim() ?? '';
    const orig = this.editing !== null ? this.notes.find((n) => n.id === this.editing)?.text ?? '' : '';
    return v !== '' && v !== orig;
  }

  private shake(): void {
    this.pop.classList.remove('shake');
    void this.pop.offsetWidth;
    this.pop.classList.add('shake');
    this.toast('Add or cancel your feedback first');
    this.pop.querySelector('textarea')?.focus({ preventScroll: true });
  }

  private closePop(force = false): void {
    if (!force && !this.selected) return;
    this.selected = null;
    this.quote = null;
    this.editing = null;
    this.pop.hidden = true;
    this.pop.innerHTML = '';
    this.renderHint();
  }

  private saveNote(): void {
    const el = this.selected;
    const ta = this.pop.querySelector('textarea');
    const text = ta?.value.trim();
    if (!el || !text) return;
    const existing = this.editing !== null ? this.notes.find((n) => n.id === this.editing) : undefined;
    if (existing) {
      existing.text = text;
      this.toast(`Feedback ${this.notes.indexOf(existing) + 1} updated`);
    } else {
      this.notes.push({ id: ++this.noteSeq, element: el, selector: cssSelector(el), text, quote: this.quote ?? undefined });
      this.toast(`Feedback ${this.notes.length} added`, { label: 'Copy all', fn: () => this.copyAll(false) });
      this.s.tourDone = true;
    }
    this.save();
    this.closePop(true);
    this.renderToolbar(true);
  }

  private deleteNote(): void {
    const n = this.notes.find((x) => x.id === this.editing);
    if (!n) return;
    const idx = this.notes.indexOf(n);
    this.notes.splice(idx, 1);
    this.save();
    this.closePop(true);
    this.renderToolbar();
    this.toast('Feedback deleted', {
      label: 'Undo',
      fn: () => {
        this.notes.splice(idx, 0, n);
        this.save();
        this.renderToolbar();
      },
    });
  }

  /* ================================================================ */
  /* Toolbar, settings, hint, toast                                    */
  /* ================================================================ */

  private renderToolbar(bump = false): void {
    const s = this.s;
    const n = this.notes.length;
    this.tb.classList.toggle('collapsed', !this.active);
    if (!this.active) {
      this.tb.innerHTML = `<button class="fab" data-act="toggle" aria-label="Open Inspecta" data-tip="Inspect & annotate" data-kbd="${esc(hotkeyLabel(this.opts.hotkey))}">${I.logo}</button>`;
      this.menu.hidden = true;
      return;
    }
    let h = '';
    h += ib('spacing', I.spacing, 'Spacing overlay', 'S', s.spacing ? 'on' : '');
    h += ib('guides', I.guides, 'Guides', 'G', s.guides ? 'on' : '');
    h += ib('pause', this.paused ? I.play : I.pause, this.paused ? 'Resume animations' : 'Pause animations', 'P', this.paused ? 'on' : '');
    h += `<span class="sep"></span>`;
    if (n) h += ib('markers', s.markers ? I.eye : I.eyeOff, s.markers ? 'Hide markers' : 'Show markers', 'H');
    h += `<button class="ib copy" data-act="copy-all" aria-label="Copy feedback" data-tip="${n ? `Copy ${n} feedback` : 'Copy feedback'}" data-kbd="C">${I.copy}${
      n ? `<span class="bdg${bump ? ' bump' : ''}">${n}</span>` : ''
    }</button>`;
    if (n) h += ib('clear', I.trash, 'Clear all', 'X');
    h += `<span class="sep"></span>`;
    h += ib('settings', I.settings, 'Settings', '', this.menuOpen ? 'on' : '');
    h += ib('toggle', I.x, 'Close', 'Esc', 'close');
    this.tb.innerHTML = h;
    this.renderMenu();
  }

  private renderMenu(): void {
    this.menu.hidden = !(this.active && this.menuOpen);
    if (this.menu.hidden) return;
    const s = this.s;
    const sw = (key: keyof Settings, label: string, kbd = '') =>
      `<button class="mi" role="menuitemcheckbox" aria-checked="${!!s[key]}" data-act="set-${key}"><span>${label}${kbd ? `<kbd>${kbd}</kbd>` : ''}</span><span class="switch${s[key] ? ' on' : ''}"></span></button>`;
    this.menu.innerHTML = `
      <div class="mh">Inspecta <span>v${VERSION}</span></div>
      <div class="mi col"><span>Copy detail</span>
        <div class="seg" style="margin-top:6px"><button data-act="detail-compact" class="${s.detail === 'compact' ? 'on' : ''}">Compact</button><button data-act="detail-full" class="${s.detail === 'full' ? 'on' : ''}">Full</button></div>
        <div class="sub">${s.detail === 'compact' ? 'Two lines per element. Saves tokens.' : 'Markdown with layout, position and shadows.'} Hold <kbd>Shift</kbd> when copying for the other.</div>
      </div>
      ${sw('spacing', 'Spacing overlay', 'S')}
      ${sw('textLines', 'Text line boxes')}
      ${sw('hoverBox', 'Box model on hover')}
      ${sw('guides', 'Guides', 'G')}
      ${sw('clearOnCopy', 'Clear after copy')}
      <div class="mf"><span>Toggle <kbd>${esc(hotkeyLabel(this.opts.hotkey))}</kbd></span><button class="btn sm ghost" data-act="tour">Show tips</button></div>`;
  }

  private renderHint(): void {
    const show = this.active && !this.s.tourDone && !this.selected;
    this.hint.hidden = !show;
    if (!show) return;
    this.hint.innerHTML = `<span><b>Hover</b> to inspect</span><span><b>Click</b> for specs and feedback</span><span><b>Select text</b> to quote it</span><span><kbd>Esc</kbd> to exit</span><button class="btn sm" data-act="tour-done">Got it</button>`;
  }

  private toast(msg: string, action?: { label: string; fn: () => void }): void {
    this.toastEl.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="btn sm ghost accent" data-act="toast">${esc(action.label)}</button>` : ''}`;
    this.toastAction = action?.fn ?? null;
    this.toastEl.classList.toggle('act', !!action);
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('show', 'act');
      this.toastAction = null;
    }, action ? 4000 : 1600);
  }
  private toastAction: (() => void) | null = null;

  private placeDock = () => {
    const d = this.s.dock;
    const st = this.dock.style;
    const vw = document.documentElement.clientWidth;
    if (d) {
      const r = this.dock.getBoundingClientRect();
      const x = clamp(d.x, 8, Math.max(8, vw - (this.tb.offsetWidth || 46) - 8));
      const y = clamp(d.y, 8, Math.max(8, innerHeight - (this.tb.offsetHeight || 46) - 8));
      st.left = `${x}px`;
      st.top = 'auto';
      st.right = 'auto';
      st.bottom = `${innerHeight - y - (this.tb.offsetHeight || 46)}px`;
      this.dock.classList.toggle('top', y < innerHeight / 2);
      this.dock.style.alignItems = x + (r.width || 46) / 2 < vw / 2 ? 'flex-start' : 'flex-end';
    } else {
      st.left = this.opts.position === 'bottom-left' ? '16px' : 'auto';
      st.right = this.opts.position === 'bottom-left' ? 'auto' : '16px';
      st.top = 'auto';
      st.bottom = '16px';
      this.dock.style.alignItems = this.opts.position === 'bottom-left' ? 'flex-start' : 'flex-end';
      this.dock.classList.remove('top');
    }
  };

  private async copy(text: string, kind: CopyKind, msg = 'Copied'): Promise<boolean> {
    const ok = await copyText(text);
    this.toast(ok ? msg : 'Copy failed. Check clipboard permissions.');
    this.opts.onCopy?.(text, kind);
    return ok;
  }

  private detail(shift: boolean): AIDetail {
    return shift ? (this.s.detail === 'full' ? 'compact' : 'full') : this.s.detail;
  }

  private async copyAll(shift: boolean): Promise<void> {
    if (!this.notes.length) {
      if (this.selected) {
        const d = this.detail(shift);
        await this.copy(describe(this.selected, d), 'ai', `Element copied (${d})`);
      } else {
        this.toast('Nothing to copy yet. Click an element to leave feedback.');
      }
      return;
    }
    const d = this.detail(shift);
    const n = this.notes.length;
    const ok = await this.copy(this.notesMarkdown(d), 'notes', `Copied ${n} feedback (${d}). Paste it into your agent.`);
    if (!ok) return;
    const btn = this.tb.querySelector('.copy');
    if (btn) {
      btn.classList.add('ok');
      btn.firstElementChild!.outerHTML = I.check;
      setTimeout(() => this.renderToolbar(), 1400);
    }
    if (this.s.clearOnCopy) this.clearAll(false);
  }

  private clearAll(withToast = true): void {
    if (!this.notes.length) return;
    const backup = this.notes.slice();
    this.notes = [];
    if (this.editing !== null) this.closePop(true);
    this.save();
    this.renderToolbar();
    if (withToast)
      this.toast(`Cleared ${backup.length} feedback`, {
        label: 'Undo',
        fn: () => {
          this.notes = backup;
          this.save();
          this.renderToolbar();
        },
      });
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseStyle.textContent =
        '*, *::before, *::after { animation-play-state: paused !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
      const anims = (document.getAnimations?.() ?? []).filter((a) => {
        const t = (a.effect as KeyframeEffect | null)?.target;
        return a.playState === 'running' && !(t && t.getRootNode() === this.root);
      });
      anims.forEach((a) => a.pause());
      this.pausedAnims = anims;
      this.pausedVideos = Array.from(document.querySelectorAll('video, audio')).filter((v) => !(v as HTMLMediaElement).paused) as HTMLMediaElement[];
      this.pausedVideos.forEach((v) => v.pause());
    } else {
      this.pauseStyle.textContent = '';
      this.pausedAnims.forEach((a) => {
        try {
          a.play();
        } catch {
          /* removed */
        }
      });
      this.pausedVideos.forEach((v) => void v.play().catch(() => {}));
      this.pausedAnims = [];
      this.pausedVideos = [];
    }
    this.renderToolbar();
  }

  private setFlag(key: 'spacing' | 'textLines' | 'hoverBox' | 'guides' | 'markers' | 'clearOnCopy'): void {
    this.s[key] = !this.s[key];
    this.save();
    this.renderToolbar();
  }

  /* ================================================================ */
  /* Page events                                                       */
  /* ================================================================ */

  private isOurs(e: Event): boolean {
    return e.composedPath().includes(this.host);
  }

  private targetOf(e: Event): Element | null {
    const t = e.composedPath()[0];
    return t instanceof Element ? t : null;
  }

  private onMove = (e: PointerEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    const dd = this.dockDrag;
    if (dd) {
      const dx = e.clientX - dd.sx;
      const dy = e.clientY - dd.sy;
      if (!dd.moved && Math.hypot(dx, dy) < 4) return;
      dd.moved = true;
      this.tb.classList.add('dragging');
      this.s.dock = { x: dd.ox + dx, y: dd.oy + dy };
      this.placeDock();
      return;
    }
    if (!this.active || this.isOurs(e)) return;
    this.hovered = this.targetOf(e);
  };

  private onScroll = () => {
    if (!this.active || this.mouse.x < 0) return;
    const el = document.elementFromPoint(this.mouse.x, this.mouse.y);
    if (el && el !== this.host) this.hovered = el;
  };

  /** Down events: stop the page from reacting, but keep native text selection working. */
  private onDown = (e: Event) => {
    if (!this.active || this.isOurs(e)) return;
    if (e.type === 'pointerdown') {
      const pe = e as PointerEvent;
      this.down = { x: pe.clientX, y: pe.clientY };
    }
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (this.targetOf(e)?.closest(INTERACTIVE)) e.preventDefault();
  };

  private onSwallow = (e: Event) => {
    if (!this.active || this.isOurs(e)) return;
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type !== 'pointerup' && e.type !== 'mouseup') e.preventDefault();
  };

  private onClick = (e: MouseEvent) => {
    if (!this.active || this.isOurs(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (this.menuOpen) {
      this.menuOpen = false;
      this.renderToolbar();
      return;
    }
    const moved = this.down ? Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 4 : false;
    const selection = window.getSelection();
    const text = selection?.toString().replace(/\s+/g, ' ').trim();
    if (moved && text && selection && selection.rangeCount) {
      const anc = selection.getRangeAt(0).commonAncestorContainer;
      const el = anc.nodeType === 1 ? (anc as Element) : anc.parentElement;
      if (el) this.select(el, { quote: text });
      return;
    }
    const t = this.targetOf(e);
    if (t && t === this.selected && !this.quote) {
      if (this.hasDraft()) this.shake();
      else this.closePop();
      return;
    }
    if (t) this.select(t);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (matchHotkey(e, this.opts.hotkey)) {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
      return;
    }
    if (!this.active) return;
    if (e.key === 'Alt') {
      this.alt = true;
      e.preventDefault();
      return;
    }
    if (this.isOurs(e)) {
      const inner = this.root.activeElement;
      if (inner?.tagName === 'TEXTAREA') return;
      if (e.key !== 'Escape' && !/^[a-z]$/i.test(e.key) && !e.key.startsWith('Arrow')) return;
      (inner as HTMLElement | null)?.blur();
    }
    if (e.key !== 'Escape' && isEditable(document.activeElement)) return;
    const sel = this.selected;
    const nav = (el: Element | null | undefined) => {
      e.preventDefault();
      if (!el || el === this.host || el === document.documentElement) return;
      if (this.hasDraft()) return this.shake();
      this.select(el);
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'center' });
    };
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (this.menuOpen) {
          this.menuOpen = false;
          this.renderToolbar();
        } else if (sel) this.closePop();
        else this.deactivate();
        return;
      case 'ArrowUp':
        if (sel) nav(sel.parentElement);
        return;
      case 'ArrowDown':
        if (sel) nav(sel.firstElementChild);
        return;
      case 'ArrowLeft':
        if (sel) nav(sel.previousElementSibling);
        return;
      case 'ArrowRight':
        if (sel) nav(sel.nextElementSibling);
        return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const act: Record<string, () => void> = {
      s: () => this.setFlag('spacing'),
      g: () => this.setFlag('guides'),
      t: () => this.setFlag('textLines'),
      h: () => this.setFlag('markers'),
      p: () => this.togglePause(),
      c: () => void this.copyAll(e.shiftKey),
      x: () => this.clearAll(),
    };
    if (act[k] && (!e.shiftKey || k === 'c')) {
      e.preventDefault();
      act[k]();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Alt' && this.active) {
      this.alt = false;
      e.preventDefault();
    }
  };

  private onBlur = () => {
    this.alt = false;
  };

  /* ================================================================ */
  /* UI events                                                         */
  /* ================================================================ */

  private onUiKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLTextAreaElement;
    if (t.tagName !== 'TEXTAREA') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.hasDraft()) {
        t.value = this.editing !== null ? this.notes.find((n) => n.id === this.editing)?.text ?? '' : '';
        this.onUiInput();
      } else this.closePop();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.saveNote();
    } else if (e.key.startsWith('Arrow') && t.value === '' && this.selected) {
      const s = this.selected;
      const next = { ArrowUp: s.parentElement, ArrowDown: s.firstElementChild, ArrowLeft: s.previousElementSibling, ArrowRight: s.nextElementSibling }[e.key];
      e.preventDefault();
      if (next && next !== document.documentElement) this.select(next);
    }
  };

  private onUiInput = () => {
    const ta = this.pop.querySelector('textarea');
    const btn = this.pop.querySelector<HTMLButtonElement>('[data-act="save-note"]');
    if (ta && btn) btn.disabled = !ta.value.trim();
  };

  private onToggle = (e: Event) => {
    const d = e.target as HTMLDetailsElement;
    if (d.classList?.contains('more')) {
      this.moreOpen = d.open;
      return;
    }
    const id = d.dataset?.sec;
    if (!id) return;
    if (d.open) this.closed.delete(id);
    else this.closed.add(id);
  };

  private onDockDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const r = this.tb.getBoundingClientRect();
    this.dockDrag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
  };

  private onDockUp = () => {
    const dd = this.dockDrag;
    this.dockDrag = null;
    if (dd?.moved) {
      this.suppressClick = true;
      this.tb.classList.remove('dragging');
      this.save();
      setTimeout(() => (this.suppressClick = false), 0);
    }
  };

  private onUiClick = (e: Event) => {
    if (this.suppressClick) return;
    const t = e.target as Element;
    const mk = t.closest<HTMLElement>('.mk');
    if (mk) {
      const n = this.notes.find((x) => x.id === Number(mk.dataset.note));
      if (n?.element) this.select(n.element, { noteId: n.id });
      return;
    }
    const actEl = t.closest('[data-act]');
    const sel = this.selected;
    const shift = (e as MouseEvent).shiftKey;
    if (actEl) {
      const act = actEl.getAttribute('data-act')!;
      switch (act) {
        case 'toggle': this.toggle(); break;
        case 'spacing': this.setFlag('spacing'); break;
        case 'guides': this.setFlag('guides'); break;
        case 'markers': this.setFlag('markers'); break;
        case 'pause': this.togglePause(); break;
        case 'copy-all': void this.copyAll(shift); break;
        case 'clear': this.clearAll(); break;
        case 'settings': this.menuOpen = !this.menuOpen; this.renderToolbar(); break;
        case 'detail-compact': case 'detail-full': this.s.detail = act === 'detail-full' ? 'full' : 'compact'; this.save(); this.renderMenu(); break;
        case 'set-spacing': case 'set-textLines': case 'set-hoverBox': case 'set-guides': case 'set-clearOnCopy':
          this.setFlag(act.slice(4) as 'spacing'); break;
        case 'tour': this.s.tourDone = false; this.s.measured = false; this.menuOpen = false; this.save(); this.renderToolbar(); this.renderHint(); break;
        case 'tour-done': this.s.tourDone = true; this.save(); this.renderHint(); break;
        case 'toast': this.toastAction?.(); this.toastEl.classList.remove('show', 'act'); break;
        case 'parent': if (sel?.parentElement && sel.parentElement !== document.documentElement) this.select(sel.parentElement); break;
        case 'child': if (sel?.firstElementChild) this.select(sel.firstElementChild); break;
        case 'close': this.closePop(); break;
        case 'save-note': this.saveNote(); break;
        case 'delete-note': this.deleteNote(); break;
        case 'copy-css': if (sel) void this.copy(cssFor(sel), 'css', 'CSS copied'); break;
        case 'copy-sel': if (sel) void this.copy(cssSelector(sel), 'selector', 'Selector copied'); break;
      }
      return;
    }
    const copyEl = t.closest('[data-copy]');
    if (copyEl) {
      const v = copyEl.getAttribute('data-copy') ?? '';
      void this.copy(v, 'value', `Copied ${trunc(v, 40)}`);
    }
  };
}
