import type { RxDevtoolsMessage } from 'rxjs-devtools/protocol';

export const PANEL_PORT_NAME = 'rxjs-panel' as const;

export type PanelInitMessage = {
  type: 'INIT';
  tabId: number;
};

export type PanelAckMessage = {
  type: 'ACK';
  tabId: number;
};

export type RuntimeBackgroundMeta = {
  origin?: string;
  time?: number;
  originalType?: string;
  [key: string]: unknown;
};

export type RuntimeContentPayload = {
  __from?: string;
  message?: unknown;
  time?: number;
  [key: string]: unknown;
};

export type RuntimeContentForwardMessage = RuntimeContentPayload & {
  __from: 'CONTENT_SCRIPT';
  message: RxDevtoolsMessage;
  time: number;
};

export type RuntimeBackgroundPayload = {
  type?: string;
  tabId?: number;
  data?: unknown;
  meta?: RuntimeBackgroundMeta;
  time?: number;
  ts?: number;
  timestamp?: number;
  message?: unknown;
  [key: string]: unknown;
};
