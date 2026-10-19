import { useEffect } from 'react';
import { destroy, init, type InspectaOptions } from './index';

export interface InspectaProps extends InspectaOptions {
  /** Set to false to unmount the overlay entirely (e.g. in production). Default true. */
  enabled?: boolean;
}

/**
 * Renders nothing; mounts the Inspecta overlay while it is in the tree.
 *
 *   {process.env.NODE_ENV === 'development' && <Inspecta />}
 */
export function Inspecta({ enabled = true, ...options }: InspectaProps): null {
  useEffect(() => {
    if (!enabled) return;
    init(options);
    return () => destroy();
    // Options are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return null;
}

export default Inspecta;
