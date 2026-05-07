export type TooltipPosition = { x: number; y: number };

export type TooltipState = {
  visible: boolean;
  position: TooltipPosition;
  id?: number;
  pinned?: boolean;
  canPin?: boolean;
  title?: string;
  message?: any;
};

export type FilterOption = {
  value: string;
  label: string;
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
  dataPayload: any;
};

export type ToolbarProps = {
  running: boolean;
  filterText: string;
  statsText: string;
  onToggleRunning: () => void;
  onClear: () => void;
  onFilterTextChange: (value: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export type FilterBarProps = {
  domains: FilterOption[];
  activeDomain: string;
  onSelectDomain: (value: string) => void;
};

export type TooltipPanelProps = {
  tooltipState: TooltipState;
  messageInfo: MessageInfo | null;
  copyLabel: string;
  onCopy: () => void;
  onDownload: () => void;
  onPin: () => void;
  onClose: () => void;
  pinnedId: number | null;
};
