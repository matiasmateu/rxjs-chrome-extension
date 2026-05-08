export type TooltipPosition = { x: number; y: number };

export type TooltipMessage = Record<string, unknown>;

export type TooltipState = {
  visible: boolean;
  position: TooltipPosition;
  id?: number;
  pinned?: boolean;
  canPin?: boolean;
  title?: string;
  message?: TooltipMessage | null;
};

export type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

export type FilterOptions = {
  domains: FilterOption[];
};

export type MessageInfo = {
  domainLabel: string;
  label: string;
  kindLabel: string;
  operator: string;
  observableId: string;
  instanceId: string;
  subscriptionId: string;
  tags: string[];
  timeLabel: string;
  dataPayload: unknown;
};

export type ToolbarProps = {
  running: boolean;
  filterText: string;
  statsText: string;
  detailsPanelOpen: boolean;
  compact: boolean;
  onToggleRunning: () => void;
  onClear: () => void;
  onFilterTextChange: (value: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleDetailsPanel: () => void;
};

export type FilterBarProps = {
  domains: FilterOption[];
  activeDomain: string;
  activeText: string;
  compact: boolean;
  onSelectDomain: (value: string) => void;
  onClearFilters: () => void;
};

export type TooltipPanelProps = {
  tooltipState: TooltipState;
  messageInfo: MessageInfo | null;
  copyLabel: string;
  compact: boolean;
  width: number;
  onCopy: () => void;
  onDownload: () => void;
  onPin: () => void;
  onClose: () => void;
  pinnedId: number | null;
};
