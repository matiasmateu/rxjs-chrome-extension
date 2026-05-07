import './react.production.min.js';

const React = globalThis.React;
if (!React) {
  throw new Error('React UMD build not found. Ensure vendor/react.production.min.js is present.');
}

export default React;
export const {
  createElement,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
} = React;
