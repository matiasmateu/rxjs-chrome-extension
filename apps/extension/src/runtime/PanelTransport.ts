type PanelTransportOptions = {
  getInspectedTabId: () => number;
  onPortMessage: (msg: any) => void;
  onPortDisconnected: () => void;
  onPanelNavigated: () => void;
  onConnectError?: (error: unknown) => void;
  reconnectDelayMs?: number;
  autoReconnect?: boolean;
};

export class PanelTransport {
  private options: PanelTransportOptions;
  private connecting = false;
  private reconnectTimer: number | null = null;
  private port: any = null;

  constructor(options: PanelTransportOptions) {
    this.options = options;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private postInit() {
    try {
      this.port?.postMessage({
        type: 'INIT',
        tabId: this.options.getInspectedTabId(),
      });
    } catch {
      // no-op
    }
  }

  private handlePortDisconnect = () => {
    this.options.onPortDisconnected();

    const autoReconnect = this.options.autoReconnect ?? true;
    if (!autoReconnect) return;

    const delay = this.options.reconnectDelayMs ?? 500;
    this.clearReconnectTimer();
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  };

  private handleNavigated = () => {
    this.postInit();
    this.options.onPanelNavigated();
  };

  connect = () => {
    if (this.connecting) return;
    this.connecting = true;

    try {
      this.port = chrome.runtime.connect({ name: 'rxjs-panel' });
      this.port.onMessage.addListener(this.options.onPortMessage);
      this.port.onDisconnect.addListener(this.handlePortDisconnect);
      this.postInit();

      if (chrome?.devtools?.network?.onNavigated) {
        chrome.devtools.network.onNavigated.removeListener(this.handleNavigated);
        chrome.devtools.network.onNavigated.addListener(this.handleNavigated);
      }
    } catch (error) {
      this.options.onConnectError?.(error);
    }

    this.connecting = false;
  };

  disconnect = () => {
    this.clearReconnectTimer();

    if (chrome?.devtools?.network?.onNavigated) {
      chrome.devtools.network.onNavigated.removeListener(this.handleNavigated);
    }

    if (!this.port) return;

    try {
      this.port.onMessage.removeListener(this.options.onPortMessage);
    } catch {
      // no-op
    }

    try {
      this.port.onDisconnect.removeListener(this.handlePortDisconnect);
    } catch {
      // no-op
    }

    try {
      this.port.disconnect();
    } catch {
      // no-op
    }

    this.port = null;
  };
}
