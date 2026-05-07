import { firstString } from '../utils';
import { LANE_GROUP_GAP, LANE_MIN_STEP, LANE_PAD } from './constants';
import type { DomainInfo, GroupBoundary, Marble } from './runtime-types';

export class LaneLayout {
  lanes: number;
  maxAutoLanes: number;
  syncLaneCount?: (lanes: number) => void;

  domainOrder: string[];
  domainMap: Map<string, DomainInfo>;
  laneIndexMap: Array<Set<string>>;
  groupBoundaries: GroupBoundary[];
  groupIndexByLane: number[];
  groupLabels: Map<string, string>;

  constructor(initialLanes: number, maxAutoLanes: number, syncLaneCount?: (lanes: number) => void) {
    this.lanes = initialLanes;
    this.maxAutoLanes = Math.max(1, maxAutoLanes);
    this.syncLaneCount = syncLaneCount;

    this.domainOrder = [];
    this.domainMap = new Map();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels = new Map();
  }

  setLanes = (value: number) => {
    const next = Math.max(1, value);
    this.lanes = next;
    if (this.syncLaneCount && next !== value) {
      this.syncLaneCount(next);
    }
    this.rebuildLaneIndexMap();
  };

  coerceLaneIndex = (index: number) => {
    if (!Number.isFinite(index) || index < 0) return 0;
    return Math.floor(index);
  };

  extractLaneParts = (rawKey: string) => {
    const key = rawKey ? String(rawKey) : 'default';
    const slashIdx = key.indexOf('/');
    const domain = slashIdx > 0 ? key.slice(0, slashIdx) : key;
    const normalizedDomain = domain || 'default';
    return { key, domain: normalizedDomain };
  };

  registerGroupLabel = (laneKey: string, msg: any) => {
    const { key, domain } = this.extractLaneParts(laneKey);
    if (!domain) return;
    const existing = this.groupLabels.get(domain);
    if (existing && existing !== domain) return;
    const label = firstString(msg?.observableId, msg?.label, msg?.instanceId, domain);
    if (label) {
      this.groupLabels.set(domain, label);
    }

    const info = this.domainMap.get(domain);
    if (info) {
      const tags = msg?.source?.tags || [];
      info.metadata.set(key, { tags: Array.isArray(tags) ? tags : [], label: label || key });
    }
  };

  resolveLaneKey = (rawKey: string, marbles: Marble[], msg?: any) => {
    return this.coerceLaneIndex(this.getLaneIndexForKey(rawKey, true, marbles, msg));
  };

  getLaneIndexForKey = (
    rawKey: string,
    createIfMissing: boolean,
    marbles: Marble[] = [],
    msg?: any,
  ) => {
    const { key, domain } = this.extractLaneParts(rawKey);
    let info = this.domainMap.get(domain);
    let changed = false;

    if (!info) {
      if (!createIfMissing) return 0;
      info = { actions: new Map(), baseOffset: 0, metadata: new Map() };
      this.domainMap.set(domain, info);
      this.domainOrder.push(domain);
      changed = true;
    }

    if (msg && info) {
      const tags = msg?.source?.tags || [];
      const label = firstString(msg?.observableId, msg?.label, msg?.instanceId, key);
      info.metadata.set(key, { tags: Array.isArray(tags) ? tags : [], label: label || key });
    }

    if (!info.actions.has(key)) {
      if (!createIfMissing) return info.baseOffset;
      info.actions.set(key, this.lanes);
      changed = true;
    }

    if (changed && createIfMissing) {
      this.updateStructure(true, marbles);
      info = this.domainMap.get(domain) || info;
    }

    return info.actions.get(key) ?? 0;
  };

  updateStructure = (reassign: boolean, marbles: Marble[]) => {
    let offset = 0;
    const boundaries: GroupBoundary[] = [];
    const groupIndexByLane: number[] = [];
    let groupIndex = 0;

    const getGroupingTag = (tags: string[] | undefined) => {
      if (!tags || tags.length === 0) return '';
      const specificTag = tags.find(t => t.includes('-'));
      if (specificTag) return specificTag;
      return tags[tags.length - 1] || '';
    };

    const allObservables: Array<{
      domain: string;
      key: string;
      meta: { tags: string[]; label: string } | undefined;
    }> = [];

    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (!info) continue;

      for (const [key] of info.actions.entries()) {
        allObservables.push({
          domain,
          key,
          meta: info.metadata.get(key),
        });
      }
    }

    allObservables.sort((a, b) => {
      const tagA = getGroupingTag(a.meta?.tags);
      const tagB = getGroupingTag(b.meta?.tags);
      if (tagA !== tagB) return tagA.localeCompare(tagB);

      const labelA = a.meta?.label || a.key;
      const labelB = b.meta?.label || b.key;
      if (labelA !== labelB) return labelA.localeCompare(labelB);

      return a.key.localeCompare(b.key);
    });

    const absoluteLaneMap = new Map<string, number>();

    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (info) {
        info.actions.clear();
        info.baseOffset = 0;
      }
    }

    let currentTag = '';
    let tagGroupStart = 0;
    const tagGroups: Array<{
      tag: string;
      observables: typeof allObservables;
    }> = [];

    for (let i = 0; i < allObservables.length; i++) {
      const observable = allObservables[i];
      const tag = getGroupingTag(observable.meta?.tags);

      if (tag !== currentTag) {
        if (i > tagGroupStart) {
          tagGroups.push({
            tag: currentTag,
            observables: allObservables.slice(tagGroupStart, i),
          });
        }
        currentTag = tag;
        tagGroupStart = i;
      }
    }

    if (tagGroupStart < allObservables.length) {
      tagGroups.push({
        tag: currentTag,
        observables: allObservables.slice(tagGroupStart),
      });
    }

    for (const tagGroup of tagGroups) {
      const groupStartOffset = offset;

      for (const observable of tagGroup.observables) {
        const { domain, key } = observable;
        absoluteLaneMap.set(`${domain}::${key}`, offset);
        offset += 1;
      }

      const groupSize = tagGroup.observables.length;
      if (groupSize > 0) {
        const groupLabel = tagGroup.tag || tagGroup.observables[0]?.meta?.label || 'group';
        boundaries.push({
          key: groupLabel,
          start: groupStartOffset,
          end: offset,
          size: groupSize,
        });

        for (let i = groupStartOffset; i < offset; i++) {
          groupIndexByLane[i] = groupIndex;
        }
        groupIndex += 1;
      }
    }

    for (const observable of allObservables) {
      const { domain, key } = observable;
      const info = this.domainMap.get(domain);
      if (!info) continue;

      const absoluteLane = absoluteLaneMap.get(`${domain}::${key}`);
      if (absoluteLane !== undefined) {
        info.actions.set(key, absoluteLane);
      }
    }

    this.groupBoundaries = boundaries;
    this.groupIndexByLane = groupIndexByLane;

    const prevLanes = this.lanes;
    const totalLanes = offset > 0 ? offset : prevLanes || 1;
    const nextLanes = Math.max(1, totalLanes);
    this.lanes = nextLanes;
    if (this.syncLaneCount && nextLanes !== prevLanes) {
      this.syncLaneCount(nextLanes);
    }

    if (reassign) {
      this.reassignMarbleLanes(marbles);
    }
    this.rebuildLaneIndexMap();
  };

  rebuildLaneIndexMap = () => {
    const totalLanes = this.groupBoundaries.length
      ? this.groupBoundaries[this.groupBoundaries.length - 1].end
      : 0;
    const laneCount = Math.max(1, Math.max(this.lanes, totalLanes));
    if (laneCount !== this.lanes) {
      this.lanes = laneCount;
    }
    const nextMap = Array.from({ length: laneCount }, () => new Set<string>());

    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (!info) continue;
      for (const [key, absoluteLane] of info.actions.entries()) {
        const laneIndex = this.coerceLaneIndex(absoluteLane);
        nextMap[laneIndex].add(key);
      }
    }

    this.laneIndexMap = nextMap;
  };

  reassignMarbleLanes = (marbles: Marble[]) => {
    if (!marbles.length) return;
    for (const marble of marbles) {
      const laneKey =
        marble.laneKey ??
        marble.msg?.laneKey ??
        marble.msg?.observableId ??
        marble.msg?.label ??
        marble.msg?.type;
      const laneIndex = this.getLaneIndexForKey(laneKey, false);
      marble.lane = this.coerceLaneIndex(laneIndex);
    }
  };

  laneMetrics = (height: number) => {
    const pad = LANE_PAD;
    const inner = Math.max(1, height - pad * 2);
    const groupCount = Math.max(1, this.groupBoundaries.length || 1);
    const virtualLanes = this.lanes + Math.max(0, groupCount - 1) * LANE_GROUP_GAP;
    const fitStep = inner / Math.max(1, virtualLanes);
    const step = Math.max(LANE_MIN_STEP, fitStep);
    return { pad, step };
  };

  laneY = (lane: number, height: number) => {
    const { pad, step } = this.laneMetrics(height);
    const groupIndex = this.groupIndexByLane[lane] ?? 0;
    const virtualIndex = lane + groupIndex * LANE_GROUP_GAP;
    return pad + (virtualIndex + 0.5) * step;
  };

  clear = () => {
    this.domainOrder.length = 0;
    this.domainMap.clear();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels.clear();
  };
}
