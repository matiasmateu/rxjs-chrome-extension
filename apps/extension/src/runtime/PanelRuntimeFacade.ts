import { MAX_AUTO_LANES, MarblePanelRuntime } from './MarblePanelRuntime';
import type { RuntimeOptions } from './runtime-types';

export type PanelRuntimeFacade = {
  dispose: () => void;
  setRunning: (flag: boolean) => void;
  setFilterText: (value: string) => void;
  setFilterDomain: (value: string) => void;
  clear: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  togglePin: () => void;
  closeTooltip: () => void;
};

export function createPanelRuntime(options: RuntimeOptions): PanelRuntimeFacade {
  const runtime = new MarblePanelRuntime(options);

  return {
    dispose: () => runtime.dispose(),
    setRunning: (flag) => runtime.setRunningFromReact(flag),
    setFilterText: (value) => runtime.setFilterText(value),
    setFilterDomain: (value) => runtime.setFilterDomain(value),
    clear: () => runtime.clear(),
    zoomIn: () => runtime.zoomIn(),
    zoomOut: () => runtime.zoomOut(),
    togglePin: () => runtime.togglePinFromPanel(),
    closeTooltip: () => runtime.closeTooltipFromPanel(),
  };
}

export { MAX_AUTO_LANES };
