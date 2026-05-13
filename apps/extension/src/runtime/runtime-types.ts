import type { RxDevtoolsMessage, RxDevtoolsSource } from 'rxjs-devtools/protocol';
import type { FilterOptions, FilterTags, TooltipState } from '../types';
import type { RuntimeBackgroundPayload, RuntimeContentPayload } from '../transport-types';

export type RefObject<T> = { current: T | null };

export type RuntimeOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  stageRef: RefObject<HTMLDivElement>;
  setStatsText: (text: string) => void;
  setTooltipState: (state: TooltipState) => void;
  setPinnedId: (id: number | null) => void;
  notifyRunningChange: (running: boolean) => void;
  syncLaneCount?: (lanes: number) => void;
  initialLanes: number;
  initialFilter: string;
  initialDomainFilter: string;
  initialRunning: boolean;
  setFilterOptions?: (options: FilterOptions) => void;
  maxAutoLanes?: number;
};

export type DomainInfo = {
  actions: Map<string, number>;
  baseOffset: number;
  metadata: Map<string, { tags: string[]; label: string }>;
};

export type NormalizedContentEvent = {
  type: string;
  kind: string;
  rxKind: string;
  label: string;
  domain: string;
  observableId: string;
  instanceId: string;
  subscriptionId: string;
  time: number;
  ts: number;
  data?: unknown;
  meta?: Record<string, unknown>;
  source?: RxDevtoolsSource;
  laneKey: string;
  tabId?: number;
  color?: string | number;
  timestamp?: number;
  date?: string;
  t?: number;
  raw: {
    background: RuntimeBackgroundPayload;
    content: RuntimeContentPayload | null;
    devtools: RxDevtoolsMessage;
  };
};

export type RuntimeSystemEvent = {
  type: string;
  text?: string;
  laneKey?: string;
  label?: string;
  color?: string | number;
  kind?: string;
  rxKind?: string;
  observableId?: string;
  instanceId?: string;
  subscriptionId?: string;
  domain?: string;
  source?: Partial<RxDevtoolsSource>;
  data?: unknown;
  meta?: Record<string, unknown>;
  tabId?: number;
  time?: number;
  ts?: number;
  timestamp?: number;
  date?: string;
  t?: number;
  [key: string]: unknown;
};

export type RuntimeMarbleMessage = NormalizedContentEvent | RuntimeSystemEvent;

export type Marble = {
  id: number;
  timeMs: number;
  r: number;
  color: string;
  msg: RuntimeMarbleMessage;
  laneKey: string;
  lane: number;
  filters: FilterTags;
};

export type GroupBoundary = {
  key: string;
  start: number;
  end: number;
  size: number;
};

export type MouseState = {
  x: number;
  y: number;
  down: boolean;
};

export type DragState = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
} | null;
