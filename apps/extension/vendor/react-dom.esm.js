import './react.esm.js';
import './react-dom.production.min.js';

const ReactDOM = globalThis.ReactDOM;
if (!ReactDOM) {
  throw new Error(
    'ReactDOM UMD build not found. Ensure vendor/react-dom.production.min.js is present.',
  );
}

export default ReactDOM;
export const { createRoot } = ReactDOM;
