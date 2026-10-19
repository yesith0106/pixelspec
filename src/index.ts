import { Inspecta, type InspectaOptions } from './core';

export { Inspecta };
export type { CopyKind, InspectaNote, InspectaOptions } from './core';
export { cssFor, cssSelector, describe, describeCompact, describeForAI, type AIDetail } from './inspect';

let instance: Inspecta | null = null;

/**
 * Mount the overlay (once). Safe to call multiple times; returns the same instance.
 * Does nothing during SSR.
 */
export function init(options: InspectaOptions = {}): Inspecta | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!instance) instance = new Inspecta(options);
  return instance;
}

export function getInstance(): Inspecta | null {
  return instance;
}

export function destroy(): void {
  instance?.destroy();
  instance = null;
}
