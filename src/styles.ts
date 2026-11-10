import { T } from './brand.gen';

// Every color is a --ps-* token defined on .ui, so host custom properties can't leak in.
const tokens = Object.entries(T)
  .map(([k, v]) => `--ps-${k}: ${v};`)
  .join(' ');

export const STYLES = /* css */ `
:host { all: initial; }
* { box-sizing: border-box; }
.ui {
  ${tokens}
  --ps-r-xs: 4px; --ps-r-sm: 6px; --ps-r: 8px; --ps-r-md: 10px; --ps-r-lg: 14px;
  --ps-shadow: 0 12px 32px rgb(0 0 0 / .35), 0 2px 6px rgb(0 0 0 / .2);
  --ps-ease: cubic-bezier(.2, 0, 0, 1); --ps-fast: 120ms; --ps-base: 200ms;
  --ps-sans: Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --ps-mono: "Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font: 500 13px/1.4 var(--ps-sans); color: var(--ps-snow); -webkit-font-smoothing: antialiased;
}
.ui ::selection { background: var(--ps-signal); color: var(--ps-ink); }
button { all: unset; box-sizing: border-box; cursor: pointer; font-family: var(--ps-sans); }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--ps-signal); outline-offset: 2px; }
/* keycaps: soft gradient, hairline edge, darker bottom lip */
kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 5px; vertical-align: middle;
  font: 500 11px/1 var(--ps-sans); color: #E6E8EB; white-space: nowrap; background: linear-gradient(180deg, #2A2C30 0%, #1C1D20 100%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .09), inset 0 1px 0 rgb(255 255 255 / .06), inset 0 -1.5px 0 rgb(0 0 0 / .55), 0 1px 2px rgb(0 0 0 / .45); }
.keys { display: inline-flex; gap: 3px; vertical-align: middle; }
.mf .keys { margin-left: 6px; }

/* the mark (icons.ts mark()) */
.mark { display: block; flex: none; }
.mark path { fill: var(--ps-signal); }

/* ---------- tooltips ---------- */
[data-tip] { position: relative; }
[data-tip]::after {
  content: attr(data-tip) "  " attr(data-kbd); position: absolute; left: 50%; bottom: calc(100% + 10px); transform: translate(-50%, 4px);
  padding: 6px 9px; border-radius: var(--ps-r-sm); background: var(--ps-void); border: 1px solid var(--ps-line-2); color: var(--ps-snow);
  font: 500 12px/1.2 var(--ps-sans); white-space: pre; pointer-events: none;
  opacity: 0; transition: opacity var(--ps-fast) var(--ps-ease), transform var(--ps-fast) var(--ps-ease); box-shadow: var(--ps-shadow); z-index: 5;
}
[data-tip]:hover::after { opacity: 1; transform: translate(-50%, 0); transition-delay: .3s; }
.dock.top [data-tip]::after { bottom: auto; top: calc(100% + 10px); transform: translate(-50%, -4px); }
.dock.top [data-tip]:hover::after { transform: translate(-50%, 0); }
/* Tooltips on the outer buttons line up with the dock's screen edge instead of running off it. */
.dock .fab[data-tip]::after, .dock .tb > :last-child[data-tip]::after { left: auto; right: -4px; transform: translate(0, 4px); }
.dock.left .fab[data-tip]::after, .dock.left .tb > :first-child[data-tip]::after { left: -4px; right: auto; }
.dock.left .tb > :last-child[data-tip]::after { left: 50%; right: auto; transform: translate(-50%, 4px); }
.dock .fab[data-tip]:hover::after, .dock .tb > :last-child[data-tip]:hover::after, .dock.left .tb > :first-child[data-tip]:hover::after { transform: translate(0, 0); }
.dock.left .tb > :last-child[data-tip]:hover::after { transform: translate(-50%, 0); }
.dock.left .tb > :first-child[data-tip]::after { transform: translate(0, 4px); }

/* ---------- overlay layer ---------- */
.layer { position: fixed; inset: 0; pointer-events: none; overflow: hidden; font: 500 11px/1 var(--ps-mono); font-variant-numeric: tabular-nums; }
.layer > div { position: absolute; }
.bx-m { background: color-mix(in srgb, var(--ps-margin) 24%, transparent); }
.bx-b { background: color-mix(in srgb, var(--ps-marker) 30%, transparent); }
.bx-p { background: color-mix(in srgb, var(--ps-pad) 30%, transparent); }
.bx-c { background: transparent; }
.ol-sel { border: 1.5px solid var(--ps-signal); border-radius: 1px; }
.ol-hov { border: 1px solid var(--ps-signal); background: color-mix(in srgb, var(--ps-signal) 5%, transparent); }
.ol-hov.big { background: none; }
.ol-par { border: 1px dashed var(--ps-redline); }
.hd { width: 7px; height: 7px; border-radius: 2px; background: #fff; border: 1px solid var(--ps-signal); }
.sv { transform: translate(-50%, -50%); padding: 2px 4px; border-radius: var(--ps-r-xs); font: 600 9.5px/1 var(--ps-mono); color: var(--ps-ink); }
.sv-p { background: var(--ps-pad); }
.sv-m { background: var(--ps-margin); }
.pill { transform: translate(-50%, -50%); height: 18px; padding: 0 6px; border-radius: var(--ps-r-xs); color: var(--ps-ink); line-height: 18px; white-space: nowrap;
  box-shadow: 0 1px 3px rgb(0 0 0 / .25); }
.pill-l { transform: translate(0, -50%); }
.dim-sel { background: var(--ps-signal); }
.tag-hov, .coord { background: var(--ps-night); color: var(--ps-snow); box-shadow: inset 0 0 0 1px var(--ps-line-2), 0 2px 6px rgb(0 0 0 / .25); }
.pd { margin-left: 8px; color: var(--ps-fog); }
.dl, .dcap, .dp { background: var(--ps-redline); }
.dcap, .dl { border-radius: 0; }
.dd-h { background: repeating-linear-gradient(90deg, var(--ps-redline) 0 3px, transparent 3px 6px); }
.dd-v { background: repeating-linear-gradient(180deg, var(--ps-redline) 0 3px, transparent 3px 6px); }
.gap { background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--ps-gap) 42%, transparent) 0 1.5px, color-mix(in srgb, var(--ps-gap) 10%, transparent) 1.5px 6px);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ps-gap) 70%, transparent); }
.gp { background: var(--ps-gap); height: 16px; line-height: 16px; padding: 0 4px; font-size: 10px; }
.tl { outline: 1px dashed var(--ps-signal-2); outline-offset: -1px; }
.gd-v, .gd-h { background: color-mix(in srgb, var(--ps-signal) 50%, transparent); }
.ch { background: color-mix(in srgb, var(--ps-redline) 50%, transparent); }

/* ---------- markers ---------- */
.marks { position: fixed; inset: 0; pointer-events: none; }
.mk { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: var(--ps-signal); color: var(--ps-ink);
  font: 600 11px/22px var(--ps-mono); text-align: center; pointer-events: auto;
  box-shadow: 0 0 0 2px #fff, 0 3px 10px rgb(0 0 0 / .25); animation: mk-in .22s var(--ps-ease); transition: transform var(--ps-fast) var(--ps-ease); }
.mk:hover, .mk.on { transform: scale(1.12); }
.mk[data-tip]::after { white-space: normal; width: max-content; max-width: 240px; text-align: left; font: 400 12px/1.4 var(--ps-sans); }
/* The element this note was on has been removed from the page. */
.mk.gone { background: var(--ps-mute); outline: 1.5px dashed var(--ps-mute); outline-offset: 3px; opacity: .85; }
@keyframes mk-in { from { transform: scale(.4); opacity: 0; } }

/* ---------- dock & toolbar ---------- */
.dock { position: fixed; right: 16px; bottom: 16px; pointer-events: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.dock.top { flex-direction: column-reverse; }
.tb { display: flex; align-items: center; gap: 2px; padding: 4px; background: var(--ps-night); border: 1px solid var(--ps-line-2); border-radius: var(--ps-r-lg);
  box-shadow: var(--ps-shadow); user-select: none; }
.tb.collapsed { padding: 0; }
.tb.opening > * { animation: fade-in var(--ps-base) var(--ps-ease) both; }
.fab { width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; color: var(--ps-snow); transition: background var(--ps-fast) var(--ps-ease); }
.fab:hover { background: var(--ps-deep); }
.ib { width: 36px; height: 36px; border-radius: var(--ps-r-md); display: grid; place-items: center; color: var(--ps-fog);
  transition: background var(--ps-fast) var(--ps-ease), color var(--ps-fast) var(--ps-ease); }
.ib:hover { background: var(--ps-deep); color: var(--ps-snow); }
.ib.on { background: var(--ps-deep); color: var(--ps-signal-2); box-shadow: inset 0 0 0 1px var(--ps-line-2); }
.ib.ok { color: var(--ps-pad); }
.ib.close:hover { color: var(--ps-redline); }
.sep { width: 1px; height: 20px; background: var(--ps-line-2); margin: 0 4px; }
.bdg { position: absolute; top: 2px; right: 1px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--ps-signal); color: var(--ps-ink);
  font: 600 10px/16px var(--ps-mono); text-align: center; box-shadow: 0 0 0 2px var(--ps-night); }
.bdg.bump { animation: bump .35s var(--ps-ease); }
@keyframes bump { 40% { transform: scale(1.3); } }
@keyframes fade-in { from { opacity: 0; transform: scale(.94); } }

/* settings menu */
.menu { width: 272px; padding: 6px; background: var(--ps-night); border: 1px solid var(--ps-line-2); border-radius: var(--ps-r-lg); box-shadow: var(--ps-shadow);
  animation: pop-in var(--ps-fast) var(--ps-ease); }
.menu[hidden] { display: none; }
.mh { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px 10px; }
.mh b { display: flex; align-items: center; gap: 8px; font: 600 13.5px/1 var(--ps-sans); letter-spacing: -.01em; color: var(--ps-snow); }
.mh span { color: var(--ps-mute); font: 500 11px var(--ps-mono); }
.mi { width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 8px; border-radius: var(--ps-r); color: var(--ps-snow); }
.mi:hover { background: var(--ps-deep); }
.mi kbd { margin-left: 6px; }
.mi.col { flex-direction: column; align-items: stretch; }
.mi.col:hover { background: none; }
.mi.col > span:first-child { font-size: 12px; color: var(--ps-mute); }
.seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--ps-void); border: 1px solid var(--ps-line); border-radius: var(--ps-r); padding: 2px; }
.seg button { text-align: center; padding: 5px 8px; border-radius: var(--ps-r-sm); color: var(--ps-fog); font-size: 12px; }
.seg button:hover { color: var(--ps-snow); }
.seg button.on { background: var(--ps-deep); color: var(--ps-snow); box-shadow: inset 0 0 0 1px var(--ps-line-2); }
.sub { color: var(--ps-mute); font-size: 11.5px; margin-top: 8px; }
.switch { width: 30px; height: 18px; border-radius: 9px; background: var(--ps-line-2); position: relative; flex: none; transition: background var(--ps-fast) var(--ps-ease); }
.switch::before { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--ps-fog); transition: transform var(--ps-fast) var(--ps-ease), background var(--ps-fast); }
.switch.on { background: var(--ps-signal); }
.switch.on::before { transform: translateX(12px); background: #fff; }
.mf { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 4px; margin-top: 4px; border-top: 1px solid var(--ps-line); color: var(--ps-mute); font-size: 11.5px; }

/* ---------- buttons ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: var(--ps-r);
  font: 500 12.5px/1 var(--ps-sans); color: var(--ps-snow); white-space: nowrap; background: var(--ps-deep); box-shadow: inset 0 0 0 1px var(--ps-line-2);
  transition: background var(--ps-fast) var(--ps-ease), color var(--ps-fast) var(--ps-ease); }
.btn:hover { background: #1D1E21; }
.btn svg { flex: none; color: var(--ps-fog); }
.btn:hover svg { color: var(--ps-snow); }
.btn.sm { height: 28px; padding: 0 10px; font-size: 12px; }
.btn.pri { color: var(--ps-ink); background: var(--ps-snow); box-shadow: none; border-radius: 999px; }
.btn.pri:hover { background: #fff; }
.btn.pri:disabled { opacity: .4; cursor: default; }
.btn.pri kbd { color: #3A3C41; background: linear-gradient(180deg, #FFFFFF 0%, #ECECEE 100%); box-shadow: inset 0 0 0 1px rgb(10 10 10 / .12), inset 0 -1.5px 0 rgb(10 10 10 / .1); }
.btn.tint { color: var(--ps-signal-2); background: color-mix(in srgb, var(--ps-signal) 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ps-signal) 35%, transparent); }
.btn.tint svg { color: var(--ps-signal-2); }
.btn.tint:hover { background: color-mix(in srgb, var(--ps-signal) 20%, transparent); color: var(--ps-snow); }
.btn.ghost { background: transparent; box-shadow: none; color: var(--ps-fog); }
.btn.ghost:hover { background: var(--ps-deep); color: var(--ps-snow); }
.btn.danger { color: var(--ps-redline); }
.btn.danger svg { color: currentColor; }
.btn.danger:hover { background: color-mix(in srgb, var(--ps-redline) 14%, transparent); color: var(--ps-redline); }
.btn.accent { color: var(--ps-signal-2); }
.btn.accent:hover { background: color-mix(in srgb, var(--ps-signal) 12%, transparent); color: var(--ps-signal-2); }

/* ---------- popover ---------- */
.pop { position: fixed; left: 0; top: 0; width: 360px; max-height: min(600px, calc(100vh - 24px)); display: flex; flex-direction: column; pointer-events: auto;
  background: var(--ps-night); border-radius: var(--ps-r-lg); overflow: hidden; box-shadow: 0 0 0 1px var(--ps-line-2), var(--ps-shadow);
  animation: pop-in var(--ps-fast) var(--ps-ease); }
.pop[hidden] { display: none; }
.pop.shake { animation: shake .35s var(--ps-ease); }
@keyframes pop-in { from { opacity: 0; transform: translateY(4px) scale(.99); } }
@keyframes shake { 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }

.ph { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--ps-line); flex: none; }
.pid { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; }
.pid .tag { flex: none; height: 22px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: var(--ps-r-sm);
  background: color-mix(in srgb, var(--ps-signal) 16%, transparent); color: var(--ps-signal-2); font: 600 12px var(--ps-mono); }
.pid code { min-width: 0; font: 500 12px var(--ps-mono); color: var(--ps-fog); overflow: hidden; text-overflow: ellipsis; }
.pid .comp { flex: none; height: 22px; padding: 0 7px; display: inline-flex; align-items: center; gap: 5px; border-radius: var(--ps-r-sm);
  background: var(--ps-deep); box-shadow: inset 0 0 0 1px var(--ps-line-2); color: var(--ps-fog); font: 500 11.5px var(--ps-sans); }
.pid .comp svg { color: var(--ps-signal-2); }
.pa { display: flex; align-items: center; gap: 2px; flex: none; }
.pa .nav { display: contents; }
.pa .ib { width: 30px; height: 30px; border-radius: var(--ps-r); }
.pa .ib svg { width: 16px; height: 16px; }

.pbody { overflow: auto; overscroll-behavior: contain; padding: 12px 14px 0; scrollbar-width: thin; scrollbar-color: var(--ps-line-2) transparent; }
.quote { margin: 0 0 12px; padding: 8px 12px; border-left: 2px solid var(--ps-signal); border-radius: 0 var(--ps-r) var(--ps-r) 0; background: var(--ps-deep);
  color: var(--ps-snow); font: 400 12.5px/1.5 var(--ps-sans); }
.specs { display: grid; gap: 2px; margin-bottom: 6px; }
.sr { display: grid; grid-template-columns: 64px 1fr; gap: 10px; align-items: start; min-height: 28px; }
.sk { color: var(--ps-mute); font-size: 12px; line-height: 26px; }
.sc { display: flex; flex-wrap: wrap; gap: 0 6px; padding-top: 1px; }
.chip { display: inline-flex; align-items: center; height: 26px; padding: 0 6px; margin: 0 -2px; border-radius: var(--ps-r-sm); background: transparent;
  font: 500 12px/1 var(--ps-mono); color: var(--ps-snow); cursor: copy; transition: background var(--ps-fast) var(--ps-ease); max-width: 100%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; }
.chip:hover { background: var(--ps-deep); }
.chip:active { background: color-mix(in srgb, var(--ps-signal) 18%, transparent); }
.cd { color: var(--ps-mute); margin-right: 5px; font: 500 11.5px var(--ps-sans); }
.ci { display: inline-flex; margin-right: 6px; color: var(--ps-mute); }
.c-pad .ci { color: var(--ps-pad); }
.c-mar .ci { color: var(--ps-margin); }
.c-gap .ci { color: var(--ps-gap); }
.cr { display: inline-flex; align-items: center; height: 26px; padding: 0 4px; font: 500 11.5px/1 var(--ps-sans); }
.cr::before { content: ""; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; background: currentColor; }
.cr.ok { color: var(--ps-pad); }
.cr.no { color: var(--ps-redline); }

.pid .ident { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; cursor: copy; border-radius: var(--ps-r-sm); }
.pid .ident:hover .tag { background: color-mix(in srgb, var(--ps-signal) 26%, transparent); }
.pid .ident:hover code { color: var(--ps-snow); }
/* Tooltips inside the popover open downward so they never cover the header. */
.pop [data-tip]::after { bottom: auto; top: calc(100% + 8px); transform: translate(-50%, -4px); }
.pop [data-tip]:hover::after { transform: translate(-50%, 0); }
.pa .close[data-tip]::after { left: auto; right: 0; transform: translate(0, -4px); }
.pa .close[data-tip]:hover::after { transform: translate(0, 0); }

.more { margin: 0 -14px; }
.more > summary { list-style: none; cursor: pointer; height: 38px; padding: 0 14px; color: var(--ps-fog); font-size: 12px;
  display: flex; align-items: center; gap: 8px; user-select: none; transition: background var(--ps-fast) var(--ps-ease); }
.more > summary:hover { background: var(--ps-deep); color: var(--ps-snow); }
.more > summary::-webkit-details-marker { display: none; }
.more > summary svg { color: var(--ps-mute); transition: transform var(--ps-fast) var(--ps-ease); }
.more[open] > summary svg { transform: rotate(90deg); }
.more > summary em { margin-left: auto; font: 400 11.5px var(--ps-sans); color: var(--ps-mute); font-style: normal; }
.mb { padding: 2px 14px 10px; }

.pn { padding: 12px; border-top: 1px solid var(--ps-line); flex: none; }
.composer { position: relative; border-radius: var(--ps-r-md); background: var(--ps-void); box-shadow: inset 0 0 0 1px var(--ps-line); transition: box-shadow var(--ps-fast) var(--ps-ease); }
.composer:hover { box-shadow: inset 0 0 0 1px var(--ps-line-2); }
.composer:focus-within { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ps-signal) 70%, transparent); }
textarea { all: unset; display: block; box-sizing: border-box; width: 100%; min-height: 44px; max-height: 168px; overflow-y: auto; resize: none;
  padding: 11px 12px 2px; color: var(--ps-snow); font: 400 13px/1.5 var(--ps-sans); white-space: pre-wrap; word-break: break-word;
  scrollbar-width: thin; scrollbar-color: var(--ps-line-2) transparent; }
textarea::placeholder { color: var(--ps-mute); }
textarea:focus, textarea:focus-visible { outline: none; }
.cbar { display: flex; align-items: center; gap: 4px; padding: 4px 6px 6px 12px; min-height: 40px; }
.chint { flex: 1; min-width: 0; color: var(--ps-mute); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: 0; transition: opacity var(--ps-base) var(--ps-ease); }
.composer:focus-within .chint { opacity: 1; }
.chint kbd { min-width: 18px; height: 18px; padding: 0 5px; font-size: 10.5px; }
.cbar .del { width: 28px; height: 28px; border-radius: var(--ps-r); color: var(--ps-mute); }
.cbar .del:hover { color: var(--ps-redline); background: color-mix(in srgb, var(--ps-redline) 14%, transparent); }
.send { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: var(--ps-ink); background: var(--ps-signal);
  transition: background var(--ps-fast) var(--ps-ease), color var(--ps-fast) var(--ps-ease), transform var(--ps-fast) var(--ps-ease); }
.send:hover { background: #2AA6FF; }
.send:active { transform: scale(.94); }
.send:disabled { cursor: default; color: var(--ps-mute); background: var(--ps-deep); transform: none; }
.ptip { display: flex; align-items: center; gap: 8px; padding: 10px 14px; line-height: 1.45; border-top: 1px solid var(--ps-line); background: var(--ps-deep);
  color: var(--ps-fog); font-size: 12px; flex: none; }
.ptip b { color: var(--ps-snow); font-weight: 600; }
.ptip svg { flex: none; color: var(--ps-signal-2); }

/* full property list (inside "All properties") */
.mb details { border-top: 1px solid var(--ps-line); }
.mb summary { list-style: none; cursor: pointer; padding: 8px 0; font-weight: 600; font-size: 12px; color: var(--ps-snow);
  display: flex; align-items: center; gap: 8px; user-select: none; }
.mb summary::-webkit-details-marker { display: none; }
.mb summary::before { content: ''; border-left: 4px solid var(--ps-mute); border-top: 4px solid transparent; border-bottom: 4px solid transparent; transition: transform var(--ps-fast) var(--ps-ease); }
.mb details[open] > summary::before { transform: rotate(90deg); }
.badge { margin-left: auto; font-weight: 500; color: var(--ps-mute); font-size: 11px; }
.sb { padding: 0 0 8px; }
.row { display: grid; grid-template-columns: 98px 1fr; gap: 8px; padding: 2px 0; align-items: start; font-size: 12px; }
.k { color: var(--ps-mute); }
.v { font: 11.5px/1.45 var(--ps-mono); color: var(--ps-snow); word-break: break-word; cursor: copy; border-radius: var(--ps-r-xs); padding: 0 3px; margin: 0 -3px; }
.v:hover { background: var(--ps-deep); }
.v.mu { color: var(--ps-mute); }
.sw { display: inline-block; flex: none; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; overflow: hidden;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .2); background: repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 6px 6px; }
.sw > i { display: block; width: 100%; height: 100%; }
.wc { display: inline-block; font: 600 10px/1.5 var(--ps-sans); padding: 0 5px; border-radius: var(--ps-r-xs); margin-left: 4px; }
.wc.ok { background: color-mix(in srgb, var(--ps-pad) 16%, transparent); color: var(--ps-pad); }
.wc.no { background: color-mix(in srgb, var(--ps-redline) 16%, transparent); color: var(--ps-redline); }
.spec { font-size: 26px; line-height: 1.2; color: var(--ps-snow); padding: 2px 0 8px; display: flex; align-items: baseline; gap: 10px; overflow: hidden; white-space: nowrap; }
.spec span { font-size: 12px; color: var(--ps-fog); overflow: hidden; text-overflow: ellipsis; }
.bm { position: relative; display: grid; grid-template-columns: 28px 1fr 28px; grid-template-rows: 18px auto 18px; grid-template-areas: ". t ." "l in r" ". b .";
  text-align: center; align-items: center; border-radius: var(--ps-r-xs); padding: 2px; font: 500 10.5px/1 var(--ps-mono); color: var(--ps-ink); margin-bottom: 8px; }
.bm .bm { margin: 0; }
.bm > .t { grid-area: t; } .bm > .b { grid-area: b; } .bm > .l { grid-area: l; } .bm > .r { grid-area: r; } .bm > .in { grid-area: in; }
.bl { position: absolute; left: 5px; top: 4px; font: 600 9px/1 var(--ps-sans); text-transform: uppercase; letter-spacing: .04em; opacity: .6; }
.bm-m { background: var(--ps-margin); border: 1px dashed rgb(0 0 0 / .4); }
.bm-b { background: var(--ps-marker); border: 1px solid var(--ps-ink); }
.bm-p { background: var(--ps-pad); border: 1px dashed rgb(0 0 0 / .4); }
.bm-c { background: var(--ps-signal-2); border: 1px solid rgb(0 0 0 / .4); padding: 8px 4px; border-radius: 2px; }

/* ---------- onboarding hint & toast ---------- */
.hint { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; padding: 7px 7px 7px 14px; pointer-events: auto;
  background: var(--ps-night); border: 1px solid var(--ps-line-2); border-radius: var(--ps-r-lg); box-shadow: var(--ps-shadow); color: var(--ps-fog); font-size: 12.5px; white-space: nowrap;
  animation: rise var(--ps-base) var(--ps-ease); }
.hint[hidden] { display: none; }
.hint b { color: var(--ps-snow); font-weight: 600; }
@keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } }
.toast { position: fixed; left: 50%; top: 16px; transform: translate(-50%, -8px); display: flex; align-items: center; gap: 10px; padding: 7px 8px 7px 12px; border-radius: var(--ps-r-lg);
  background: var(--ps-night); border: 1px solid var(--ps-line-2); color: var(--ps-snow); font-weight: 500; font-size: 12.5px; box-shadow: var(--ps-shadow); opacity: 0; pointer-events: none;
  transition: opacity var(--ps-fast) var(--ps-ease), transform var(--ps-fast) var(--ps-ease); white-space: nowrap; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
.toast.act { pointer-events: auto; }
.toast:not(.act) { padding-right: 14px; }

@media (prefers-reduced-motion: reduce) { .ui *, .ui *::after { animation: none !important; transition: none !important; } }
`;
