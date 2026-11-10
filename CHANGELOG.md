# Changelog

All notable changes to PixelSpec are listed here. The site's changelog page (`site/changelog.html`) shows the same entries.

## 0.3.0 (2026-11-10)

New look.

### Changed

- New PixelSpec mark and an original outline icon set, all drawn on the same grid so they line up.
- Keyboard shortcuts show as keycaps. Glows removed from the toolbar and popover.
- The toolbar stays pinned to its corner and can no longer be dragged. Positions saved by older versions are ignored.

## 0.2.1 (2026-10-20)

Bug fixes.

### Fixed

- Feedback on an element that was later removed from the page keeps its marker, dashed and grey, where the element was. Click it to delete the feedback.
- The inspector popover now scrolls on sites that use smooth-scroll libraries such as Lenis.

## 0.2.0 (2026-10-20)

First public release, now on npm.

### Added

- Install with `npm i -D pixelspec`, or load it with a script tag from unpkg or jsDelivr.
- A toolbar you can collapse and drag, with tooltips and keyboard shortcuts.
- A spec popover that opens where you click, stays pinned while you scroll, and lets you step to parent and child elements.
- Numbered markers on annotated elements, quotes from selected text, and a button to pause animations.
- A single-line feedback box: type what should change and press Enter.
- Settings and notes are kept across reloads. Clearing or deleting notes can be undone.

### Changed

- Renamed from Inspecta to PixelSpec. Settings and notes saved under the old name still load.
- Cleaner specs: plain values you hover to copy, size as one W × H value, and contrast as a colored dot.
- Hovering empty page background no longer highlights the whole page.

## 0.1.0 (2026-10-19)

First prototype, under the name Inspecta.

### Added

- Box model overlay for padding, margin and flex or grid gaps.
- Redline distances between elements.
- Typography, color and WCAG contrast specs.
- Notes on elements, copied as a prompt for your AI agent. The compact format is the default; hold Shift for full specs.
