import type { CSSProperties } from 'react';

const css = (style: CSSProperties): CSSProperties => style;

export const TOOLBAR_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 12px',
  borderBottom: '1px solid #1d2733',
  background: '#0e141b',
});

export const BASE_BTN_STYLE = css({
  padding: '6px 10px',
  background: '#15202b',
  color: '#d6e2f0',
  border: '1px solid #223044',
  borderRadius: '10px',
  cursor: 'pointer',
});

export const SMALL_BTN_STYLE = css({
  padding: '4px 8px',
  fontSize: '12px',
  borderRadius: '8px',
  border: '1px solid #334155',
  background: '#0e141b',
  color: '#d6e2f0',
  cursor: 'pointer',
});

export const LEGEND_STYLE = css({
  padding: '6px 12px',
  borderTop: '1px solid #1d2733',
  fontSize: '12px',
  opacity: 0.8,
});

export const TITLE_STYLE = css({
  fontWeight: 600,
  letterSpacing: '0.3px',
});

export const FILTER_INPUT_STYLE = css({
  flex: 1,
  minWidth: '160px',
  padding: '6px 10px',
  borderRadius: '10px',
  border: '1px solid #243244',
  background: '#0b1117',
  color: '#d6e2f0',
});

export const STATS_STYLE = css({
  opacity: 0.7,
  fontVariantNumeric: 'tabular-nums',
});

export const RIGHT_PANEL_STYLE = css({
  flex: '0 0 320px',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid #1d2733',
  background: '#0d131a',
  minWidth: '260px',
  minHeight: 0,
});

export const RIGHT_PANEL_EMPTY_STYLE = css({
  padding: '12px',
  fontSize: '12px',
  opacity: 0.7,
});

export const TIP_STYLE = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  margin: '12px',
  background: 'rgba(16,24,32,.98)',
  border: '1px solid #334155',
  boxShadow: '0 6px 28px rgba(0,0,0,.5)',
  borderRadius: '12px',
  overflow: 'hidden',
  minHeight: 0,
});

export const TIP_HEADER_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '8px 10px',
  background: 'rgba(20,28,38,.9)',
  borderBottom: '1px solid #2a384b',
  fontSize: '12px',
});

export const TIP_TITLE_STYLE = css({
  opacity: 0.85,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const TIP_BTNS_STYLE = css({
  display: 'flex',
  gap: '6px',
});

export const TIP_SCROLL_STYLE = css({
  flex: '1 1 auto',
  overflow: 'auto',
  padding: '10px 12px',
  minHeight: 0,
});

export const TIP_CONTENT_STYLE = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  lineHeight: 1.5,
});

export const TIP_TREE_STYLE = css({
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '12px',
  lineHeight: 1.4,
});

export const FILTER_BAR_STYLE = css({
  display: 'flex',
  gap: '14px',
  padding: '8px 12px',
  borderBottom: '1px solid #1d2733',
  background: '#0d131a',
  flexWrap: 'wrap',
  alignItems: 'center',
});

export const FILTER_GROUP_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
});

export const FILTER_GROUP_LABEL_STYLE = css({
  fontSize: '12px',
  opacity: 0.7,
  fontWeight: 600,
});

export const FILTER_CHIP_STYLE = css({
  padding: '6px 10px',
  borderRadius: '10px',
  border: '1px solid #243244',
  background: '#0b1117',
  color: '#d6e2f0',
  cursor: 'pointer',
  fontSize: '12px',
});

export const FILTER_CHIP_ACTIVE_STYLE = css({
  background: '#1b2a3b',
  borderColor: '#3b82f6',
  color: '#d6e8ff',
  boxShadow: '0 0 0 1px rgba(59,130,246,.35)',
});

export const TIP_ROW_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
});

export const TIP_LABEL_STYLE = css({
  fontSize: '12px',
  opacity: 0.8,
  fontWeight: 600,
});

export const TIP_PILL_STYLE = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '10px',
  background: 'rgba(52,73,94,.35)',
  fontWeight: 600,
  letterSpacing: '0.2px',
  fontSize: '12px',
  width: 'fit-content',
  maxWidth: '100%',
  wordBreak: 'break-word',
});

export const TIP_PILL_EPIC_STYLE = css({
  background: 'rgba(194, 65, 12, 0.35)',
  border: '1px solid rgba(251, 146, 60, 0.8)',
  color: '#ffedd5',
});
