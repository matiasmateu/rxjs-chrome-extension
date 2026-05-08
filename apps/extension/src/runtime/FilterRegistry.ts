import type { FilterOptions, FilterTags } from '../types';

export class FilterRegistry {
  filterText: string;
  filterDomain: string;
  filterDomains: Map<string, string>;
  filterDomainCounts: Map<string, number>;
  notifyFilterOptions: ((options: FilterOptions) => void) | null;

  constructor(
    initialText: string,
    initialDomain: string,
    notifyFilterOptions?: (options: FilterOptions) => void,
  ) {
    this.filterText = (initialText || '').trim().toLowerCase();
    this.filterDomain = (initialDomain || '').toLowerCase();
    this.filterDomains = new Map();
    this.filterDomainCounts = new Map();
    this.notifyFilterOptions = notifyFilterOptions || null;
  }

  setText = (value: string) => {
    this.filterText = (value || '').trim().toLowerCase();
  };

  setDomain = (value: string) => {
    this.filterDomain = (value || '').toLowerCase();
  };

  matches = (label: string, tags: FilterTags | null): boolean => {
    const matchesText = !this.filterText || label.toLowerCase().includes(this.filterText);
    const matchesDomain = !this.filterDomain || tags?.domainKey === this.filterDomain;
    return matchesText && matchesDomain;
  };

  ingest = (tags: FilterTags | null) => {
    if (!tags) return;
    let changed = false;

    if (tags.domainKey) {
      const label = tags.domainLabel || tags.domainKey;
      if (!this.filterDomains.has(tags.domainKey)) {
        this.filterDomains.set(tags.domainKey, label);
        changed = true;
      }
      const nextCount = (this.filterDomainCounts.get(tags.domainKey) || 0) + 1;
      this.filterDomainCounts.set(tags.domainKey, nextCount);
      changed = true;
    }

    if (changed && this.notifyFilterOptions) {
      const domains = Array.from(this.filterDomains.entries()).map(([value, label]) => ({
        value,
        label: label || value,
        count: this.filterDomainCounts.get(value) || 0,
      }));

      domains.sort((a, b) => a.label.localeCompare(b.label));

      this.notifyFilterOptions({ domains });
    }
  };

  clear = () => {
    this.filterDomains.clear();
    this.filterDomainCounts.clear();
    if (this.notifyFilterOptions) {
      this.notifyFilterOptions({ domains: [] });
    }
  };
}
