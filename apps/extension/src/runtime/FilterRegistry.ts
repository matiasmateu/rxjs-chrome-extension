import type { FilterOptions, FilterTags } from '../types';

export class FilterRegistry {
  filterText: string;
  filterDomain: string;
  filterDomains: Map<string, string>;
  notifyFilterOptions: ((options: FilterOptions) => void) | null;

  constructor(
    initialText: string,
    initialDomain: string,
    notifyFilterOptions?: (options: FilterOptions) => void,
  ) {
    this.filterText = (initialText || '').trim().toLowerCase();
    this.filterDomain = (initialDomain || '').toLowerCase();
    this.filterDomains = new Map();
    this.notifyFilterOptions = notifyFilterOptions || null;
  }

  setText = (value: string) => {
    this.filterText = (value || '').trim().toLowerCase();
  };

  setDomain = (value: string) => {
    this.filterDomain = (value || '').toLowerCase();
  };

  matches = (label: string, tags: FilterTags | null) => {
    const matchesText = !this.filterText || label.toLowerCase().includes(this.filterText);
    const matchesDomain =
      !this.filterDomain || (tags?.domainKey && tags.domainKey === this.filterDomain);
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
    }

    if (changed && this.notifyFilterOptions) {
      const domains = Array.from(this.filterDomains.entries()).map(([value, label]) => ({
        value,
        label: label || value,
      }));

      domains.sort((a, b) => a.label.localeCompare(b.label));

      this.notifyFilterOptions({ domains });
    }
  };

  clear = () => {
    this.filterDomains.clear();
    if (this.notifyFilterOptions) {
      this.notifyFilterOptions({ domains: [] });
    }
  };
}
