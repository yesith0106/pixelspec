// Icons from Hugeicons (https://hugeicons.com), free set, MIT licensed.
import {
  AlignHorizontalSpaceAroundIcon, AlignHorizontalSpaceBetweenIcon, AlignVerticalSpaceBetweenIcon, FullScreenIcon,
  ArrowDown02Icon, ArrowRight01Icon, ArrowUp02Icon, Cancel01Icon, CenterFocusIcon, Copy01Icon, CrosshairIcon, Delete02Icon,
  PauseIcon, RulerIcon, PlayIcon, RulerDimensionLineIcon, SlidersHorizontalIcon, SourceCodeIcon, Tick02Icon,
  ViewIcon, ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';

type IconData = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Render Hugeicons shape data as an inline SVG string. */
function svg(icon: IconData, size = 18): string {
  const body = icon
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${kebab(k)}="${String(v)}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
}

const h = (icon: unknown, size?: number) => svg(icon as IconData, size);

export const I = {
  logo: h(CenterFocusIcon, 22),
  spacing: h(RulerDimensionLineIcon),
  guides: h(CrosshairIcon),
  pause: h(PauseIcon),
  play: h(PlayIcon),
  eye: h(ViewIcon),
  eyeOff: h(ViewOffSlashIcon),
  copy: h(Copy01Icon),
  check: h(Tick02Icon),
  trash: h(Delete02Icon),
  settings: h(SlidersHorizontalIcon),
  x: h(Cancel01Icon),
  up: h(ArrowUp02Icon, 16),
  send: h(ArrowUp02Icon, 16),
  down: h(ArrowDown02Icon, 16),
  close: h(Cancel01Icon, 16),
  chevron: h(ArrowRight01Icon, 14),
  codeMd: h(SourceCodeIcon, 16),
  trashSm: h(Delete02Icon, 14),
  ruler: h(RulerIcon, 14),
  padding: h(AlignHorizontalSpaceAroundIcon, 14),
  margin: h(FullScreenIcon, 14),
  gapH: h(AlignHorizontalSpaceBetweenIcon, 14),
  gapV: h(AlignVerticalSpaceBetweenIcon, 14),
};
