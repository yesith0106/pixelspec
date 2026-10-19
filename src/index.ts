import { PixelSpec, type PixelSpecOptions } from './core';

export { PixelSpec };
export type { CopyKind, PixelSpecNote, PixelSpecOptions } from './core';
export { cssFor, cssSelector, describe, describeCompact, describeForAI, type AIDetail } from './inspect';

let instance: PixelSpec | null = null;

/**
 * Mount the overlay (once). Safe to call multiple times; returns the same instance.
 * Does nothing during SSR.
 */
export function init(options: PixelSpecOptions = {}): PixelSpec | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!instance) instance = new PixelSpec(options);
  return instance;
}

export function getInstance(): PixelSpec | null {
  return instance;
}

export function destroy(): void {
  instance?.destroy();
  instance = null;
}
