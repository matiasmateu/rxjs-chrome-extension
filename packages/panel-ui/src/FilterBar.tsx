import {
  ACTIVE_FILTER_CHIP_STYLE,
  FILTER_CHIP_COUNT_STYLE,
  FILTER_CLEAR_BTN_STYLE,
  FILTER_ROW_STYLE,
  FILTER_GROUP_LABEL_STYLE,
  FILTER_GROUP_STYLE,
  filterChipStyle,
  filterBarStyle,
} from './styles';
import type { FilterBarProps, FilterOption } from './types';

export function FilterBar({
  domains,
  activeDomain,
  activeText,
  compact,
  onSelectDomain,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters = Boolean(activeDomain || activeText.trim());
  const totalDomainCount = domains.reduce((sum, option) => sum + (option.count || 0), 0);
  const activeDomainLabel =
    domains.find((option) => option.value === activeDomain)?.label || activeDomain;

  const renderFilterGroup = (
    label: string,
    options: FilterOption[],
    activeValue: string,
    onSelect: (value: string) => void,
  ) => (
    <div
      style={FILTER_GROUP_STYLE}
      key={`${label}-group`}
      role="group"
      aria-label={`${label} filter`}
    >
      <span style={FILTER_GROUP_LABEL_STYLE}>{label}</span>
      <button
        type="button"
        style={filterChipStyle(!activeValue)}
        onClick={() => onSelect('')}
        aria-pressed={!activeValue}
        aria-label={`Show any ${label.toLowerCase()} (${totalDomainCount} events)`}
      >
        Any
        {totalDomainCount > 0 ? (
          <span style={FILTER_CHIP_COUNT_STYLE}>{totalDomainCount}</span>
        ) : null}
      </button>
      {options.map((option) => (
        <button
          type="button"
          key={`${label}-${option.value}`}
          style={filterChipStyle(activeValue === option.value)}
          onClick={() => onSelect(option.value)}
          title={option.label}
          aria-pressed={activeValue === option.value}
          aria-label={`${option.label || option.value || 'Unknown'} (${option.count || 0} events)`}
        >
          {option.label || option.value || 'Unknown'}
          {option.count != null ? (
            <span style={FILTER_CHIP_COUNT_STYLE}>{option.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );

  return (
    <div style={filterBarStyle(compact)} role="region" aria-label="Timeline filters">
      <div style={FILTER_ROW_STYLE}>
        {renderFilterGroup('Domain', domains, activeDomain, onSelectDomain)}
      </div>
      {hasActiveFilters ? (
        <div style={FILTER_ROW_STYLE}>
          <span style={FILTER_GROUP_LABEL_STYLE} aria-hidden="true">
            Active
          </span>
          {activeText.trim() ? (
            <span style={ACTIVE_FILTER_CHIP_STYLE} role="status" aria-live="polite">
              Text: "{activeText.trim()}"
            </span>
          ) : null}
          {activeDomain ? (
            <span style={ACTIVE_FILTER_CHIP_STYLE} role="status" aria-live="polite">
              Domain: {activeDomainLabel}
            </span>
          ) : null}
          <button
            type="button"
            style={FILTER_CLEAR_BTN_STYLE}
            onClick={onClearFilters}
            aria-label="Clear active filters"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
