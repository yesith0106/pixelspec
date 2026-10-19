import { useEffect } from 'react';
import { destroy, init, type PixelSpecOptions } from './index';

export interface PixelSpecProps extends PixelSpecOptions {
  /** Set to false to unmount the overlay entirely (e.g. in production). Default true. */
  enabled?: boolean;
}

/**
 * Renders nothing; mounts the PixelSpec overlay while it is in the tree.
 *
 *   {process.env.NODE_ENV === 'development' && <PixelSpec />}
 */
export function PixelSpec({ enabled = true, ...options }: PixelSpecProps): null {
  useEffect(() => {
    if (!enabled) return;
    init(options);
    return () => destroy();
    // Options are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return null;
}

export default PixelSpec;
