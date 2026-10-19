# Contributing to PixelSpec

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Run it locally

```bash
git clone https://github.com/yesith0106/pixelspec.git
cd pixelspec
npm install        # also builds dist/
npm run demo       # http://localhost:5178/demo/
```

In a second terminal, run `npm run dev` to rebuild on every change, then refresh the demo page.

## Project layout

| Path | What lives there |
| --- | --- |
| `src/core.ts` | The controller: events, toolbar, popover, feedback, settings |
| `src/overlay.ts` | Everything drawn on the page: box model, redlines, gaps, guides |
| `src/panel.ts` | The spec card and the "All properties" list |
| `src/inspect.ts` | Reading the element: selectors, components, accessibility, AI and CSS export |
| `src/styles.ts` | All UI styles (the overlay lives in a shadow root) |
| `src/icons.ts` | Hugeicons used in the UI, bundled at build time |
| `src/react.ts` | The `<PixelSpec />` React component |
| `src/auto.ts` | The drop-in `<script>` build |
| `demo/` | A test page for trying changes |

## Before opening a pull request

```bash
npm run typecheck
npm run build
```

Both run automatically on every pull request. For UI changes, add a before and after screenshot to the pull request.

## Reporting a bug

Open an issue with the page or framework you were on, your browser, what you expected and what happened. A screenshot helps a lot.
