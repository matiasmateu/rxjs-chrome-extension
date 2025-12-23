import React from '../react';
import type { FilterOption } from '../types';
import {
  FILTER_BAR_STYLE,
  FILTER_GROUP_STYLE,
  FILTER_GROUP_LABEL_STYLE,
  FILTER_CHIP_STYLE,
  FILTER_CHIP_ACTIVE_STYLE,
} from '../styles';

type FilterBarProps = {
  domains: FilterOption[];
  activeDomain: string;
  onSelectDomain: (value: string) => void;
};

export function FilterBar({ domains, activeDomain, onSelectDomain }: FilterBarProps) {
  const renderFilterGroup = (
    label: string,
    options: FilterOption[],
    activeValue: string,
    onSelect: (value: string) => void,
  ) => (
    <div style={FILTER_GROUP_STYLE} key={`${label}-group`}>
      <span style={FILTER_GROUP_LABEL_STYLE}>{label}</span>
      <button
        style={{
          ...FILTER_CHIP_STYLE,
          ...(activeValue ? {} : FILTER_CHIP_ACTIVE_STYLE),
        }}
        onClick={() => onSelect('')}
      >
        Any
      </button>
      {options.map((option) => (
        <button
          key={`${label}-${option.value}`}
          style={{
            ...FILTER_CHIP_STYLE,
            ...(activeValue === option.value ? FILTER_CHIP_ACTIVE_STYLE : null),
          }}
          onClick={() => onSelect(option.value)}
          title={option.label}
        >
          {option.label || option.value || 'Unknown'}
        </button>
      ))}
    </div>
  );

  return (
    <div style={FILTER_BAR_STYLE}>
      {renderFilterGroup('Domain', domains, activeDomain, onSelectDomain)}
    </div>
  );
}
