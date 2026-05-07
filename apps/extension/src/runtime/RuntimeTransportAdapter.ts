import { PanelTransport } from './PanelTransport';
import type { RuntimeBackgroundPayload } from '../transport-types';

export type RuntimeTransportEvent =
  | { type: 'message'; payload: RuntimeBackgroundPayload }
  | { type: 'disconnected' }
  | { type: 'navigated' }
  | { type: 'connect-error'; error: unknown };

type RuntimeTransportAdapterOptions = {
  getInspectedTabId: () => number;
  onEvent: (event: RuntimeTransportEvent) => void;
  reconnectDelayMs?: number;
  autoReconnect?: boolean;
};

export class RuntimeTransportAdapter {
  private transport: PanelTransport;

  constructor(options: RuntimeTransportAdapterOptions) {
    this.transport = new PanelTransport({
      getInspectedTabId: options.getInspectedTabId,
      onPortMessage: (payload) => {
        options.onEvent({ type: 'message', payload });
      },
      onPortDisconnected: () => {
        options.onEvent({ type: 'disconnected' });
      },
      onPanelNavigated: () => {
        options.onEvent({ type: 'navigated' });
      },
      onConnectError: (error) => {
        options.onEvent({ type: 'connect-error', error });
      },
      reconnectDelayMs: options.reconnectDelayMs,
      autoReconnect: options.autoReconnect,
    });
  }

  connect() {
    this.transport.connect();
  }

  disconnect() {
    this.transport.disconnect();
  }
}
