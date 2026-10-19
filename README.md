# PixelSpec

**Figma-style inspect and spacing overlay for any website, with AI-ready feedback.**

PixelSpec lets you measure spacing between elements right in the browser: padding, margin, gaps, distances, letter spacing, line height, colors and contrast, like Figma's inspect panel on top of the live page. Click any element to leave feedback, then copy it all as a compact prompt for your AI coding agent (an [agentation](https://agentation.com) alternative with built-in design inspection).

## How it works

1. **Open it.** Click the round button in the corner, or press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd>. A short tip bar explains the basics the first time.
2. **Hover** anything to see its name and size.
3. **Click** an element. A popover opens next to it with the key specs as chips: size, padding, margin, gap, layout, font, color, contrast, radius and shadow. Click any chip to copy its value. The chip labels use the same colors as the overlay, so green is padding, orange is margin and pink is gap.
4. **Hover another element** while one is selected to see red redline distances, like Figma. Hold <kbd>Alt</kbd> to measure to the parent.
5. **Type feedback** in the popover and press <kbd>Enter</kbd>. A numbered marker appears on the element. Hover a marker to read its note, or click it to edit or delete it.
6. **Select text** on the page to leave feedback that quotes it.
7. **Copy** with the copy button or <kbd>C</kbd>, and paste it into your agent.

"All properties" in the popover opens the full list: box model diagram, every flex and grid property, full typography, colors, appearance, accessibility and attributes.

## Toolbar

The toolbar can be dragged anywhere, and it remembers where you put it.

| Button | Key | What it does |
| --- | --- | --- |
| Spacing overlay | <kbd>S</kbd> | Box model and pink gap hatching on the selected element |
| Guides | <kbd>G</kbd> | Crosshair with coordinates and edge guides |
| Pause animations | <kbd>P</kbd> | Freezes CSS animations, transitions and videos |
| Hide markers | <kbd>H</kbd> | Shown once you have feedback |
| Copy feedback | <kbd>C</kbd> | Copies all feedback. The badge shows the count |
| Clear all | <kbd>X</kbd> | Clears all feedback, with Undo |
| Settings | | Copy detail, overlays, clear after copy |
| Close | <kbd>Esc</kbd> | Esc closes the popover first, then the toolbar |

In the popover, <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> walk to the parent, child and siblings while the feedback box is empty. <kbd>Shift</kbd>+<kbd>Enter</kbd> adds a new line.

Some details protect your work. Feedback you are typing is never thrown away by a stray click: the popover shakes instead. Deleting and clearing can be undone from the toast. Feedback survives page reloads and hot reloads.

While the toolbar is open, clicks on the page are blocked so links and buttons don't fire. Text selection still works.

## Copy for AI

By default, "Copy for AI" and Notes use a compact format to save tokens. It has two lines per element and only non-default values:

```
Make this button bigger
body>header>button.cta "Start free trial"
126×34 p:10 18 r:999 | system-ui 14/14 w600 ls:0.01em | c:#FFF bg:#3581F6 contrast:3.7(fails AA)
```

Key: `p` padding, `m` margin, `b` border, `r` radius, `14/14 w600` size/line-height weight, `ls` letter spacing, `c` text color, `bg` background. Contrast only appears when it fails AA. Containers skip text and typography.

Switch to Full in settings, hold <kbd>Shift</kbd> while copying, or set `aiDetail: 'full'` (`data-ai-detail="full"` on the script tag), for the full Markdown version. That one adds page position, layout details, shadows and the full contrast result. It is roughly 2.5 times longer.

## Usage

### Script tag (any site, no build step)

```html
<script src="node_modules/pixelspec/dist/pixelspec.global.js" data-active="false"></script>
```

Optional attributes: `data-active="true"`, `data-hotkey="alt+shift+i"`, `data-position="bottom-left"`.

### Any bundler

```ts
if (import.meta.env.DEV) {
  import('pixelspec').then(({ init }) => init({ hotkey: 'alt+shift+i' }));
}
```

### React / Next.js

```tsx
import { PixelSpec } from 'pixelspec/react';

export default function App() {
  return (
    <>
      <Main />
      {process.env.NODE_ENV === 'development' && <PixelSpec />}
    </>
  );
}
```

In the Next.js App Router, put it in a `'use client'` component.

### Options

```ts
init({
  hotkey: 'alt+shift+i',        // modifiers: alt, shift, ctrl, meta, mod (Ctrl or ⌘)
  startActive: false,
  showToolbar: true,
  position: 'bottom-right',     // or 'bottom-left'
  aiDetail: 'compact',          // starting value; users can change it in settings
  persist: true,                // remember settings, toolbar position and feedback
  onCopy: (text, kind) => {},   // kind: 'value' | 'css' | 'ai' | 'selector' | 'notes'
});
```

The instance also has `activate()`, `deactivate()`, `toggle()`, `select(el)`, `getNotes()`, `notesMarkdown()` and `destroy()`.

## Develop

```bash
npm install
npm run build     # dist/ (ESM, CJS, types, and the global script)
npm run demo      # http://localhost:5178/demo/
npm run dev       # rebuild on change
```

The overlay lives in a shadow root, so page styles never leak into it and it never leaks into the page.

Icons are from the free [Hugeicons](https://hugeicons.com) set (MIT). Only the icons in use are bundled.

## Known limits

- Contrast ignores background images and element opacity, and says so in the popover.
- Feedback is matched back to elements by selector after a reload, so it can land on the wrong element if the page structure changed.
- Rendered font detection is a heuristic based on loaded font faces and canvas measurement.
- Component source paths need a dev build. React 19 removed `_debugSource`, so React 19 shows names only.
- Elements inside closed shadow roots and cross-origin iframes can't be inspected.
