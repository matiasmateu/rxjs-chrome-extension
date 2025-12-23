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

export type FilterTags = {
  domainKey: string;
  domainLabel: string;
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
