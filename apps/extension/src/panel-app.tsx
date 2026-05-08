import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
import {
  CANVAS_STAGE_STYLE,
  DETAILS_RESIZER_BAR_STYLE,
  DETAILS_RESIZER_STYLE,
  ROOT_STYLE,
  STAGE_STYLE,
} from './styles';

const INITIAL_RUNNING = true;
const INITIAL_FILTER_TEXT = '';
const INITIAL_FILTER_DOMAIN = '';
const INITIAL_LANES = 4;
const COMPACT_BREAKPOINT = 980;
const AUTO_COLLAPSE_BREAKPOINT = 760;
const DEFAULT_DETAILS_WIDTH = 320;
const MIN_DETAILS_WIDTH = 240;
const MAX_DETAILS_WIDTH = 560;
const FILTER_TEXT_STORAGE_KEY = 'rxjs-devtools:panel:filter-text';
const FILTER_DOMAIN_STORAGE_KEY = 'rxjs-devtools:panel:filter-domain';

type ResizeState = {
  startX: number;
  startWidth: number;
};

function readStoredFilterValue(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function persistFilterValue(key: string, value: string): void {
  try {
    if (!value) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

export function PanelApp() {
  const initialFilterText = useMemo(
    () => readStoredFilterValue(FILTER_TEXT_STORAGE_KEY, INITIAL_FILTER_TEXT),
    [],
  );
  const initialFilterDomain = useMemo(
    () => readStoredFilterValue(FILTER_DOMAIN_STORAGE_KEY, INITIAL_FILTER_DOMAIN),
    [],
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<PanelRuntimeFacade | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const autoCollapsedRef = useRef(false);
  const prevAutoCollapseRef = useRef(false);

  const [running, setRunning] = useState(INITIAL_RUNNING);
  const [filterText, setFilterText] = useState(initialFilterText);
  const [filterDomain, setFilterDomain] = useState(initialFilterDomain);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ domains: [] });
  const [panelWidth, setPanelWidth] = useState(() => window.innerWidth || 1);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(DEFAULT_DETAILS_WIDTH);
  const [statsText, setStatsText] = useState('0 events');
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
  });
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copy');
  const compact = panelWidth < COMPACT_BREAKPOINT;
  const autoCollapse = panelWidth < AUTO_COLLAPSE_BREAKPOINT;
  const compactPanelWidth = Math.max(
    MIN_DETAILS_WIDTH,
    Math.min(380, Math.round(Math.max(panelWidth - 12, MIN_DETAILS_WIDTH))),
  );
  const renderedPanelWidth = compact ? compactPanelWidth : detailsPanelWidth;

  useEffect(() => {
    const runtime = createPanelRuntime({
      canvasRef,
      stageRef,
      setStatsText,
      setTooltipState,
      setPinnedId,
      notifyRunningChange: (value) => setRunning(value),
      initialLanes: INITIAL_LANES,
      initialFilter: initialFilterText,
      initialDomainFilter: initialFilterDomain,
      initialRunning: INITIAL_RUNNING,
      setFilterOptions,
      maxAutoLanes: MAX_AUTO_LANES,
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [initialFilterDomain, initialFilterText]);

  useEffect(() => {
    runtimeRef.current?.setRunning(running);
  }, [running]);

  useEffect(() => {
    runtimeRef.current?.setFilterText(filterText);
  }, [filterText]);

  useEffect(() => {
    runtimeRef.current?.setFilterDomain(filterDomain);
  }, [filterDomain]);

  useEffect(() => {
    persistFilterValue(FILTER_TEXT_STORAGE_KEY, filterText);
  }, [filterText]);

  useEffect(() => {
    persistFilterValue(FILTER_DOMAIN_STORAGE_KEY, filterDomain);
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateWidth = () => {
      const width = root.clientWidth || 1;
      setPanelWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousAutoCollapse = prevAutoCollapseRef.current;

    if (autoCollapse && !previousAutoCollapse && detailsPanelOpen) {
      autoCollapsedRef.current = true;
      setDetailsPanelOpen(false);
    }

    if (!autoCollapse && previousAutoCollapse && autoCollapsedRef.current) {
      autoCollapsedRef.current = false;
      setDetailsPanelOpen(true);
    }

    prevAutoCollapseRef.current = autoCollapse;
  }, [autoCollapse, detailsPanelOpen]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;
      const maxWidth = Math.min(MAX_DETAILS_WIDTH, Math.max(MIN_DETAILS_WIDTH, panelWidth * 0.65));
      const deltaX = resizeState.startX - event.clientX;
      const nextWidth = Math.min(
        maxWidth,
        Math.max(MIN_DETAILS_WIDTH, resizeState.startWidth + deltaX),
      );
      setDetailsPanelWidth(Math.round(nextWidth));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [panelWidth]);

  const handleToggleRunning = () => setRunning((prev) => !prev);

  const handleToggleDetailsPanel = () => {
    setDetailsPanelOpen((prev) => !prev);
    autoCollapsedRef.current = false;
  };

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

  const handleClearFilters = () => {
    setFilterText('');
    setFilterDomain('');
  };

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: detailsPanelWidth,
    };
    document.body.style.cursor = 'col-resize';
  };

  const messageInfo = tooltipState.message ? extractMessageInfo(tooltipState.message) : null;

  return (
    <div ref={rootRef} style={ROOT_STYLE}>
      <Toolbar
        running={running}
        filterText={filterText}
        statsText={statsText}
        detailsPanelOpen={detailsPanelOpen}
        compact={compact}
        onToggleRunning={handleToggleRunning}
        onClear={handleClear}
        onFilterTextChange={setFilterText}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleDetailsPanel={handleToggleDetailsPanel}
      />
      <FilterBar
        domains={filterOptions.domains}
        activeDomain={filterDomain}
        activeText={filterText}
        compact={compact}
        onSelectDomain={handleSelectDomain}
        onClearFilters={handleClearFilters}
      />
      <div style={STAGE_STYLE}>
        <div ref={stageRef} style={CANVAS_STAGE_STYLE}>
          <canvas ref={canvasRef} />
        </div>
        {detailsPanelOpen ? (
          <>
            {!compact ? (
              <div style={DETAILS_RESIZER_STYLE} onMouseDown={handleResizeStart}>
                <div style={DETAILS_RESIZER_BAR_STYLE} />
              </div>
            ) : null}
            <TooltipPanel
              tooltipState={tooltipState}
              messageInfo={messageInfo}
              copyLabel={copyLabel}
              compact={compact}
              width={renderedPanelWidth}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onPin={handlePin}
              onClose={handleClose}
              pinnedId={pinnedId}
            />
          </>
        ) : null}
      </div>
      <Legend />
    </div>
  );
}
