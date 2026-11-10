// PixelSpec icons (18-unit grid, 1.5 outline) and the mark, both from the brand (src/brand.gen.ts,
// generated from scripts/icons.mjs and site/assets/brand.js).
import { ICONS, MARK, type IconName } from './brand.gen';

/** Render a brand icon as an inline SVG string. Strokes and accents use currentColor. */
function icon(name: IconName, size = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" fill="none" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** The PixelSpec mark: one solid shape in the brand blue (.mark in styles.ts). */
export function mark(size: number): string {
  return `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 ${MARK.size} ${MARK.size}" aria-hidden="true"><path d="${MARK.d}"/></svg>`;
}

export const I = {
  logo: mark(24),
  markSm: mark(16),
  spacing: icon('spacing'),
  guides: icon('guides'),
  pause: icon('pause'),
  play: icon('play'),
  eye: icon('eye'),
  eyeOff: icon('eye-off'),
  copy: icon('copy'),
  check: icon('check'),
  trash: icon('trash'),
  settings: icon('settings'),
  x: icon('close'),
  up: icon('arrow-up', 16),
  send: icon('arrow-up', 16),
  down: icon('arrow-down', 16),
  close: icon('close', 16),
  chevron: icon('chevron-right', 14),
  codeMd: icon('code', 16),
  trashSm: icon('trash', 14),
  ruler: icon('ruler', 14),
  component: icon('component', 12),
  padding: icon('padding', 14),
  margin: icon('margin', 14),
  gapH: icon('gap-h', 14),
  gapV: icon('gap-v', 14),
};
