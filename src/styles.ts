export const STYLES = /* css */ `
:host { all: initial; }
* { box-sizing: border-box; }
.ui { font: 500 12px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #e8e8e8; -webkit-font-smoothing: antialiased; }

/* ---------- overlay layer ---------- */
.layer { position: fixed; inset: 0; pointer-events: none; overflow: hidden; font: 600 10.5px/1.2 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-variant-numeric: tabular-nums; }
.layer > div { position: absolute; }
.bx-m { background: rgba(246, 178, 107, .32); }
.bx-b { background: rgba(255, 229, 153, .5); }
.bx-p { background: rgba(147, 196, 125, .38); }
.bx-c { background: rgba(111, 168, 220, .28); }
.ol { box-sizing: border-box; }
.ol-sel { border: 1.5px solid #0d99ff; }
.ol-hov { border: 1px solid #0d99ff; }
.ol-par { border: 1px dashed #f24822; }
.sv { transform: translate(-50%, -50%); font-size: 9.5px; font-weight: 700; pointer-events: none; }
.sv-p { color: #2c6e1a; }
.sv-m { color: #9a5212; }
.pill { transform: translate(-50%, -50%); padding: 2px 5px; border-radius: 4px; color: #fff; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.pill-l { transform: translate(0, -50%); }
.tag-sel, .dim-sel { background: #0d99ff; }
.tag-hov, .dim-hov { background: #3d4a5c; }
.dl { background: #f24822; }
.dcap { background: #f24822; }
.dp { background: #f24822; }
.dd-h { background: repeating-linear-gradient(90deg, #f24822 0 3px, transparent 3px 6px); }
.dd-v { background: repeating-linear-gradient(180deg, #f24822 0 3px, transparent 3px 6px); }
.gap { background: repeating-linear-gradient(-45deg, rgba(232, 62, 140, .42) 0 1.5px, rgba(232, 62, 140, .1) 1.5px 6px); box-shadow: inset 0 0 0 1px rgba(232, 62, 140, .7); }
.gp { background: #e83e8c; font-size: 9.5px; padding: 1px 4px; }
.tl { box-shadow: inset 0 0 0 1px rgba(124, 58, 237, .85); background: rgba(124, 58, 237, .07); }
.gd-v, .gd-h { background: rgba(13, 153, 255, .55); }
.ch { background: rgba(242, 72, 34, .55); }
.coord { background: #1e1e1e; }
.mk { width: 18px; height: 18px; border-radius: 9px; background: #7c3aed; color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,.3); }

/* ---------- panel ---------- */
.panel { position: fixed; top: 12px; right: 12px; width: 340px; max-height: calc(100vh - 84px); overflow: auto; pointer-events: auto;
  background: #1e1e1e; border: 1px solid #383838; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.35); scrollbar-width: thin; scrollbar-color: #444 transparent; }
.panel[hidden] { display: none; }
.ph { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 10px 10px 6px 12px; background: #1e1e1e; cursor: move; user-select: none; }
.ttl { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 2px; overflow: hidden; white-space: nowrap; font: 600 12.5px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.tg { color: #7cc4ff; }
.id { color: #ffc069; }
.cl { color: #b4b4b4; overflow: hidden; text-overflow: ellipsis; }
.acts { display: flex; gap: 4px; }
button { all: unset; cursor: pointer; padding: 3px 8px; border-radius: 6px; background: #2c2c2c; color: #e8e8e8; font: 500 11.5px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; border: 1px solid #3a3a3a; white-space: nowrap; }
button:hover { background: #383838; }
button.pri { background: #0d99ff; border-color: #0d99ff; color: #fff; }
button.pri:hover { background: #0b86e0; }
button.on { background: #0d99ff22; border-color: #0d99ff; color: #7cc4ff; }
.sub { display: flex; gap: 8px; align-items: center; padding: 0 12px 8px; color: #9a9a9a; font-size: 11.5px; }
.mode { padding: 1px 6px; border-radius: 4px; background: #333; color: #bbb; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
.mode.pin { background: #0d99ff; color: #fff; }
.dims { font-variant-numeric: tabular-nums; color: #ddd; }
.comp { color: #c792ea; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.qa { display: flex; gap: 6px; padding: 0 12px 10px; border-bottom: 1px solid #2e2e2e; }
details { border-bottom: 1px solid #2e2e2e; }
summary { list-style: none; cursor: pointer; padding: 8px 12px; font-weight: 600; color: #f0f0f0; display: flex; align-items: center; gap: 6px; user-select: none; }
summary::-webkit-details-marker { display: none; }
summary::before { content: ''; width: 0; height: 0; border-left: 4px solid #888; border-top: 4px solid transparent; border-bottom: 4px solid transparent; transition: transform .12s; }
details[open] > summary::before { transform: rotate(90deg); }
.badge { margin-left: auto; font-weight: 500; color: #9a9a9a; font-size: 11px; }
.sb { padding: 0 12px 10px; }
.row { display: grid; grid-template-columns: 104px 1fr; gap: 8px; padding: 2px 0; align-items: start; }
.k { color: #9a9a9a; }
.v { font: 11.5px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #ececec; word-break: break-word; cursor: copy; border-radius: 3px; padding: 0 3px; margin: 0 -3px; }
.v:hover { background: #2c2c2c; }
.v.mu { color: #8a8a8a; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
  background: repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 6px 6px; }
.sw > i { display: block; width: 100%; height: 100%; background-size: cover; }
.wc { display: inline-block; font: 600 10px/1.5 ui-sans-serif, system-ui, sans-serif; padding: 0 5px; border-radius: 4px; margin-left: 4px; }
.wc.ok { background: #14532d; color: #86efac; }
.wc.no { background: #5f1d1d; color: #fca5a5; }
.spec { font-size: 28px; line-height: 1.2; color: #fff; padding: 4px 0 8px; display: flex; align-items: baseline; gap: 10px; overflow: hidden; white-space: nowrap; }
.spec span { font-size: 13px; color: #aaa; overflow: hidden; text-overflow: ellipsis; }

/* box-model diagram */
.bm { position: relative; display: grid; grid-template-columns: 30px 1fr 30px; grid-template-rows: 18px auto 18px;
  grid-template-areas: ". t ." "l in r" ". b ."; text-align: center; align-items: center; border-radius: 4px; padding: 2px;
  font: 10.5px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1b1b1b; margin-bottom: 8px; }
.bm .bm { margin: 0; }
.bm > .t { grid-area: t; } .bm > .b { grid-area: b; } .bm > .l { grid-area: l; } .bm > .r { grid-area: r; } .bm > .in { grid-area: in; }
.bl { position: absolute; left: 5px; top: 4px; font: 600 9px/1 ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em; opacity: .65; }
.bm-m { background: #f6c38f; border: 1px dashed #a96a2c; }
.bm-b { background: #fde8a8; border: 1px solid #1b1b1b; }
.bm-p { background: #b9d9a8; border: 1px dashed #4b7a37; }
.bm-c { background: #a5c8ec; border: 1px solid #4b7fb5; padding: 8px 4px; border-radius: 2px; }

.note { padding: 10px 12px 12px; }
textarea { all: unset; display: block; width: 100%; min-height: 48px; background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; padding: 7px 8px; color: #eee; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; white-space: pre-wrap; box-sizing: border-box; }
textarea:focus { border-color: #0d99ff; }
.nr { display: flex; gap: 6px; margin-top: 6px; }
.empty { padding: 4px 14px 14px; color: #bbb; }
.empty p { margin: 0 0 10px; }
.empty ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 5px; }
kbd { display: inline-block; min-width: 18px; text-align: center; padding: 0 4px; margin-right: 2px; border-radius: 4px; background: #333; border: 1px solid #444; font: 600 10.5px/1.5 ui-monospace, monospace; color: #eee; }

/* ---------- toolbar ---------- */
.tb { position: fixed; bottom: 16px; right: 16px; display: flex; align-items: center; gap: 6px; padding: 5px; pointer-events: auto;
  background: #1e1e1e; border: 1px solid #383838; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.3); }
.tb.left { right: auto; left: 16px; }
.tb .main { width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.tb .main.on { background: #0d99ff; border-color: #0d99ff; color: #fff; }
.tb .sep { width: 1px; height: 18px; background: #3a3a3a; }
.tb .count { min-width: 16px; display: inline-block; text-align: center; background: #7c3aed; color: #fff; border-radius: 8px; padding: 0 4px; margin-left: 4px; font-size: 10.5px; }
.help { position: fixed; bottom: 64px; right: 16px; width: 280px; padding: 12px 14px; pointer-events: auto; background: #1e1e1e; border: 1px solid #383838; border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.3); }
.help h4 { margin: 0 0 8px; font-size: 12px; color: #fff; }
.help ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 5px; color: #bbb; }
.toast { position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%); background: #0d99ff; color: #fff; padding: 6px 12px; border-radius: 8px; font-weight: 600; pointer-events: none; opacity: 0; transition: opacity .15s; }
.toast.show { opacity: 1; }
`;
