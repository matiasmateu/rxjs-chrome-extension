import { useEffect, useRef, useState } from 'react';
import {
  FilterBar,
  Legend,
  Toolbar,
  TooltipPanel,
  extractMessageInfo,
} from '@rxjs-devtools/panel-ui';
import {
  createPanelRuntime,
  MAX_AUTO_LANES,
  type PanelRuntimeFacade,
} from './runtime/PanelRuntimeFacade';
import type { FilterOptions, TooltipState } from './types';
import { ROOT_STYLE, STAGE_STYLE, CANVAS_STAGE_STYLE } from './styles';

const INITIAL_RUNNING = true;
const INITIAL_FILTER_TEXT = '';
const INITIAL_FILTER_DOMAIN = '';
const INITIAL_LANES = 4;

export function PanelApp() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<PanelRuntimeFacade | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const [running, setRunning] = useState(INITIAL_RUNNING);
  const [filterText, setFilterText] = useState(INITIAL_FILTER_TEXT);
  const [filterDomain, setFilterDomain] = useState(INITIAL_FILTER_DOMAIN);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ domains: [] });
  const [statsText, setStatsText] = useState('0 events');
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
  });
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copy');

  useEffect(() => {
    const runtime = createPanelRuntime({
      canvasRef,
      stageRef,
      setStatsText,
      setTooltipState,
      setPinnedId,
      notifyRunningChange: (value) => setRunning(value),
      initialLanes: INITIAL_LANES,
      initialFilter: INITIAL_FILTER_TEXT,
      initialDomainFilter: INITIAL_FILTER_DOMAIN,
      initialRunning: INITIAL_RUNNING,
      setFilterOptions,
      maxAutoLanes: MAX_AUTO_LANES,
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    runtimeRef.current?.setRunning(running);
  }, [running]);

  useEffect(() => {
    runtimeRef.current?.setFilterText(filterText);
  }, [filterText]);

  useEffect(() => {
    runtimeRef.current?.setFilterDomain(filterDomain);
  }, [filterDomain]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    },
    [],
  );

  const handleToggleRunning = () => setRunning((prev) => !prev);

  const handleClear = () => {
    runtimeRef.current?.clear();
    setFilterDomain('');
  };

  const handleZoomIn = () => {
    runtimeRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    runtimeRef.current?.zoomOut();
  };

  const handleCopy = async () => {
    if (!tooltipState.message) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(tooltipState.message, null, 2));
      setCopyLabel('Copied!');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopyLabel('Copy');
        copyTimerRef.current = null;
      }, 900);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!tooltipState.message) return;
    const blob = new Blob([JSON.stringify(tooltipState.message, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marble.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handlePin = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.togglePin();
  };

  const handleClose = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.closeTooltip();
  };

  const handleSelectDomain = (value: string) => {
    setFilterDomain((prev) => (prev === value ? '' : value));
  };

  const messageInfo = tooltipState.message ? extractMessageInfo(tooltipState.message) : null;

  return (
    <div style={ROOT_STYLE}>
      <Toolbar
        running={running}
        filterText={filterText}
        statsText={statsText}
        onToggleRunning={handleToggleRunning}
        onClear={handleClear}
        onFilterTextChange={setFilterText}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      <FilterBar
        domains={filterOptions.domains}
        activeDomain={filterDomain}
        onSelectDomain={handleSelectDomain}
      />
      <div style={STAGE_STYLE}>
        <div ref={stageRef} style={CANVAS_STAGE_STYLE}>
          <canvas ref={canvasRef} />
        </div>
        <TooltipPanel
          tooltipState={tooltipState}
          messageInfo={messageInfo}
          copyLabel={copyLabel}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onPin={handlePin}
          onClose={handleClose}
          pinnedId={pinnedId}
        />
      </div>
      <Legend />
    </div>
  );
}
