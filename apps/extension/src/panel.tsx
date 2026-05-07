import React from './react';
import { createRoot } from './react-dom';
import { PanelApp } from './panel-app';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element');
}

const root = createRoot(rootElement);
root.render(<PanelApp />);
