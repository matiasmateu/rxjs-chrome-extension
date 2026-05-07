import { normalizeRxKind } from '../utils';

type LaneStatus = {
  activeCount: number;
  disabled: boolean;
};

type SubscriptionState = {
  laneKey: string;
  active: boolean;
};

export class LaneActivity {
  laneStatus: Map<string, LaneStatus> = new Map();
  subscriptionState: Map<string, SubscriptionState> = new Map();

  update = (laneKey: string, kind?: string, subscriptionId?: string) => {
    if (!laneKey) return;
    const rxKind = normalizeRxKind(kind);
    if (!rxKind) return;
    const subscriptionKey = subscriptionId ? `${laneKey}::${subscriptionId}` : null;

    if (rxKind === 'subscribe' || rxKind === 'create') {
      const state = this.laneStatus.get(laneKey) || { activeCount: 0, disabled: false };
      if (subscriptionKey) {
        const existing = this.subscriptionState.get(subscriptionKey);
        if (!existing || !existing.active) {
          this.subscriptionState.set(subscriptionKey, { laneKey, active: true });
          state.activeCount += 1;
        }
      } else {
        state.activeCount += 1;
      }
      state.disabled = false;
      this.laneStatus.set(laneKey, state);
      return;
    }

    const isTerminal = rxKind === 'complete' || rxKind === 'error' || rxKind === 'unsubscribe';
    if (!isTerminal) return;

    const sub = subscriptionKey ? this.subscriptionState.get(subscriptionKey) : null;
    const targetLaneKey = sub?.laneKey || laneKey;
    const state = this.laneStatus.get(targetLaneKey) || { activeCount: 0, disabled: false };

    if (subscriptionKey && sub) {
      if (sub.active) {
        state.activeCount = Math.max(0, state.activeCount - 1);
      }
      this.subscriptionState.delete(subscriptionKey);
    } else if (!subscriptionKey || rxKind !== 'unsubscribe') {
      state.activeCount = Math.max(0, state.activeCount - 1);
    }

    if (state.activeCount === 0) {
      state.disabled = true;
    }

    this.laneStatus.set(targetLaneKey, state);
  };

  isLaneDisabled = (laneKey: string) => {
    if (!laneKey) return false;
    const state = this.laneStatus.get(laneKey);
    return Boolean(state && state.disabled && state.activeCount <= 0);
  };

  isLaneDisabledForIndex = (laneIndex: number, laneIndexMap: Array<Set<string>>) => {
    const entries = laneIndexMap[laneIndex];
    if (!entries || entries.size === 0) return false;
    let hasState = false;
    for (const key of entries) {
      const state = this.laneStatus.get(key);
      if (!state) continue;
      hasState = true;
      if (state.activeCount > 0) return false;
      if (!state.disabled) return false;
    }
    return hasState;
  };

  clear = () => {
    this.laneStatus.clear();
    this.subscriptionState.clear();
  };
}
