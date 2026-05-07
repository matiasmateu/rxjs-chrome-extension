import { describe, expect, it } from 'vitest';
import { NOW_MARKER_OFFSET, PX_PER_SEC, ZOOM_IN_FACTOR } from '../constants';
import { InteractionController } from '../InteractionController';

type TestViewportState = {
  width: number;
  xZoom: number;
  worldOffsetPx: number;
  worldOffsetPy: number;
};

function createController(initial: TestViewportState) {
  const state: TestViewportState = { ...initial };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  } as HTMLCanvasElement;

  const controller = new InteractionController({
    getCanvas: () => canvas,
    getViewportState: () => state,
    updateViewportState: (patch) => {
      if (patch.xZoom != null) state.xZoom = patch.xZoom;
      if (patch.worldOffsetPx != null) state.worldOffsetPx = patch.worldOffsetPx;
      if (patch.worldOffsetPy != null) state.worldOffsetPy = patch.worldOffsetPy;
    },
    getHoverId: () => null,
    onPin: () => {},
    onClearTooltip: () => {},
    onToggleRunning: () => {},
  });

  return { controller, state };
}

function timeDeltaSeconds(state: TestViewportState, anchorX: number): number {
  const anchorOffsetPx = state.width - NOW_MARKER_OFFSET - anchorX;
  return (anchorOffsetPx + state.worldOffsetPx) / (PX_PER_SEC * state.xZoom);
}

describe('InteractionController', () => {
  it('preserves anchor time projection when zooming at X', () => {
    const { controller, state } = createController({
      width: 1000,
      xZoom: 2,
      worldOffsetPx: 120,
      worldOffsetPy: 0,
    });
    const anchorX = 640;

    const before = timeDeltaSeconds(state, anchorX);
    controller.zoomAtX(anchorX, 1.5);
    const after = timeDeltaSeconds(state, anchorX);

    expect(after).toBeCloseTo(before, 12);
  });

  it('zooms around now-marker anchor for wheel interactions', () => {
    const { controller, state } = createController({
      width: 1200,
      xZoom: 1,
      worldOffsetPx: 50,
      worldOffsetPy: 0,
    });

    let prevented = false;
    controller.handleWheel({
      shiftKey: false,
      deltaY: -100,
      preventDefault: () => {
        prevented = true;
      },
    } as WheelEvent);

    expect(prevented).toBe(true);
    expect(state.xZoom).toBeCloseTo(1 * ZOOM_IN_FACTOR, 12);
    expect(state.worldOffsetPx).toBeCloseTo(50 * ZOOM_IN_FACTOR, 12);
  });
});
