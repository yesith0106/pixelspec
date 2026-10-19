// Drop-in build: <script src="inspecta.global.js" data-active="true" data-hotkey="alt+shift+i"></script>
import { init } from './index';

export * from './index';

const script = document.currentScript as HTMLScriptElement | null;
const start = () =>
  init({
    startActive: script?.dataset.active === 'true',
    aiDetail: script?.dataset.aiDetail === 'full' ? 'full' : undefined,
    hotkey: script?.dataset.hotkey || undefined,
    position: script?.dataset.position === 'bottom-left' ? 'bottom-left' : undefined,
  });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
