export const STYLES = /* css */ `
:host { all: initial; }
* { box-sizing: border-box; }
.ui {
  --bg: #18181b; --bg2: #232327; --line: rgba(255,255,255,.09); --fg: #f4f4f5; --fg2: #a1a1aa; --fg3: #71717a;
  --accent: #0d99ff; --accent-soft: rgba(13,153,255,.16); --accent-fg: #6cc2ff; --mk: #0d99ff;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font: 500 13px/1.4 var(--sans); color: var(--fg); -webkit-font-smoothing: antialiased;
}
button { all: unset; box-sizing: border-box; cursor: pointer; font-family: var(--sans); }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
kbd { display: inline-block; min-width: 18px; padding: 1px 5px; border-radius: 5px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.08);
  font: 600 10.5px/1.4 var(--mono); color: var(--fg); text-align: center; }

/* ---------- tooltips ---------- */
[data-tip] { position: relative; }
[data-tip]::after {
  content: attr(data-tip) "  " attr(data-kbd); position: absolute; left: 50%; bottom: calc(100% + 10px); transform: translate(-50%, 4px);
  padding: 5px 8px; border-radius: 7px; background: #09090b; color: #fff; font: 500 11.5px/1.2 var(--sans); white-space: pre; pointer-events: none;
  opacity: 0; transition: opacity .12s, transform .12s; box-shadow: 0 4px 14px rgba(0,0,0,.3); z-index: 5;
}
[data-tip]:hover::after { opacity: 1; transform: translate(-50%, 0); transition-delay: .3s; }
.dock.top [data-tip]::after { bottom: auto; top: calc(100% + 10px); transform: translate(-50%, -4px); }
.dock.top [data-tip]:hover::after { transform: translate(-50%, 0); }

/* ---------- overlay layer ---------- */
.layer { position: fixed; inset: 0; pointer-events: none; overflow: hidden; font: 600 10.5px/1.2 var(--sans); font-variant-numeric: tabular-nums; }
.layer > div { position: absolute; }
.bx-m { background: rgba(246, 178, 107, .3); }
.bx-b { background: rgba(255, 229, 153, .45); }
.bx-p { background: rgba(147, 196, 125, .36); }
.bx-c { background: rgba(111, 168, 220, .22); }
.ol-sel { border: 1.5px solid var(--accent); }
.ol-hov { border: 1px solid var(--accent); background: rgba(13,153,255,.05); }
.ol-par { border: 1px dashed #f24822; }
.sv { transform: translate(-50%, -50%); font-size: 9.5px; font-weight: 700; }
.sv-p { color: #2c6e1a; }
.sv-m { color: #9a5212; }
.pill { transform: translate(-50%, -50%); padding: 3px 6px; border-radius: 5px; color: #fff; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.pill-l { transform: translate(0, -50%); }
.tag-sel, .dim-sel { background: var(--accent); }
.tag-hov, .dim-hov { background: #27272a; }
.dl, .dcap, .dp { background: #f24822; }
.dd-h { background: repeating-linear-gradient(90deg, #f24822 0 3px, transparent 3px 6px); }
.dd-v { background: repeating-linear-gradient(180deg, #f24822 0 3px, transparent 3px 6px); }
.gap { background: repeating-linear-gradient(-45deg, rgba(232, 62, 140, .42) 0 1.5px, rgba(232, 62, 140, .1) 1.5px 6px); box-shadow: inset 0 0 0 1px rgba(232, 62, 140, .7); }
.gp { background: #e83e8c; font-size: 9.5px; padding: 2px 4px; }
.tl { box-shadow: inset 0 0 0 1px rgba(124, 58, 237, .8); background: rgba(124, 58, 237, .06); }
.gd-v, .gd-h { background: rgba(13, 153, 255, .5); }
.ch { background: rgba(242, 72, 34, .5); }
.coord { background: #09090b; }

/* ---------- markers ---------- */
.marks { position: fixed; inset: 0; pointer-events: none; }
.mk { position: absolute; width: 22px; height: 22px; border-radius: 11px; background: var(--mk); color: #fff; font: 700 11px/22px var(--sans); text-align: center;
  pointer-events: auto; box-shadow: 0 0 0 2px #fff, 0 3px 10px rgba(0,0,0,.25); animation: mk-in .28s cubic-bezier(.3,1.6,.5,1); transition: transform .12s; }
.mk:hover, .mk.on { transform: scale(1.15); }
.mk[data-tip]::after { white-space: normal; width: max-content; max-width: 240px; text-align: left; line-height: 1.35; }
@keyframes mk-in { from { transform: scale(0); } }

/* ---------- dock & toolbar ---------- */
.dock { position: fixed; right: 16px; bottom: 16px; pointer-events: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.dock.top { flex-direction: column-reverse; }
.tb { display: flex; align-items: center; gap: 2px; padding: 4px; background: var(--bg); border: 1px solid var(--line); border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.15); user-select: none; touch-action: none; }
.tb.collapsed { padding: 0; border-radius: 50%; }
.tb.dragging { cursor: grabbing; }
.tb.opening > * { animation: fade-in .18s ease-out both; }
.fab { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; color: #fff; transition: transform .15s, background .15s; }
.fab:hover { transform: scale(1.06); background: var(--bg2); }
.ib { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--fg2); transition: background .12s, color .12s; }
.ib:hover { background: rgba(255,255,255,.08); color: #fff; }
.ib.on { color: var(--accent-fg); background: var(--accent-soft); }
.ib.ok { color: #4ade80; }
.ib.close:hover { color: #fca5a5; }
.sep { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.bdg { position: absolute; top: 1px; right: 0; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--mk); color: #fff;
  font: 700 10px/16px var(--sans); text-align: center; box-shadow: 0 0 0 2px var(--bg); }
.bdg.bump { animation: bump .35s cubic-bezier(.3,1.6,.5,1); }
@keyframes bump { 40% { transform: scale(1.4); } }
@keyframes fade-in { from { opacity: 0; transform: scale(.9); } }

/* settings menu */
.menu { width: 268px; padding: 6px; background: var(--bg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,.35); animation: pop-in .14s ease-out; }
.menu[hidden] { display: none; }
.mh { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 8px 8px; font-weight: 650; }
.mh span { color: var(--fg3); font: 500 11px var(--mono); }
.mi { width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 8px; border-radius: 8px; color: #e4e4e7; }
.mi:hover { background: rgba(255,255,255,.04); }
.mi kbd { margin-left: 6px; }
.mi.col { flex-direction: column; align-items: stretch; }
.seg { display: grid; grid-template-columns: 1fr 1fr; background: rgba(255,255,255,.06); border-radius: 8px; padding: 2px; }
.seg button { text-align: center; padding: 5px 8px; border-radius: 6px; color: var(--fg2); font-size: 12px; }
.seg button.on { background: #3f3f46; color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
.sub { color: var(--fg3); font-size: 11.5px; margin-top: 6px; }
.switch { width: 30px; height: 18px; border-radius: 9px; background: #3f3f46; position: relative; flex: none; transition: background .15s; }
.switch::before { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .15s; }
.switch.on { background: var(--accent); }
.switch.on::before { transform: translateX(12px); }
.mf { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 4px; margin-top: 4px; border-top: 1px solid var(--line); color: var(--fg3); font-size: 11.5px; }

/* ---------- buttons ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px;
  font: 600 12.5px/1 var(--sans); letter-spacing: -.005em; color: var(--fg); white-space: nowrap;
  background: rgba(255,255,255,.07); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.04);
  transition: background .12s, box-shadow .12s, color .12s, transform .06s; }
.btn:hover { background: rgba(255,255,255,.11); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.05); }
.btn:active { transform: translateY(.5px); background: rgba(255,255,255,.06); }
.btn svg { flex: none; color: var(--fg2); transition: color .12s; }
.btn:hover svg { color: var(--fg); }
.btn.sm { height: 30px; padding: 0 10px; font-size: 12px; }
.btn.pri { color: #fff; background: linear-gradient(180deg, #2aa6ff, #0d8fef); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.22), 0 1px 2px rgba(0,0,0,.35); }
.btn.pri:hover { background: linear-gradient(180deg, #45b2ff, #1f9bf5); }
.btn.pri:disabled { opacity: .4; cursor: default; transform: none; }
.btn.pri kbd { background: rgba(255,255,255,.18); border-color: transparent; color: #fff; min-width: 0; padding: 1px 4px; font-size: 10px; }
.btn.tint { color: #bfe3ff; background: rgba(13,153,255,.14); box-shadow: inset 0 0 0 1px rgba(13,153,255,.32); }
.btn.tint svg { color: #6cc2ff; }
.btn.tint:hover { background: rgba(13,153,255,.22); box-shadow: inset 0 0 0 1px rgba(13,153,255,.45); color: #fff; }
.btn.ghost { background: transparent; box-shadow: none; color: var(--fg2); }
.btn.ghost:hover { background: rgba(255,255,255,.07); color: var(--fg); }
.btn.danger { color: #f8a5a5; }
.btn.danger svg { color: currentColor; }
.btn.danger:hover { background: rgba(239,68,68,.12); color: #fecaca; }
.btn.accent { color: var(--accent); }
.btn.accent:hover { background: rgba(13,153,255,.1); color: var(--accent); }

/* ---------- popover ---------- */
.pop { position: fixed; left: 0; top: 0; width: 360px; max-height: min(600px, calc(100vh - 24px)); display: flex; flex-direction: column; pointer-events: auto;
  background: var(--bg); border-radius: 14px; overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,.09), 0 24px 60px -12px rgba(0,0,0,.5), 0 8px 20px -8px rgba(0,0,0,.3);
  animation: pop-in .16s cubic-bezier(.2,.9,.3,1); }
.pop[hidden] { display: none; }
.pop.shake { animation: shake .35s; }
@keyframes pop-in { from { opacity: 0; transform: translateY(4px) scale(.985); } }
@keyframes shake { 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }

.ph { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--line); flex: none; }
.pid { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; }
.pid .tag { flex: none; height: 22px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 6px; background: var(--accent-soft);
  color: var(--accent-fg); font: 600 12px var(--mono); }
.pid code { min-width: 0; font: 500 12.5px var(--mono); color: var(--fg2); overflow: hidden; text-overflow: ellipsis; }
.pid .comp { flex: none; height: 22px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 6px; background: rgba(167,139,250,.12);
  color: #c9b5ff; font: 600 11.5px var(--sans); }
.pa { display: flex; align-items: center; gap: 4px; flex: none; }
.pa .nav { display: flex; padding: 2px; border-radius: 8px; background: rgba(255,255,255,.05); }
.pa .ib { width: 28px; height: 28px; border-radius: 6px; }

.pbody { overflow: auto; padding: 12px 14px 0; scrollbar-width: thin; scrollbar-color: #3f3f46 transparent; }
.quote { margin: 0 0 12px; padding: 8px 12px; border-left: 2px solid var(--mk); border-radius: 0 8px 8px 0; background: rgba(13,153,255,.06);
  color: #d4d4d8; font: italic 400 12.5px/1.5 var(--sans); }
.specs { display: grid; gap: 4px; }
.sr { display: grid; grid-template-columns: 64px 1fr; gap: 10px; align-items: start; min-height: 28px; }
.sk { color: var(--fg3); font-size: 12px; line-height: 26px; }
.sc { display: flex; flex-wrap: wrap; gap: 4px; padding-top: 1px; }
.chip { display: inline-flex; align-items: center; height: 24px; padding: 0 7px; border-radius: 6px; background: rgba(255,255,255,.045);
  font: 500 12px/1 var(--mono); color: var(--fg); cursor: copy; transition: background .1s, box-shadow .1s; max-width: 100%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; }
.chip:hover { background: rgba(255,255,255,.09); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
.chip:active { background: rgba(13,153,255,.18); }
.cd { color: var(--fg3); margin-right: 5px; font: 500 11.5px var(--sans); }
.c-pad .cd { color: #8fd17a; }
.c-mar .cd { color: #f6b26b; }
.c-gap .cd { color: #f472b6; }
.cr { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 6px; font: 600 11.5px/1 var(--sans); }
.cr.ok { background: rgba(34,197,94,.12); color: #86efac; }
.cr.no { background: rgba(239,68,68,.14); color: #fca5a5; }

.specs { margin-bottom: 12px; }
.pid .ident { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; cursor: copy; border-radius: 7px; }
.pid .ident:hover .tag { background: rgba(13,153,255,.26); }
.pid .ident:hover code { color: var(--fg); }
.pid .ident:active .tag { transform: scale(.96); }
/* Tooltips inside the popover open downward so the popover edge never clips them. */
.pop [data-tip]::after { bottom: auto; top: calc(100% + 8px); transform: translate(-50%, -4px); }
.pop [data-tip]:hover::after { transform: translate(-50%, 0); }
.pa .close[data-tip]::after { left: auto; right: 0; transform: translate(0, -4px); }
.pa .close[data-tip]:hover::after { transform: translate(0, 0); }

.more { border-top: 1px solid var(--line); margin: 0 -14px; }
.more > summary { list-style: none; cursor: pointer; height: 42px; padding: 0 14px; color: var(--fg); font-size: 12.5px; font-weight: 600;
  display: flex; align-items: center; gap: 8px; user-select: none; transition: background .12s; }
.more > summary:hover { background: rgba(255,255,255,.035); }
.more > summary::-webkit-details-marker { display: none; }
.more > summary svg { color: var(--fg3); transition: transform .15s; }
.more[open] > summary svg { transform: rotate(90deg); }
.more > summary em { margin-left: auto; font: 400 11.5px var(--sans); color: var(--fg3); font-style: normal; }
.mb { padding: 2px 14px 10px; }

.pn { padding: 12px; border-top: 1px solid var(--line); flex: none; }
.composer { position: relative; border-radius: 12px; background: rgba(0,0,0,.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 2px rgba(0,0,0,.25);
  transition: box-shadow .2s ease, background .2s ease; }
.composer:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,.11), inset 0 1px 2px rgba(0,0,0,.25); }
.composer:focus-within { background: rgba(0,0,0,.28);
  box-shadow: inset 0 0 0 1px rgba(13,153,255,.5), 0 0 0 4px rgba(13,153,255,.07), inset 0 1px 2px rgba(0,0,0,.25); }
textarea { all: unset; display: block; box-sizing: border-box; width: 100%; min-height: 44px; max-height: 168px; overflow-y: auto; resize: none;
  padding: 11px 12px 2px; color: var(--fg); font: 400 13px/1.5 var(--sans); white-space: pre-wrap; word-break: break-word;
  scrollbar-width: thin; scrollbar-color: #3f3f46 transparent; }
textarea::placeholder { color: var(--fg3); }
textarea:focus, textarea:focus-visible { outline: none; }
.cbar { display: flex; align-items: center; gap: 4px; padding: 4px 6px 6px 12px; min-height: 40px; }
.chint { flex: 1; min-width: 0; color: var(--fg3); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: 0; transform: translateY(2px); transition: opacity .2s ease, transform .2s ease; }
.composer:focus-within .chint { opacity: 1; transform: none; }
.chint kbd { min-width: 0; padding: 0 4px; font-size: 10px; line-height: 16px; background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.06); color: var(--fg2); }
.cbar .del { width: 28px; height: 28px; border-radius: 8px; color: var(--fg3); }
.cbar .del:hover { color: #fca5a5; background: rgba(239,68,68,.12); }
.send { flex: none; width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(180deg, #2aa6ff, #0d8fef);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.14), inset 0 1px 0 rgba(255,255,255,.25), 0 2px 6px rgba(13,143,239,.35);
  transition: background .2s ease, box-shadow .2s ease, color .2s ease, transform .12s ease; }
.send:hover { transform: translateY(-1px); background: linear-gradient(180deg, #45b2ff, #1f9bf5); }
.send:active { transform: translateY(0) scale(.94); }
.send:disabled { cursor: default; transform: none; color: var(--fg3); background: rgba(255,255,255,.06);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
.send svg { transition: transform .2s ease; }
.send:not(:disabled):hover svg { transform: translateY(-1px); }
.ptip { display: flex; align-items: center; gap: 8px; padding: 9px 14px; font-weight: 500; line-height: 1.45; border-top: 1px solid rgba(13,153,255,.18); background: rgba(13,153,255,.07);
  color: #a9d8ff; font-size: 12px; flex: none; }
.ptip svg { flex: none; color: #6cc2ff; }

/* full property list (inside "All properties") */
.mb details { border-top: 1px solid rgba(255,255,255,.05); }
.mb summary { list-style: none; cursor: pointer; padding: 7px 0; font-weight: 600; font-size: 12px; color: #e4e4e7; display: flex; align-items: center; gap: 6px; user-select: none; }
.mb summary::-webkit-details-marker { display: none; }
.mb summary::before { content: ''; border-left: 4px solid var(--fg3); border-top: 4px solid transparent; border-bottom: 4px solid transparent; transition: transform .12s; }
.mb details[open] > summary::before { transform: rotate(90deg); }
.badge { margin-left: auto; font-weight: 500; color: var(--fg3); font-size: 11px; }
.sb { padding: 0 0 8px; }
.row { display: grid; grid-template-columns: 98px 1fr; gap: 8px; padding: 2px 0; align-items: start; font-size: 12px; }
.k { color: var(--fg3); }
.v { font: 11.5px/1.45 var(--mono); color: #e4e4e7; word-break: break-word; cursor: copy; border-radius: 4px; padding: 0 3px; margin: 0 -3px; }
.v:hover { background: rgba(255,255,255,.08); }
.v.mu { color: var(--fg3); }
.sw { display: inline-block; flex: none; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); background: repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 6px 6px; }
.sw > i { display: block; width: 100%; height: 100%; }
.wc { display: inline-block; font: 600 10px/1.5 var(--sans); padding: 0 5px; border-radius: 4px; margin-left: 4px; }
.wc.ok { background: #14532d; color: #86efac; }
.wc.no { background: #5f1d1d; color: #fca5a5; }
.spec { font-size: 26px; line-height: 1.2; color: #fff; padding: 2px 0 8px; display: flex; align-items: baseline; gap: 10px; overflow: hidden; white-space: nowrap; }
.spec span { font-size: 12px; color: var(--fg2); overflow: hidden; text-overflow: ellipsis; }
.bm { position: relative; display: grid; grid-template-columns: 28px 1fr 28px; grid-template-rows: 18px auto 18px; grid-template-areas: ". t ." "l in r" ". b .";
  text-align: center; align-items: center; border-radius: 4px; padding: 2px; font: 10.5px/1 var(--mono); color: #1b1b1b; margin-bottom: 8px; }
.bm .bm { margin: 0; }
.bm > .t { grid-area: t; } .bm > .b { grid-area: b; } .bm > .l { grid-area: l; } .bm > .r { grid-area: r; } .bm > .in { grid-area: in; }
.bl { position: absolute; left: 5px; top: 4px; font: 600 9px/1 var(--sans); text-transform: uppercase; letter-spacing: .04em; opacity: .6; }
.bm-m { background: #f6c38f; border: 1px dashed #a96a2c; }
.bm-b { background: #fde8a8; border: 1px solid #1b1b1b; }
.bm-p { background: #b9d9a8; border: 1px dashed #4b7a37; }
.bm-c { background: #a5c8ec; border: 1px solid #4b7fb5; padding: 8px 4px; border-radius: 2px; }

/* ---------- onboarding hint & toast ---------- */
.hint { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; padding: 8px 8px 8px 16px; pointer-events: auto;
  background: var(--bg); border: 1px solid var(--line); border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.28); color: var(--fg2); font-size: 12.5px; white-space: nowrap;
  animation: rise .25s ease-out; }
.hint[hidden] { display: none; }
.hint b { color: #fff; font-weight: 600; }
@keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } }
.toast { position: fixed; left: 50%; top: 16px; transform: translate(-50%, -8px); display: flex; align-items: center; gap: 10px; padding: 8px 10px 8px 14px; border-radius: 12px;
  background: #27272a; color: var(--fg); font-weight: 600; font-size: 12.5px; box-shadow: 0 0 0 1px rgba(255,255,255,.1), 0 12px 32px rgba(0,0,0,.35); opacity: 0; pointer-events: none;
  transition: opacity .16s, transform .16s; white-space: nowrap; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
.toast.act { pointer-events: auto; }
.toast:not(.act) { padding-right: 14px; }

@media (prefers-reduced-motion: reduce) { .ui *, .ui *::after { animation: none !important; transition: none !important; } }
`;
