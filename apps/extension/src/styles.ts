import type { CSSProperties } from 'react';

const css = (style: CSSProperties): CSSProperties => style;

export const ROOT_STYLE = css({
  boxSizing: 'border-box',
  height: '100vh',
  width: '100vw',
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr auto',
  background: '#1e1e1e',
  color: '#d4d4d4',
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
});

export const STAGE_STYLE = css({
  display: 'flex',
  minHeight: 0,
  overflow: 'hidden',
});

export const CANVAS_STAGE_STYLE = css({
  position: 'relative',
  flex: '1 1 auto',
  overflow: 'hidden',
  minWidth: 0,
});
