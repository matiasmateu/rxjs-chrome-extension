import type { TooltipState } from '../types';
import type { Marble } from './runtime-types';
import { fmtTime } from './RuntimeTime';

type TooltipBuildInput = {
  marble: Marble | null;
  pinnedId: number | null;
  hoverId: number | null;
  position?: { x: number; y: number };
};

/**
 * Builds the immutable tooltip view state from current hover/pin runtime data.
 *
 * @param input Tooltip source inputs.
 * @returns Tooltip state consumed by React UI.
 */
export function buildTooltipState(input: TooltipBuildInput): TooltipState {
  const { marble, pinnedId, hoverId, position } = input;
  if (!marble || !position) {
    return {
      visible: false,
      pinned: pinnedId != null,
      canPin: pinnedId != null || hoverId != null,
      message: null,
      position: { x: 0, y: 0 },
    };
  }

  return {
    visible: true,
    id: marble.id,
    pinned: pinnedId != null,
    canPin: pinnedId != null || hoverId != null,
    title: `${marble.msg?.type ?? 'Event'} • id:${marble.id} • ${fmtTime(marble.timeMs)}`,
    message: marble.msg,
    position,
  };
}

/**
 * Compares two tooltip states to decide whether UI update is needed.
 *
 * @param prev Previous tooltip state.
 * @param next Next tooltip state.
 * @returns `true` when meaningful tooltip fields changed.
 */
export function tooltipStateChanged(prev: TooltipState | null, next: TooltipState) {
  return (
    !prev ||
    prev.visible !== next.visible ||
    prev.id !== next.id ||
    prev.pinned !== next.pinned ||
    prev.canPin !== next.canPin ||
    prev.message !== next.message ||
    prev.position?.x !== next.position?.x ||
    prev.position?.y !== next.position?.y ||
    prev.title !== next.title
  );
}
