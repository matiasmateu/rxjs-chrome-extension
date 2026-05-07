import { NOW_MARKER_OFFSET, PX_PER_SEC } from './constants';
import type { LaneLayout } from './LaneLayout';

type TimeProjection = {
  width: number;
  timeOriginMs: number;
  xZoom: number;
  worldOffsetPx: number;
};

type LaneProjection = {
  laneLayout: LaneLayout;
  height: number;
  worldOffsetPy: number;
};

export function xForTime(projection: TimeProjection, ms: number) {
  const dtSec = (projection.timeOriginMs - ms) / 1000;
  return (
    projection.width -
    NOW_MARKER_OFFSET -
    dtSec * PX_PER_SEC * projection.xZoom +
    projection.worldOffsetPx
  );
}

export function laneYForIndex(projection: LaneProjection, lane: number) {
  const baseY = projection.laneLayout.laneY(lane, projection.height);
  return baseY + projection.worldOffsetPy;
}
