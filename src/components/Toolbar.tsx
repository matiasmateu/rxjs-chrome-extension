import React from '../react';
import {
  TOOLBAR_STYLE,
  BASE_BTN_STYLE,
  SMALL_BTN_STYLE,
  TITLE_STYLE,
  FILTER_INPUT_STYLE,
  STATS_STYLE,
} from '../styles';

type ToolbarProps = {
  running: boolean;
  filterText: string;
  statsText: string;
  onToggleRunning: () => void;
  onClear: () => void;
  onFilterTextChange: (value: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function Toolbar({
  running,
  filterText,
  statsText,
  onToggleRunning,
  onClear,
  onFilterTextChange,
  onZoomIn,
  onZoomOut,
}: ToolbarProps) {
  return (
    <div style={TOOLBAR_STYLE}>
      <div style={TITLE_STYLE}>Marble Timeline</div>
      <div style={{ flex: '0 0 8px' }} />
      <button style={BASE_BTN_STYLE} onClick={onToggleRunning}>
        {running ? 'Pause' : 'Play'}
      </button>
      <button style={BASE_BTN_STYLE} onClick={onClear}>
        Clear
      </button>
      <div style={{ width: '1px', height: '20px', background: '#1f2a38' }} />
      <button style={SMALL_BTN_STYLE} onClick={onZoomOut} title="Zoom out">
        -
      </button>
      <button style={SMALL_BTN_STYLE} onClick={onZoomIn} title="Zoom in">
        +
      </button>
      <div style={{ width: '1px', height: '20px', background: '#1f2a38' }} />
      <input
        type="text"
        placeholder="Filter label or kind includes (e.g. next, subscribe)"
        value={filterText}
        onChange={(event) => onFilterTextChange(event.target.value)}
        style={FILTER_INPUT_STYLE}
      />
      <div style={{ width: '1px', height: '20px', background: '#1f2a38' }} />
      <div style={STATS_STYLE}>{statsText}</div>
    </div>
  );
}
