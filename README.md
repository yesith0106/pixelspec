# Inspecta

A Figma-style inspect overlay for any web page. Hover to see the box model, click to pin, hover another element to see the redline distance between them. A side panel shows everything the browser knows about the element: spacing, typography, colors, contrast, layout, accessibility and framework component. Like [agentation](https://agentation.dev), you can pin elements, leave notes and copy them as Markdown for an AI coding agent.

## What it shows

**On the page**
- Box model: margin (orange), border (yellow), padding (green), content (blue), with values on the strips
- Distances between a pinned element and the hovered one (red redlines, Figma-style, handles nested, overlapping and diagonal elements)
- Hold <kbd>Alt</kbd> to measure an element against its parent
- Gaps between children, hatched in pink (flex gap, grid gap, margins, anything)
- Text line boxes for each rendered line
- Guides: crosshair with viewport and page coordinates, plus edge guides from the pinned element
- Tag name and size labels, numbered note markers

**In the panel** (click any value to copy it)
- Element: selector, React / Vue / Svelte component chain and source file, role, text
- Size & position: viewport and page position, min/max sizes, distance to parent edges and siblings
- Box model diagram, padding, margin, border, box-sizing
- Layout: display, position, inset, z-index, overflow, all flex and grid container and item properties, measured gaps
- Typography: rendered font (detected from the stack), size in px and rem, weight name, line height in px and ratio, letter spacing in px, em and %, word spacing, transform, decoration, features, smoothing, line clamp, rendered line count, live specimen
- Colors: text, background, gradients, borders, outline, SVG fill and stroke as hex, plus WCAG contrast against the real composited background with AA/AAA badges
- Appearance: radius, shadow, opacity, transform, filter, backdrop, blend, transitions, animations
- Accessibility: role, accessible name, focusability, aria attributes, alt text, small target warning
- All attributes
- Copy CSS, copy selector, copy for AI, and per-element notes

## Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> | Toggle the inspector (configurable) |
| Click | Pin element (click again to unpin) |
| <kbd>Alt</kbd> (hold) | Measure to parent |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Parent, first child, siblings |
| <kbd>S</kbd> / <kbd>T</kbd> / <kbd>G</kbd> | Spacing, text lines, guides |
| <kbd>C</kbd> | Copy element description for AI |
| <kbd>N</kbd> | Focus the note box |
| <kbd>Esc</kbd> | Unpin, then exit |

While the inspector is on, clicks on the page are swallowed so links and buttons don't fire.

## Usage

### Script tag (any site, no build step)

```html
<script src="node_modules/inspecta/dist/inspecta.global.js" data-active="false"></script>
```

Optional attributes: `data-active="true"`, `data-hotkey="alt+shift+i"`, `data-position="bottom-left"`.

### Any bundler

```ts
if (import.meta.env.DEV) {
  import('inspecta').then(({ init }) => init({ hotkey: 'alt+shift+i' }));
}
```

### React / Next.js

```tsx
import { Inspecta } from 'inspecta/react';

export default function App() {
  return (
    <>
      <Main />
      {process.env.NODE_ENV === 'development' && <Inspecta />}
    </>
  );
}
```

In the Next.js App Router, put it in a `'use client'` component.

### Options

```ts
init({
  hotkey: 'alt+shift+i',        // modifiers: alt, shift, ctrl, meta
  startActive: false,
  showToolbar: true,
  position: 'bottom-right',     // or 'bottom-left'
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

## Known limits

- Contrast ignores background images and element opacity, and says so in the panel.
- Rendered font detection is a heuristic based on loaded font faces and canvas measurement.
- Component source paths need a dev build. React 19 removed `_debugSource`, so React 19 shows names only.
- Elements inside closed shadow roots and cross-origin iframes can't be inspected.
