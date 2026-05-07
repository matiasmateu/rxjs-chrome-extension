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

/**
 * Projects an event timestamp into canvas X coordinates.
 *
 * @param projection Time projection parameters.
 * @param ms Event timestamp in milliseconds.
 * @returns X coordinate in canvas space.
 */
export function xForTime(projection: TimeProjection, ms: number) {
  const dtSec = (projection.timeOriginMs - ms) / 1000;
  return (
    projection.width -
    NOW_MARKER_OFFSET -
    dtSec * PX_PER_SEC * projection.xZoom +
    projection.worldOffsetPx
  );
}

/**
 * Projects a lane index into canvas Y coordinates, including scroll offset.
 *
 * @param projection Lane projection parameters.
 * @param lane Absolute lane index.
 * @returns Y coordinate in canvas space.
 */
export function laneYForIndex(projection: LaneProjection, lane: number) {
  const baseY = projection.laneLayout.laneY(lane, projection.height);
  return baseY + projection.worldOffsetPy;
}
