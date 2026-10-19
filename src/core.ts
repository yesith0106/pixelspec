import { cssFor, cssSelector, describe, describeCompact, describeForAI, type AIDetail } from './inspect';
import {
  boxes, drawBoxModel, drawChildGaps, drawCrosshair, drawEdgeGuides, drawLabels, drawMarker, drawMeasure, drawOutline, drawTextLines,
} from './overlay';
import { emptyPanelHTML, panelHTML } from './panel';
import { STYLES } from './styles';
import { copyText, rectOf } from './util';

export type CopyKind = 'value' | 'css' | 'ai' | 'selector' | 'notes';

export interface InspectaOptions {
  /** Keyboard shortcut that toggles the inspector. Default `alt+shift+i`. */
  hotkey?: string;
  /** Start with the inspector switched on. Default `false`. */
  startActive?: boolean;
  /** Show the floating toolbar button. Default `true`. */
  showToolbar?: boolean;
  /** Toolbar corner. Default `bottom-right`. */
  position?: 'bottom-right' | 'bottom-left';
  /**
   * How much detail "Copy for AI" and Notes include. `compact` (default) is two short lines per element;
   * `full` is a Markdown bullet list. Holding Shift while copying uses the other one.
   */
  aiDetail?: AIDetail;
  /** Called whenever something is copied. */
  onCopy?: (text: string, kind: CopyKind) => void;
}

export interface InspectaNote {
  id: number;
  element: Element;
  selector: string;
  text: string;
}

const ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 12h8M12 8v8"/></svg>`;

function matchHotkey(e: KeyboardEvent, spec: string): boolean {
  const parts = spec.toLowerCase().split('+').map((s) => s.trim());
  const key = parts.pop() ?? '';
  const has = (...k: string[]) => k.some((x) => parts.includes(x));
  if (e.altKey !== has('alt', 'option') || e.shiftKey !== has('shift') || e.ctrlKey !== has('ctrl', 'control') || e.metaKey !== has('meta', 'cmd'))
    return false;
  if (/^[a-z]$/.test(key)) return e.code === `Key${key.toUpperCase()}`;
  if (/^\d$/.test(key)) return e.code === `Digit${key}`;
  return e.key.toLowerCase() === key;
}

function isEditable(el: Element | null): boolean {
  return !!el && ((el as HTMLElement).isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export class Inspecta {
  private host: HTMLElement;
  private root: ShadowRoot;
  private layer: HTMLElement;
  private panel: HTMLElement;
  private toolbar: HTMLElement;
  private helpEl: HTMLElement;
  private toastEl: HTMLElement;
  private cursorStyle: HTMLStyleElement;

  private active = false;
  private hovered: Element | null = null;
  private selected: Element | null = null;
  private alt = false;
  private mouse = { x: -1, y: -1 };
  private flags = { spacing: true, text: true, guides: false };
  private notes: InspectaNote[] = [];
  private noteSeq = 0;
  private raf = 0;
  private lastLayer = '';
  private closed = new Set<string>(['attrs']);
  private helpOpen = false;
  private drag: { dx: number; dy: number } | null = null;
  private toastTimer = 0;
  private opts: InspectaOptions & { hotkey: string; showToolbar: boolean; position: 'bottom-right' | 'bottom-left'; aiDetail: AIDetail };

  constructor(options: InspectaOptions = {}) {
    const defined = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as InspectaOptions;
    this.opts = { hotkey: 'alt+shift+i', showToolbar: true, position: 'bottom-right', aiDetail: 'compact', ...defined };

    this.host = document.createElement('inspecta-overlay');
    this.host.setAttribute('data-inspecta', '');
    this.host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;display:block;';
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${STYLES}</style><div class="ui"><div class="layer"></div><div class="panel" hidden></div><div class="help" hidden></div><div class="tb${
      this.opts.position === 'bottom-left' ? ' left' : ''
    }"></div><div class="toast"></div></div>`;
    this.layer = this.root.querySelector('.layer')!;
    this.panel = this.root.querySelector('.panel')!;
    this.toolbar = this.root.querySelector('.tb')!;
    this.helpEl = this.root.querySelector('.help')!;
    this.toastEl = this.root.querySelector('.toast')!;
    if (!this.opts.showToolbar) this.toolbar.style.display = 'none';
    if (this.opts.position === 'bottom-left') this.helpEl.style.cssText = 'right:auto;left:16px';
    document.documentElement.appendChild(this.host);

    this.cursorStyle = document.createElement('style');
    this.cursorStyle.textContent = 'html[data-inspecta-active], html[data-inspecta-active] * { cursor: crosshair !important; }';
    document.head.appendChild(this.cursorStyle);

    this.root.addEventListener('click', this.onUiClick);
    this.root.addEventListener('toggle', this.onToggle, true);
    this.root.addEventListener('keydown', this.onUiKey as EventListener);
    this.panel.addEventListener('pointerdown', this.onDragStart);
    this.host.addEventListener('keydown', (e) => e.stopPropagation());

    window.addEventListener('pointermove', this.onMove, true);
    window.addEventListener('pointerup', this.onDragEnd, true);
    for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick', 'auxclick']) window.addEventListener(t, this.onBlock, true);
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    window.addEventListener('scroll', this.onScroll, true);
    window.addEventListener('blur', this.onBlur);

    this.renderToolbar();
    if (this.opts.startActive) this.activate();
  }

  /* ---------------------------------------------------------------- */
  /* Public API                                                        */
  /* ---------------------------------------------------------------- */

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    document.documentElement.setAttribute('data-inspecta-active', '');
    this.raf = requestAnimationFrame(this.frame);
    this.renderPanel();
    this.renderToolbar();
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.selected = null;
    this.hovered = null;
    this.alt = false;
    this.helpOpen = false;
    cancelAnimationFrame(this.raf);
    this.layer.innerHTML = '';
    this.lastLayer = '';
    document.documentElement.removeAttribute('data-inspecta-active');
    this.renderPanel();
    this.renderToolbar();
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  /** Pin an element (or `null` to unpin). Activates the inspector if needed. */
  select(el: Element | null): void {
    if (el && !this.active) this.activate();
    this.selected = el;
    this.renderPanel();
  }

  getNotes(): InspectaNote[] {
    return this.notes.slice();
  }

  /** All notes as text for an AI agent. `detail` defaults to the `aiDetail` option. */
  notesMarkdown(detail: AIDetail = this.opts.aiDetail): string {
    const live = this.notes.filter((n) => n.element.isConnected);
    if (detail === 'compact') {
      const items = live.map((n, i) => `${i + 1}. ${describeCompact(n.element, n.text).replace(/\n/g, '\n   ')}`);
      return `UI feedback for ${location.pathname} (${innerWidth}×${innerHeight}):\n${items.join('\n')}`;
    }
    const head = `# UI feedback\n\nPage: ${location.href}\nViewport: ${innerWidth} × ${innerHeight}\n`;
    return (
      head +
      live
        .map((n, i) => `\n## ${i + 1}. ${n.text.split('\n')[0].slice(0, 80)}\n\n${describeForAI(n.element, n.text)}\n`)
        .join('')
    );
  }

  /** The detail level to use; Shift flips it. */
  private detail(shift: boolean): AIDetail {
    const d = this.opts.aiDetail;
    return shift ? (d === 'full' ? 'compact' : 'full') : d;
  }

  destroy(): void {
    this.deactivate();
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('pointerup', this.onDragEnd, true);
    for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick', 'auxclick']) window.removeEventListener(t, this.onBlock, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('blur', this.onBlur);
    this.host.remove();
    this.cursorStyle.remove();
  }

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  private frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.selected && !this.selected.isConnected) this.select(null);
    if (this.hovered && !this.hovered.isConnected) this.hovered = null;
    const html = this.drawLayer();
    if (html !== this.lastLayer) {
      this.layer.innerHTML = html;
      this.lastLayer = html;
    }
  };

  private drawLayer(): string {
    const sel = this.selected;
    const hov = this.hovered;
    let o = '';
    if (this.flags.guides) {
      if (sel) o += drawEdgeGuides(rectOf(sel));
      if (this.mouse.x >= 0) o += drawCrosshair(this.mouse.x, this.mouse.y);
    }
    if (sel) {
      o += drawBoxModel(boxes(sel), true);
      if (this.flags.spacing) o += drawChildGaps(sel);
      if (this.flags.text) o += drawTextLines(sel);
      o += drawOutline(rectOf(sel), 'ol-sel');
    }
    let labels = '';
    if (hov && hov !== sel) {
      const hr = rectOf(hov);
      if (sel) {
        o += drawOutline(hr, 'ol-hov') + drawMeasure(rectOf(sel), hr);
      } else {
        o += drawBoxModel(boxes(hov), true) + drawOutline(hr, 'ol-hov');
        if (this.flags.spacing) o += drawChildGaps(hov);
        if (this.alt && hov.parentElement) {
          const pr = rectOf(hov.parentElement);
          o += drawOutline(pr, 'ol-par') + drawMeasure(hr, pr);
        }
      }
      labels += drawLabels(hov, hr, 'hov');
    }
    if (sel && (!hov || hov === sel) && this.alt && sel.parentElement) {
      const pr = rectOf(sel.parentElement);
      o += drawOutline(pr, 'ol-par') + drawMeasure(rectOf(sel), pr);
    }
    if (sel) labels += drawLabels(sel, rectOf(sel), 'sel');
    this.notes.forEach((n, i) => {
      if (n.element.isConnected) o += drawMarker(rectOf(n.element), i + 1);
    });
    return o + labels;
  }

  private renderPanel(): void {
    if (!this.active) {
      this.panel.hidden = true;
      return;
    }
    this.panel.hidden = false;
    const el = this.selected ?? this.hovered;
    const scroll = this.panel.scrollTop;
    const note = this.selected ? this.notes.find((n) => n.element === this.selected) : undefined;
    // Drop our crosshair cursor override while reading styles so it doesn't show up as the element's cursor.
    const html = document.documentElement;
    html.removeAttribute('data-inspecta-active');
    try {
      this.panel.innerHTML = el ? panelHTML(el, { pinned: !!this.selected, closed: this.closed, note: note?.text ?? null }) : emptyPanelHTML();
    } finally {
      html.setAttribute('data-inspecta-active', '');
    }
    this.panel.scrollTop = scroll;
  }

  private renderToolbar(): void {
    const f = this.flags;
    const t = (act: string, label: string, on: boolean, title: string) =>
      `<button data-act="${act}" class="${on ? 'on' : ''}" title="${title}">${label}</button>`;
    let h = `<button class="main${this.active ? ' on' : ''}" data-act="toggle" title="Inspect (${this.opts.hotkey})">${ICON}</button>`;
    if (this.active) {
      h += t('spacing', 'Spacing', f.spacing, 'Show gaps between children (S)');
      h += t('text', 'Text', f.text, 'Show text line boxes (T)');
      h += t('guides', 'Guides', f.guides, 'Crosshair and edge guides (G)');
      h += `<span class="sep"></span>`;
      h += `<button data-act="copy-notes" title="Copy all notes as Markdown">Notes<span class="count">${this.notes.length}</span></button>`;
      if (this.notes.length) h += `<button data-act="clear-notes" title="Clear all notes">Clear</button>`;
      h += t('help', '?', this.helpOpen, 'Shortcuts');
    }
    this.toolbar.innerHTML = h;
    this.helpEl.hidden = !(this.active && this.helpOpen);
    if (!this.helpEl.hidden) {
      this.helpEl.innerHTML = `<h4>Shortcuts</h4><ul>
        <li><kbd>Click</kbd> pin element, then hover another to measure</li>
        <li><kbd>Alt</kbd> hold to measure to parent</li>
        <li><kbd>↑</kbd> parent · <kbd>↓</kbd> child · <kbd>←</kbd><kbd>→</kbd> siblings</li>
        <li><kbd>S</kbd> spacing · <kbd>T</kbd> text · <kbd>G</kbd> guides</li>
        <li><kbd>C</kbd> copy for AI (<kbd>Shift</kbd> for ${this.opts.aiDetail === 'full' ? 'compact' : 'full'}) · <kbd>N</kbd> add note</li>
        <li><kbd>Esc</kbd> unpin, then exit</li>
        <li>Click any value in the panel to copy it</li>
        <li><kbd>${this.opts.hotkey}</kbd> toggle inspector</li></ul>`;
    }
  }

  private toast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 1200);
  }

  private async copy(text: string, kind: CopyKind, msg = 'Copied'): Promise<void> {
    const ok = await copyText(text);
    this.toast(ok ? msg : 'Copy failed');
    this.opts.onCopy?.(text, kind);
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                            */
  /* ---------------------------------------------------------------- */

  private isOurs(e: Event): boolean {
    return e.composedPath().includes(this.host);
  }

  private targetOf(e: Event): Element | null {
    const t = e.composedPath()[0];
    return t instanceof Element ? t : null;
  }

  private setHovered(el: Element | null): void {
    if (el === this.hovered) return;
    this.hovered = el;
    if (!this.selected) this.renderPanel();
  }

  private onMove = (e: PointerEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    if (this.drag) {
      const x = Math.max(0, Math.min(innerWidth - 60, e.clientX - this.drag.dx));
      const y = Math.max(0, Math.min(innerHeight - 40, e.clientY - this.drag.dy));
      this.panel.style.left = `${x}px`;
      this.panel.style.top = `${y}px`;
      this.panel.style.right = 'auto';
      return;
    }
    if (!this.active || this.isOurs(e)) return;
    this.setHovered(this.targetOf(e));
  };

  private onScroll = () => {
    if (!this.active || this.mouse.x < 0) return;
    const el = document.elementFromPoint(this.mouse.x, this.mouse.y);
    if (el && el !== this.host) this.setHovered(el);
  };

  private onBlock = (e: Event) => {
    if (!this.active || this.isOurs(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type === 'click') {
      const t = this.targetOf(e);
      this.select(t && t !== this.selected ? t : null);
    }
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
      // Typing in the note box stays local; Escape there just leaves the field (handled in onUiKey).
      const inner = this.root.activeElement;
      if (e.key !== 'Escape' || inner?.tagName === 'TEXTAREA') return;
      (inner as HTMLElement | null)?.blur();
    }
    const sel = this.selected;
    const nav = (el: Element | null | undefined) => {
      e.preventDefault();
      if (!el || el === this.host) return;
      this.select(el);
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'center' });
    };
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (sel) this.select(null);
        else this.deactivate();
        return;
      case 'ArrowUp':
        if (sel || this.hovered) nav((sel ?? this.hovered)!.parentElement);
        return;
      case 'ArrowDown':
        if (sel || this.hovered) nav((sel ?? this.hovered)!.firstElementChild);
        return;
      case 'ArrowLeft':
        if (sel) nav(sel.previousElementSibling);
        return;
      case 'ArrowRight':
        if (sel) nav(sel.nextElementSibling);
        return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || isEditable(document.activeElement)) return;
    const k = e.key.toLowerCase();
    if (k === 's' || k === 't' || k === 'g') {
      e.preventDefault();
      this.toggleFlag(k === 's' ? 'spacing' : k === 't' ? 'text' : 'guides');
    } else if (k === 'c' && (sel ?? this.hovered)) {
      e.preventDefault();
      const target = (sel ?? this.hovered)!;
      const d = this.detail(e.shiftKey);
      void this.copy(describe(target, d, this.notes.find((n) => n.element === target)?.text), 'ai', `Copied for AI (${d})`);
    } else if (k === 'n' && sel) {
      e.preventDefault();
      this.root.querySelector('textarea')?.focus();
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

  private onUiKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName !== 'TEXTAREA') return;
    if (e.key === 'Escape') t.blur();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.saveNote();
    }
  };

  private onToggle = (e: Event) => {
    const d = e.target as HTMLDetailsElement;
    const id = d.dataset?.sec;
    if (!id) return;
    if (d.open) this.closed.delete(id);
    else this.closed.add(id);
  };

  private onDragStart = (e: PointerEvent) => {
    const t = e.target as Element;
    if (!t.closest('[data-drag]') || t.closest('button')) return;
    const r = this.panel.getBoundingClientRect();
    this.drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.preventDefault();
  };

  private onDragEnd = () => {
    this.drag = null;
  };

  private toggleFlag(f: keyof Inspecta['flags']): void {
    this.flags[f] = !this.flags[f];
    this.renderToolbar();
  }

  private saveNote(): void {
    const el = this.selected;
    const ta = this.root.querySelector('textarea');
    if (!el || !ta) return;
    const text = ta.value.trim();
    const existing = this.notes.find((n) => n.element === el);
    if (!text) return;
    if (existing) existing.text = text;
    else this.notes.push({ id: ++this.noteSeq, element: el, selector: cssSelector(el), text });
    this.toast(existing ? 'Note updated' : `Note ${this.notes.length} added`);
    this.renderPanel();
    this.renderToolbar();
  }

  private onUiClick = (e: Event) => {
    const t = e.target as Element;
    const actEl = t.closest('[data-act]');
    const target = this.selected ?? this.hovered;
    if (actEl) {
      switch (actEl.getAttribute('data-act')) {
        case 'toggle': this.toggle(); break;
        case 'spacing': this.toggleFlag('spacing'); break;
        case 'text': this.toggleFlag('text'); break;
        case 'guides': this.toggleFlag('guides'); break;
        case 'help': this.helpOpen = !this.helpOpen; this.renderToolbar(); break;
        case 'parent': if (target?.parentElement) this.select(target.parentElement); break;
        case 'child': if (target?.firstElementChild) this.select(target.firstElementChild); break;
        case 'unpin': this.select(null); break;
        case 'copy-ai': {
          if (!target) break;
          const d = this.detail((e as MouseEvent).shiftKey);
          void this.copy(describe(target, d, this.notes.find((n) => n.element === target)?.text), 'ai', `Copied for AI (${d})`);
          break;
        }
        case 'copy-css': if (target) void this.copy(cssFor(target), 'css', 'CSS copied'); break;
        case 'copy-sel': if (target) void this.copy(cssSelector(target), 'selector', 'Selector copied'); break;
        case 'save-note': this.saveNote(); break;
        case 'remove-note':
          this.notes = this.notes.filter((n) => n.element !== this.selected);
          this.renderPanel();
          this.renderToolbar();
          break;
        case 'copy-notes':
          if (this.notes.length) void this.copy(this.notesMarkdown(this.detail((e as MouseEvent).shiftKey)), 'notes', `${this.notes.length} note${this.notes.length === 1 ? '' : 's'} copied`);
          else this.toast('Pin an element and add a note first');
          break;
        case 'clear-notes': this.notes = []; this.renderPanel(); this.renderToolbar(); break;
      }
      return;
    }
    const copyEl = t.closest('[data-copy]');
    if (copyEl) void this.copy(copyEl.getAttribute('data-copy') ?? '', 'value');
  };
}
