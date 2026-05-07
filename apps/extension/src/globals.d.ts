type ChromeEvent<TListener extends (...args: unknown[]) => unknown> = {
  addListener: (listener: TListener) => void;
  removeListener: (listener: TListener) => void;
};

type ChromeRuntimePort = {
  name: string;
  postMessage: (payload: unknown) => void;
  disconnect: () => void;
  onMessage: ChromeEvent<(message: unknown) => void>;
  onDisconnect: ChromeEvent<() => void>;
};

type ChromeMessageSender = {
  tab?: {
    id?: number;
  };
};

type ChromeRuntime = {
  connect: (connectInfo: { name: string }) => ChromeRuntimePort;
  sendMessage: (message: unknown, callback?: (response?: unknown) => void) => void;
  getURL: (path: string) => string;
  onConnect: ChromeEvent<(port: ChromeRuntimePort) => void>;
  onMessage: ChromeEvent<
    (
      message: unknown,
      sender: ChromeMessageSender,
      sendResponse: (response?: unknown) => void,
    ) => boolean | void
  >;
  lastError?: {
    message?: string;
  };
};

type ChromeTabs = {
  onRemoved: ChromeEvent<(tabId: number) => void>;
};

type ChromeDevtools = {
  panels: {
    create: (title: string, iconPath: string, pagePath: string, callback: () => void) => void;
  };
  network: {
    onNavigated: ChromeEvent<(url: string) => void>;
  };
  inspectedWindow: {
    tabId: number;
  };
};

declare const chrome: {
  runtime: ChromeRuntime;
  tabs: ChromeTabs;
  devtools: ChromeDevtools;
};
