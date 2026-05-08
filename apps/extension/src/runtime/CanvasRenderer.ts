import { fmtTime } from './RuntimeTime';
import { drawRxKindGlyph } from './RxKind';
import { truncate } from './StringUtils';
import {
  DISABLED_LANE_STROKE,
  DISABLED_MARBLE_COLOR,
  HOVER_GLOW_COLOR,
  HOVER_RING_COLOR,
  NOW_MARKER_OFFSET,
  PX_PER_SEC,
  SELECTED_GLOW_COLOR,
  SELECTED_RING_COLOR,
} from './constants';
import type { FilterRegistry } from './FilterRegistry';
import type { LaneActivity } from './LaneActivity';
import type { LaneLayout } from './LaneLayout';
import type { DragState, Marble, MouseState } from './runtime-types';
import { laneYForIndex, xForTime } from './ViewportMath';

type CanvasRenderBaseState = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeOriginMs: number;
  xZoom: number;
  worldOffsetPx: number;
  worldOffsetPy: number;
  filters: FilterRegistry;
  laneLayout: LaneLayout;
  laneActivity: LaneActivity;
  marbles: Marble[];
  laneSamplesByKey: Map<string, Marble>;
  filteredLaneMap: Map<number, number>;
};

type DrawMarblesState = CanvasRenderBaseState & {
  mouse: MouseState;
  dragStart: DragState;
  pinnedId: number | null;
};

type DrawMarblesResult = {
  hoverId: number | null;
  worldOffsetPx: number;
  worldOffsetPy: number;
};

type GroupLaneEntry = {
  absoluteLane: number;
  key: string;
  label: string;
  isDisabled: boolean;
};

const TICK_INTERVALS_MS = [1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000];
const MIN_TICK_LABEL_SPACING_PX = 96;

function pickTickIntervalMs(xZoom: number): number {
  const pixelsPerSecond = PX_PER_SEC * xZoom;
  for (const interval of TICK_INTERVALS_MS) {
    const spacing = (interval / 1000) * pixelsPerSecond;
    if (spacing >= MIN_TICK_LABEL_SPACING_PX) {
      return interval;
    }
  }
  return TICK_INTERVALS_MS[TICK_INTERVALS_MS.length - 1];
}

function laneHasMatchingSample(state: CanvasRenderBaseState, laneKey: string): boolean {
  const sampleMarble = state.laneSamplesByKey.get(laneKey);
  if (!sampleMarble) return false;
  return state.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters);
}

function disambiguateGroupLaneLabels(entries: GroupLaneEntry[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const base = entry.label || entry.key || 'Unknown lane';
    counts.set(base, (counts.get(base) || 0) + 1);
  }

  const seen = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const entry of entries) {
    const base = entry.label || entry.key || 'Unknown lane';
    const total = counts.get(base) || 1;
    if (total > 1) {
      const index = (seen.get(base) || 0) + 1;
      seen.set(base, index);
      labels.set(`${entry.absoluteLane}:${entry.key}`, `${base} · ${index}`);
      continue;
    }
    labels.set(`${entry.absoluteLane}:${entry.key}`, base);
  }

  return labels;
}

export function drawGrid(state: CanvasRenderBaseState) {
  const { ctx } = state;
  const laneMetrics = state.laneLayout.laneMetrics(state.height);

  ctx.lineCap = 'butt';
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, '#1e1e1e');
  gradient.addColorStop(1, '#252526');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  if (state.laneLayout.groupBoundaries.length) {
    const colors = ['rgba(30, 58, 138, 0.08)', 'rgba(17, 24, 39, 0.08)'];
    for (let i = 0; i < state.laneLayout.groupBoundaries.length; i++) {
      const group = state.laneLayout.groupBoundaries[i];
      const startY = laneYForIndex(state, group.start);
      const endY = laneYForIndex(state, Math.max(group.start, group.end - 1));
      const height = endY - startY + laneMetrics.step;

      ctx.fillStyle = colors[i % 2];
      ctx.fillRect(0, startY - laneMetrics.step / 2, state.width, height);
    }
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.fillStyle = '#d1deee';
  ctx.font = '11px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';

  const rightMs = state.timeOriginMs;
  const tickIntervalMs = pickTickIntervalMs(state.xZoom);
  const rightTickMs = Math.floor(rightMs / tickIntervalMs) * tickIntervalMs;
  const nowLabel = `now ${fmtTime(rightMs)}`;
  const nowLabelWidth = Math.ceil(ctx.measureText(nowLabel).width);
  const nowLabelRight = state.width - (NOW_MARKER_OFFSET + 6);
  const nowLabelLeft = nowLabelRight - (nowLabelWidth + 14);

  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let t = rightTickMs; ; t -= tickIntervalMs) {
    const x = xForTime(state, t);
    if (x < -50) break;
    if (x <= state.width + 50) {
      ctx.moveTo(x, 20);
      ctx.lineTo(x, state.height);
      if (x < nowLabelLeft) {
        ctx.fillText(fmtTime(t), x, 12);
      }
    }
  }
  ctx.stroke();

  const labelWidth = 200;

  if (state.laneLayout.groupBoundaries.length) {
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 0.5;
    ctx.font = '11px ui-sans-serif, system-ui';
    ctx.textAlign = 'left';

    state.filteredLaneMap.clear();
    let filteredLaneIndex = 0;

    if (state.filters.filterDomain) {
      for (let lane = 0; lane < state.laneLayout.lanes; lane++) {
        const laneKeys = state.laneLayout.laneIndexMap[lane];
        if (!laneKeys || laneKeys.size === 0) continue;

        let hasMatch = false;
        for (const key of laneKeys) {
          if (laneHasMatchingSample(state, key)) {
            hasMatch = true;
            break;
          }
        }

        if (hasMatch) {
          state.filteredLaneMap.set(lane, filteredLaneIndex);
          filteredLaneIndex++;
        }
      }
    }

    const displayLaneFor = (absoluteLane: number) =>
      state.filters.filterDomain && state.filteredLaneMap.has(absoluteLane)
        ? state.filteredLaneMap.get(absoluteLane)!
        : absoluteLane;

    for (const group of state.laneLayout.groupBoundaries) {
      const groupEntries: GroupLaneEntry[] = [];

      for (const domain of state.laneLayout.domainOrder) {
        const info = state.laneLayout.domainMap.get(domain);
        if (!info) continue;

        for (const [key, absoluteLane] of info.actions.entries()) {
          if (absoluteLane < group.start || absoluteLane >= group.end) continue;
          const metadata = info.metadata.get(key);
          const label = metadata?.label || key.split('/').pop() || key;
          const isDisabled = state.laneActivity.isLaneDisabledForIndex(
            absoluteLane,
            state.laneLayout.laneIndexMap,
          );
          groupEntries.push({
            absoluteLane,
            key,
            label,
            isDisabled,
          });
        }
      }

      if (!groupEntries.length) continue;

      groupEntries.sort((a, b) => a.absoluteLane - b.absoluteLane);
      const visibleEntries = state.filters.filterDomain
        ? groupEntries.filter((entry) => laneHasMatchingSample(state, entry.key))
        : groupEntries;

      if (!visibleEntries.length) continue;

      const firstDisplayLane = displayLaneFor(visibleEntries[0].absoluteLane);
      const lastDisplayLane = displayLaneFor(
        visibleEntries[visibleEntries.length - 1].absoluteLane,
      );
      const groupStartY = laneYForIndex(state, firstDisplayLane) - laneMetrics.step / 2;
      const groupEndY = laneYForIndex(state, lastDisplayLane) + laneMetrics.step / 2;
      const inactiveCount = visibleEntries.reduce(
        (count, entry) => count + (entry.isDisabled ? 1 : 0),
        0,
      );
      const groupTitle = state.laneLayout.groupLabels.get(group.key) || group.key || 'Group';
      const groupSummary = `${truncate(groupTitle, 20)} · ${visibleEntries.length} lane${
        visibleEntries.length === 1 ? '' : 's'
      }${
        inactiveCount === visibleEntries.length && visibleEntries.length > 1 ? ' · inactive' : ''
      }`;

      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.52)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(labelWidth, groupStartY);
      ctx.lineTo(state.width, groupStartY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.42)';
      ctx.beginPath();
      ctx.moveTo(labelWidth, groupEndY);
      ctx.lineTo(state.width, groupEndY);
      ctx.stroke();

      const headerHeight = 14;
      const headerY = Math.max(20, Math.floor(groupStartY - headerHeight - 2));
      ctx.fillStyle = 'rgba(15, 23, 36, 0.92)';
      ctx.fillRect(6, headerY, labelWidth - 12, headerHeight);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
      ctx.strokeRect(6.5, headerY + 0.5, labelWidth - 13, headerHeight - 1);
      ctx.fillStyle = 'rgba(169, 200, 235, 0.96)';
      ctx.fillText(groupSummary, 10, headerY + 10);

      const labelMap = disambiguateGroupLaneLabels(visibleEntries);
      ctx.setLineDash([2, 4]);

      for (const entry of visibleEntries) {
        const displayLane = displayLaneFor(entry.absoluteLane);
        const displayY = laneYForIndex(state, displayLane);
        ctx.strokeStyle = entry.isDisabled ? DISABLED_LANE_STROKE : 'rgba(148, 163, 184, 0.36)';
        ctx.beginPath();
        ctx.moveTo(labelWidth, displayY);
        ctx.lineTo(state.width, displayY);
        ctx.stroke();

        const labelKey = `${entry.absoluteLane}:${entry.key}`;
        const label = labelMap.get(labelKey) || entry.label;
        ctx.fillStyle = entry.isDisabled ? '#6b7280' : '#c1d2e7';
        ctx.fillText(truncate(label, 35), 8, displayY - 2);
      }
    }

    ctx.setLineDash([]);
  }

  ctx.fillStyle = '#7aa2d3';
  ctx.fillRect(state.width - NOW_MARKER_OFFSET, 0, 2, state.height);

  const nowBadgeLeft = nowLabelRight - (nowLabelWidth + 10);
  ctx.fillStyle = 'rgba(7, 13, 19, 0.92)';
  ctx.fillRect(nowBadgeLeft - 4, 2, nowLabelWidth + 14, 14);
  ctx.strokeStyle = 'rgba(122, 162, 211, 0.75)';
  ctx.strokeRect(nowBadgeLeft - 4.5, 2.5, nowLabelWidth + 14, 14);

  ctx.fillStyle = '#a8c8ee';
  ctx.textAlign = 'right';
  ctx.fillText(nowLabel, nowLabelRight, 12);
  ctx.textAlign = 'left';
}

export function drawMarbles(state: DrawMarblesState): DrawMarblesResult {
  const { ctx } = state;

  let hoverId: number | null = null;
  let worldOffsetPx = state.worldOffsetPx;
  let worldOffsetPy = state.worldOffsetPy;

  if (state.mouse.down && state.dragStart) {
    const dx = state.mouse.x - state.dragStart.x;
    const dy = state.mouse.y - state.dragStart.y;
    worldOffsetPx = state.dragStart.offsetX + dx;
    worldOffsetPy = state.dragStart.offsetY + dy;
  }

  const marbleRenderState: CanvasRenderBaseState = {
    ...state,
    worldOffsetPx,
    worldOffsetPy,
  };

  for (let i = state.marbles.length - 1; i >= 0; i--) {
    const marble = state.marbles[i];
    const x = xForTime(marbleRenderState, marble.timeMs);
    if (x < -40 || x > state.width + 40) continue;

    const label = (marble.msg?.type || '').toString();
    const tags = marble.filters || null;
    if (!state.filters.matches(label, tags)) continue;

    const displayLane =
      state.filters.filterDomain && state.filteredLaneMap.has(marble.lane)
        ? state.filteredLaneMap.get(marble.lane)!
        : marble.lane;
    const y = laneYForIndex(marbleRenderState, displayLane);

    const laneDisabled = state.laneActivity.isLaneDisabled(marble.laneKey);
    const dx = state.mouse.x - x;
    const dy = state.mouse.y - y;
    const isHover = dx * dx + dy * dy < (marble.r + 6) * (marble.r + 6);
    if (isHover) {
      hoverId = marble.id;
    }

    const isPinned = state.pinnedId === marble.id;
    if (isPinned) {
      const ringRadius = marble.r + 7;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = SELECTED_RING_COLOR;
      ctx.lineWidth = 2;
      ctx.shadowColor = SELECTED_GLOW_COLOR;
      ctx.shadowBlur = 12;
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (isHover && !isPinned) {
      const ringRadius = marble.r + 5;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = HOVER_RING_COLOR;
      ctx.lineWidth = 1.75;
      ctx.shadowColor = HOVER_GLOW_COLOR;
      ctx.shadowBlur = 8;
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const baseColor = laneDisabled ? DISABLED_MARBLE_COLOR : marble.color;
    drawRxKindGlyph(ctx, marble.msg?.rxKind ?? marble.msg?.kind, x, y, marble.r, baseColor);
  }

  return {
    hoverId,
    worldOffsetPx,
    worldOffsetPy,
  };
}
