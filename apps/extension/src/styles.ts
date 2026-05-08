import type { CSSProperties } from 'react';

const css = (style: CSSProperties): CSSProperties => style;

const SPACE = {
  md: '8px',
} as const;

const SURFACE = {
  root: '#1e1e1e',
  divider: '#1d2733',
} as const;

const TEXT = {
  primary: '#d4d4d4',
} as const;

export const ROOT_STYLE = css({
  boxSizing: 'border-box',
  height: '100vh',
  width: '100vw',
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr auto',
  background: SURFACE.root,
  color: TEXT.primary,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
});

export const STAGE_STYLE = css({
  display: 'flex',
  position: 'relative',
  minHeight: 0,
  overflow: 'hidden',
});

export const CANVAS_STAGE_STYLE = css({
  position: 'relative',
  flex: '1 1 auto',
  overflow: 'hidden',
  minWidth: 0,
});

export const DETAILS_RESIZER_STYLE = css({
  flex: `0 0 ${SPACE.md}`,
  width: SPACE.md,
  cursor: 'col-resize',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  userSelect: 'none',
});

export const DETAILS_RESIZER_BAR_STYLE = css({
  width: '1px',
  height: '100%',
  background: SURFACE.divider,
});
