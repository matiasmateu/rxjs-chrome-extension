import {
  PRIMARY_BTN_STYLE,
  SECONDARY_BTN_STYLE,
  STATS_BADGE_STYLE,
  TERTIARY_BTN_STYLE,
  TITLE_STYLE,
  TOOLBAR_DIVIDER_STYLE,
  toolbarControlsGroupStyle,
  toolbarFilterInputStyle,
  toolbarResponsiveStyle,
  toolbarSearchGroupStyle,
} from './styles';
import type { ToolbarProps } from './types';

export function Toolbar({
  running,
  filterText,
  statsText,
  onToggleRunning,
  onClear,
  onFilterTextChange,
  onZoomIn,
  onZoomOut,
  detailsPanelOpen,
  compact,
  onToggleDetailsPanel,
}: ToolbarProps) {
  const toolbarStyle = toolbarResponsiveStyle(compact);
  const controlsGroupStyle = toolbarControlsGroupStyle(compact);
  const searchGroupStyle = toolbarSearchGroupStyle(compact);
  const filterInputStyle = toolbarFilterInputStyle(compact);

  const detailsToggleButtonStyle = compact ? SECONDARY_BTN_STYLE : TERTIARY_BTN_STYLE;

  return (
    <div style={toolbarStyle} role="toolbar" aria-label="Timeline controls">
      <div style={controlsGroupStyle} role="group" aria-label="Playback and view controls">
        <div style={TITLE_STYLE}>Marble Timeline</div>
        <button
          type="button"
          style={PRIMARY_BTN_STYLE}
          onClick={onToggleRunning}
          aria-label={running ? 'Pause timeline' : 'Play timeline'}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          style={SECONDARY_BTN_STYLE}
          onClick={onClear}
          aria-label="Clear timeline events"
        >
          Clear
        </button>
        {!compact ? <div style={TOOLBAR_DIVIDER_STYLE} /> : null}
        <button
          type="button"
          style={TERTIARY_BTN_STYLE}
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out timeline"
        >
          - Zoom
        </button>
        <button
          type="button"
          style={TERTIARY_BTN_STYLE}
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in timeline"
        >
          + Zoom
        </button>
        {!compact ? <div style={TOOLBAR_DIVIDER_STYLE} /> : null}
        <button
          type="button"
          style={detailsToggleButtonStyle}
          onClick={onToggleDetailsPanel}
          aria-label={detailsPanelOpen ? 'Hide details panel' : 'Show details panel'}
        >
          {detailsPanelOpen ? 'Hide details' : 'Show details'}
        </button>
      </div>
      <div style={searchGroupStyle} role="group" aria-label="Search and stats">
        {!compact ? <div style={TOOLBAR_DIVIDER_STYLE} /> : null}
        <input
          type="text"
          placeholder="Filter label or kind includes (e.g. next, subscribe)"
          value={filterText}
          onChange={(event) => onFilterTextChange(event.target.value)}
          style={filterInputStyle}
          aria-label="Filter events by label or kind"
        />
        <div style={STATS_BADGE_STYLE} role="status" aria-live="polite" aria-atomic="true">
          {statsText}
        </div>
      </div>
    </div>
  );
}
