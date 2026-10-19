const GENERIC = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif',
  'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'blinkmacsystemfont',
]);

export function splitFamilies(stack: string): string[] {
  return stack
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

let mctx: CanvasRenderingContext2D | null | undefined;
const availCache = new Map<string, boolean>();

function loadedFace(family: string): boolean {
  const want = family.toLowerCase();
  let found = false;
  try {
    document.fonts.forEach((f) => {
      if (!found && f.status === 'loaded' && f.family.replace(/^["']|["']$/g, '').toLowerCase() === want) found = true;
    });
  } catch {
    /* FontFaceSet unsupported */
  }
  return found;
}

function installed(family: string): boolean {
  const key = family.toLowerCase();
  const hit = availCache.get(key);
  if (hit !== undefined) return hit;
  if (mctx === undefined) mctx = document.createElement('canvas').getContext('2d');
  let ok = false;
  if (mctx) {
    const sample = 'mmmmmmmmmmlli10WQ@#&';
    for (const base of ['monospace', 'serif', 'sans-serif']) {
      mctx.font = `72px ${base}`;
      const w0 = mctx.measureText(sample).width;
      mctx.font = `72px "${family.replace(/"/g, '')}", ${base}`;
      if (mctx.measureText(sample).width !== w0) {
        ok = true;
        break;
      }
    }
  }
  availCache.set(key, ok);
  return ok;
}

/** Best guess at which family in the stack the browser is actually rendering. */
export function renderedFont(stack: string): string {
  const fams = splitFamilies(stack);
  for (const fam of fams) {
    if (GENERIC.has(fam.toLowerCase())) return fam;
    if (loadedFace(fam) || installed(fam)) return fam;
  }
  return fams[fams.length - 1] ?? stack;
}

const WEIGHTS: Record<number, string> = {
  100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium',
  600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

export function weightName(w: string): string {
  const n = Math.round(parseFloat(w) / 100) * 100;
  return WEIGHTS[n] ?? '';
}
