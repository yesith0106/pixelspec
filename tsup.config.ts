import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', react: 'src/react.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external: ['react'],
  },
  {
    // Drop-in <script> build that auto-initialises. Exposes window.PixelSpec.
    entry: { pixelspec: 'src/auto.ts' },
    format: ['iife'],
    globalName: 'PixelSpec',
    minify: true,
    target: 'es2020',
  },
]);
