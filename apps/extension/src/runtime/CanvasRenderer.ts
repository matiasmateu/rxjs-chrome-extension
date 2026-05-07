import { fmtTime } from './RuntimeTime';
import { drawRxKindGlyph } from './RxKind';
import { truncate } from './StringUtils';
import {
  DISABLED_LANE_STROKE,
  DISABLED_MARBLE_COLOR,
  HOVER_ICON_COLOR,
  NOW_MARKER_OFFSET,
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

export function drawGrid(state: CanvasRenderBaseState) {
  const { ctx } = state;

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
      const height = endY - startY + state.laneLayout.laneMetrics(state.height).step;

      ctx.fillStyle = colors[i % 2];
      ctx.fillRect(
        0,
        startY - state.laneLayout.laneMetrics(state.height).step / 2,
        state.width,
        height,
      );
    }
  }

  ctx.strokeStyle = '#3c3c3c';
  ctx.fillStyle = '#c5c5c5';
  ctx.font = '11px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';

  const rightMs = state.timeOriginMs;
  const rightSec = Math.floor(rightMs / 1000) * 1000;

  ctx.beginPath();
  for (let t = rightSec; ; t -= 1000) {
    const x = xForTime(state, t);
    if (x < -50) break;
    if (x <= state.width + 50) {
      ctx.moveTo(x, 18);
      ctx.lineTo(x, state.height);
      ctx.fillText(fmtTime(t), x, 12);
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
          const sampleMarble = state.marbles.find((m) => m.laneKey === key);
          if (
            sampleMarble &&
            state.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters)
          ) {
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

    for (const group of state.laneLayout.groupBoundaries) {
      if (group.size === 1) {
        const laneKeys = state.laneLayout.laneIndexMap[group.start];
        if (!laneKeys || laneKeys.size === 0) continue;

        let hasMatchingMarble = false;
        for (const key of laneKeys) {
          const sampleMarble = state.marbles.find((m) => m.laneKey === key);
          if (
            sampleMarble &&
            state.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters)
          ) {
            hasMatchingMarble = true;
            break;
          }
        }

        if (!hasMatchingMarble && state.filters.filterDomain) continue;

        const displayLane =
          state.filters.filterDomain && state.filteredLaneMap.has(group.start)
            ? state.filteredLaneMap.get(group.start)!
            : group.start;
        const displayY = laneYForIndex(state, displayLane);
        const label = state.laneLayout.groupLabels.get(group.key) || group.key;
        const isDisabled = state.laneActivity.isLaneDisabledForIndex(
          group.start,
          state.laneLayout.laneIndexMap,
        );

        ctx.strokeStyle = isDisabled ? DISABLED_LANE_STROKE : 'rgba(100, 116, 139, 0.3)';
        ctx.beginPath();
        ctx.moveTo(labelWidth, displayY);
        ctx.lineTo(state.width, displayY);
        ctx.stroke();

        ctx.fillStyle = isDisabled ? '#6b7280' : '#94a3b8';
        ctx.fillText(truncate(label, 35), 8, displayY - 2);
      } else {
        const allObservablesInGroup: Array<{ domain: string; key: string; absoluteLane: number }> =
          [];

        for (const domain of state.laneLayout.domainOrder) {
          const info = state.laneLayout.domainMap.get(domain);
          if (!info) continue;

          for (const [key, absoluteLane] of info.actions.entries()) {
            if (absoluteLane >= group.start && absoluteLane < group.end) {
              allObservablesInGroup.push({ domain, key, absoluteLane });
            }
          }
        }

        allObservablesInGroup.sort((a, b) => a.absoluteLane - b.absoluteLane);

        for (const { key, absoluteLane } of allObservablesInGroup) {
          const sampleMarble = state.marbles.find((m) => m.laneKey === key);
          if (
            state.filters.filterDomain &&
            (!sampleMarble ||
              !state.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters))
          ) {
            continue;
          }

          const displayLane =
            state.filters.filterDomain && state.filteredLaneMap.has(absoluteLane)
              ? state.filteredLaneMap.get(absoluteLane)!
              : absoluteLane;
          const displayY = laneYForIndex(state, displayLane);
          const isDisabled = state.laneActivity.isLaneDisabledForIndex(
            absoluteLane,
            state.laneLayout.laneIndexMap,
          );

          ctx.strokeStyle = isDisabled ? DISABLED_LANE_STROKE : 'rgba(100, 116, 139, 0.3)';
          ctx.beginPath();
          ctx.moveTo(labelWidth, displayY);
          ctx.lineTo(state.width, displayY);
          ctx.stroke();

          const info = state.laneLayout.domainMap.get(
            state.laneLayout.extractLaneParts(key).domain,
          );
          const metadata = info?.metadata.get(key);
          const label = metadata?.label || key.split('/').pop() || key;

          ctx.fillStyle = isDisabled ? '#6b7280' : '#94a3b8';
          ctx.fillText(truncate(label, 35), 8, displayY - 2);
        }
      }
    }

    ctx.setLineDash([]);
  }

  ctx.fillStyle = '#7aa2d3';
  ctx.fillRect(state.width - NOW_MARKER_OFFSET, 0, 2, state.height);
  ctx.textAlign = 'right';
  ctx.fillText(`now ${fmtTime(rightMs)}`, state.width - (NOW_MARKER_OFFSET + 4), 12);
  ctx.textAlign = 'left';
}

export function drawMarbles(state: DrawMarblesState): DrawMarblesResult {
  const { ctx } = state;

  let hoverId: number | null = null;
  let worldOffsetPx = state.worldOffsetPx;
  let worldOffsetPy = state.worldOffsetPy;

  if (state.mouse.down && state.dragStart) {
    const dy = state.mouse.y - state.dragStart.y;
    worldOffsetPy = state.dragStart.offsetY + dy;
    worldOffsetPx = 0;
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

    const baseColor = laneDisabled ? DISABLED_MARBLE_COLOR : marble.color;
    const color = isHover && !isPinned ? HOVER_ICON_COLOR : baseColor;
    drawRxKindGlyph(ctx, marble.msg?.rxKind ?? marble.msg?.kind, x, y, marble.r, color);
  }

  return {
    hoverId,
    worldOffsetPx,
    worldOffsetPy,
  };
}
