import type { FilterOptions, FilterTags, TooltipState } from '../types';

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

export type Marble = {
  id: number;
  timeMs: number;
  r: number;
  color: string;
  msg: any;
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
