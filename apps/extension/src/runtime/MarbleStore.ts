import { hashColor } from './ColorHash';
import { extractFilterTags } from './FilterTags';
import type { FilterRegistry } from './FilterRegistry';
import type { LaneActivity } from './LaneActivity';
import type { LaneLayout } from './LaneLayout';
import type { Marble, RuntimeMarbleMessage } from './runtime-types';

type MarbleStoreOptions = {
  filters: FilterRegistry;
  laneLayout: LaneLayout;
  laneActivity: LaneActivity;
  onStatsChange?: (count: number) => void;
};

export class MarbleStore {
  marbles: Marble[];
  nextId: number;
  totalEvents: number;
  laneSamplesByKey: Map<string, Marble>;
  private marblesById: Map<number, Marble>;
  private readonly options: MarbleStoreOptions;

  constructor(options: MarbleStoreOptions) {
    this.options = options;
    this.marbles = [];
    this.nextId = 1;
    this.totalEvents = 0;
    this.laneSamplesByKey = new Map();
    this.marblesById = new Map();
  }

  clear() {
    this.marbles.length = 0;
    this.totalEvents = 0;
    this.laneSamplesByKey.clear();
    this.marblesById.clear();
    this.publishStats();
  }

  getById(id: number | null | undefined): Marble | null {
    if (id == null) return null;
    return this.marblesById.get(id) ?? null;
  }

  push(msg: RuntimeMarbleMessage) {
    let time = Date.now();
    const candidate = msg && (msg.time ?? msg.ts ?? msg.timestamp ?? msg.date ?? msg.t);
    if (typeof candidate === 'number') {
      time = candidate;
    } else if (typeof candidate === 'string') {
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) time = parsed;
    }

    const type = msg.type ? String(msg.type) : 'UNKNOWN';
    const laneSource = msg.laneKey ?? msg.label ?? type;
    const laneKey = laneSource == null ? type : String(laneSource);
    this.options.laneLayout.registerGroupLabel(laneKey, msg);
    this.options.laneActivity.update(laneKey, msg.rxKind, msg.subscriptionId);
    const lane = this.options.laneLayout.resolveLaneKey(laneKey, this.marbles, msg);

    let color = hashColor(type);
    if (msg.color != null) {
      if (typeof msg.color === 'string') {
        color = msg.color;
      } else if (typeof msg.color === 'number' && Number.isFinite(msg.color)) {
        const hue = ((msg.color % 360) + 360) % 360;
        color = `hsl(${hue}, 70%, 55%)`;
      }
    }

    const filters = extractFilterTags(msg);

    const marble: Marble = {
      id: this.nextId++,
      timeMs: time,
      r: 7,
      color,
      msg,
      laneKey,
      lane,
      filters,
    };
    this.marbles.push(marble);
    this.marblesById.set(marble.id, marble);
    if (!this.laneSamplesByKey.has(laneKey)) {
      this.laneSamplesByKey.set(laneKey, marble);
    }
    this.options.filters.ingest(filters);
    this.totalEvents++;
    this.publishStats();
  }

  private publishStats() {
    this.options.onStatsChange?.(this.totalEvents);
  }
}
