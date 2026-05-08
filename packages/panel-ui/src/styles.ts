import type { CSSProperties } from 'react';

const css = (style: CSSProperties): CSSProperties => style;

export const SPACE = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  xxl: '14px',
} as const;

export const RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  pill: '999px',
} as const;

export const FONT_SIZE = {
  xs: '11px',
  sm: '12px',
  md: '13px',
} as const;

export const SURFACE = {
  toolbar: '#0e141b',
  panel: '#0d131a',
  input: '#0b1117',
  elevated: '#0a1118',
  chip: '#121c28',
} as const;

export const BORDER = {
  subtle: '#1d2733',
  default: '#334155',
  input: '#243244',
} as const;

export const TEXT = {
  primary: '#d6e2f0',
  secondary: '#bed0e8',
  muted: '#a6bbd5',
  strong: '#dbe9fb',
} as const;

export const ACCENT = {
  primary: '#3b82f6',
  gradientStart: '#2563eb',
  gradientEnd: '#1d4ed8',
  onPrimary: '#eff6ff',
  subtleBg: '#1b2a3b',
  subtleText: '#d6e8ff',
} as const;

export const SIZE = {
  dividerHeight: '20px',
  keycap: '18px',
  detailsPanelMinWidth: '240px',
  popoverMaxWidth: '360px',
} as const;

export const OVERLAY = {
  popover: 'rgba(12, 20, 31, 0.98)',
  panel: 'rgba(16,24,32,.98)',
  panelHeader: 'rgba(20,28,38,.9)',
  panelSection: 'rgba(17, 26, 37, 0.7)',
  mutedPill: 'rgba(52,73,94,.35)',
  treeGuide: 'rgba(90,120,150,.25)',
  shadowMd: 'rgba(0,0,0,.45)',
  shadowLg: 'rgba(0,0,0,.5)',
  activeRing: 'rgba(59,130,246,.35)',
} as const;

export const TOOLBAR_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.xl,
  padding: `${SPACE.md} ${SPACE.xl}`,
  borderBottom: `1px solid ${BORDER.subtle}`,
  background: SURFACE.toolbar,
});

export const BASE_BTN_STYLE = css({
  padding: `${SPACE.sm} ${SPACE.lg}`,
  background: '#15202b',
  color: TEXT.primary,
  border: '1px solid #223044',
  borderRadius: RADIUS.lg,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export const PRIMARY_BTN_STYLE = css({
  ...BASE_BTN_STYLE,
  background: `linear-gradient(180deg, ${ACCENT.gradientStart} 0%, ${ACCENT.gradientEnd} 100%)`,
  border: `1px solid ${ACCENT.primary}`,
  color: ACCENT.onPrimary,
  fontWeight: 700,
  boxShadow: '0 1px 0 rgba(255,255,255,.08) inset, 0 6px 16px rgba(37,99,235,.28)',
});

export const SECONDARY_BTN_STYLE = css({
  ...BASE_BTN_STYLE,
  background: '#101a24',
  border: '1px solid #2c3f55',
  color: '#c7d8ed',
});

export const SMALL_BTN_STYLE = css({
  padding: `${SPACE.xs} ${SPACE.md}`,
  fontSize: FONT_SIZE.sm,
  borderRadius: RADIUS.md,
  border: `1px solid ${BORDER.default}`,
  background: SURFACE.toolbar,
  color: TEXT.primary,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export const TERTIARY_BTN_STYLE = css({
  ...SMALL_BTN_STYLE,
  background: '#0f1720',
  border: '1px solid #2b3a4a',
  color: '#bed0e8',
});

export const TOOLBAR_GROUP_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.md,
  flexWrap: 'wrap',
  minWidth: 0,
});

export function toolbarResponsiveStyle(compact: boolean): CSSProperties {
  return {
    ...TOOLBAR_STYLE,
    flexWrap: 'wrap',
    rowGap: compact ? SPACE.md : SPACE.xl,
  };
}

export function toolbarControlsGroupStyle(compact: boolean): CSSProperties {
  return {
    ...TOOLBAR_GROUP_STYLE,
    flex: compact ? '1 1 100%' : '0 0 auto',
  };
}

export function toolbarSearchGroupStyle(compact: boolean): CSSProperties {
  return {
    ...TOOLBAR_GROUP_STYLE,
    flex: '1 1 360px',
    marginLeft: compact ? 0 : 'auto',
  };
}

export const TOOLBAR_DIVIDER_STYLE = css({
  width: '1px',
  height: SIZE.dividerHeight,
  background: '#1f2a38',
});

export const LEGEND_STYLE = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: SPACE.lg,
  padding: `${SPACE.sm} ${SPACE.xl}`,
  borderTop: `1px solid ${BORDER.subtle}`,
  background: '#0b1017',
  fontSize: FONT_SIZE.sm,
});

export const LEGEND_HINT_STYLE = css({
  color: TEXT.muted,
});

export const LEGEND_KBD_STYLE = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: SIZE.keycap,
  height: SIZE.keycap,
  padding: `0 ${SPACE.xs}`,
  margin: '0 2px',
  borderRadius: RADIUS.sm,
  border: '1px solid #34485f',
  background: '#111b28',
  color: '#d7e6f8',
  fontSize: FONT_SIZE.xs,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
});

export const LEGEND_POPOVER_WRAP_STYLE = css({
  position: 'relative',
});

export const LEGEND_TRIGGER_STYLE = css({
  ...SMALL_BTN_STYLE,
  borderColor: '#3b5775',
  color: '#d9ebff',
});

export const LEGEND_POPOVER_STYLE = css({
  position: 'absolute',
  right: 0,
  bottom: `calc(100% + ${SPACE.md})`,
  width: `min(${SIZE.popoverMaxWidth}, calc(100vw - ${SPACE.xl} - ${SPACE.xl}))`,
  borderRadius: RADIUS.xl,
  border: '1px solid #36557b',
  background: OVERLAY.popover,
  boxShadow: `0 10px 30px ${OVERLAY.shadowMd}`,
  padding: SPACE.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACE.lg,
  zIndex: 12,
});

export const LEGEND_SECTION_STYLE = css({
  display: 'flex',
  flexDirection: 'column',
  gap: SPACE.sm,
});

export const LEGEND_SECTION_TITLE_STYLE = css({
  fontSize: FONT_SIZE.xs,
  color: '#a9c7e8',
  letterSpacing: '0.25px',
  textTransform: 'uppercase',
  fontWeight: 700,
});

export const LEGEND_ITEM_STYLE = css({
  color: '#d2deec',
  lineHeight: 1.4,
});

export const TITLE_STYLE = css({
  fontWeight: 600,
  letterSpacing: '0.3px',
});

export const FILTER_INPUT_STYLE = css({
  flex: 1,
  minWidth: 0,
  padding: `${SPACE.sm} ${SPACE.lg}`,
  borderRadius: RADIUS.lg,
  border: `1px solid ${BORDER.input}`,
  background: SURFACE.input,
  color: TEXT.primary,
});

export function toolbarFilterInputStyle(compact: boolean): CSSProperties {
  return {
    ...FILTER_INPUT_STYLE,
    flex: compact ? '1 1 100%' : '1 1 300px',
    width: compact ? '100%' : undefined,
  };
}

export const STATS_STYLE = css({
  opacity: 0.88,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const STATS_BADGE_STYLE = css({
  ...STATS_STYLE,
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${SPACE.sm} ${SPACE.lg}`,
  borderRadius: RADIUS.pill,
  border: '1px solid #2a3a4f',
  background: SURFACE.elevated,
  color: '#b6c9e3',
  opacity: 1,
});

type RightPanelStyleOptions = {
  compact: boolean;
  width: number;
};

export function rightPanelStyle({ compact, width }: RightPanelStyleOptions): CSSProperties {
  const panelWidth = `${Math.round(width)}px`;
  const base: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${BORDER.subtle}`,
    background: SURFACE.panel,
    minHeight: 0,
  };

  if (compact) {
    return {
      ...base,
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: panelWidth,
      maxWidth: `calc(100% - ${SPACE.xl})`,
      zIndex: 6,
      boxShadow: `-10px 0 28px ${OVERLAY.shadowMd}`,
    };
  }

  return {
    ...base,
    flex: `0 0 ${panelWidth}`,
    width: panelWidth,
    minWidth: SIZE.detailsPanelMinWidth,
    maxWidth: '60vw',
  };
}

export const RIGHT_PANEL_EMPTY_STYLE = css({
  padding: SPACE.xl,
  fontSize: FONT_SIZE.sm,
  opacity: 0.7,
});

export function tipStyle(compact: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    margin: compact ? SPACE.md : SPACE.xl,
    background: OVERLAY.panel,
    border: `1px solid ${BORDER.default}`,
    boxShadow: compact ? `0 6px 20px ${OVERLAY.shadowMd}` : `0 6px 28px ${OVERLAY.shadowLg}`,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    minHeight: 0,
  };
}

export const TIP_HEADER_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACE.md,
  padding: `${SPACE.md} ${SPACE.lg}`,
  background: OVERLAY.panelHeader,
  borderBottom: '1px solid #2a384b',
  fontSize: FONT_SIZE.sm,
  position: 'sticky',
  top: 0,
  zIndex: 2,
});

export const TIP_TITLE_STYLE = css({
  opacity: 0.85,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const TIP_BTNS_STYLE = css({
  display: 'flex',
  gap: SPACE.sm,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
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
  gap: SPACE.xl,
  lineHeight: 1.5,
});

export const TIP_SECTION_STYLE = css({
  display: 'flex',
  flexDirection: 'column',
  gap: SPACE.md,
  padding: SPACE.lg,
  borderRadius: RADIUS.lg,
  border: '1px solid #2f4156',
  background: OVERLAY.panelSection,
});

export const TIP_SECTION_TITLE_STYLE = css({
  fontSize: FONT_SIZE.xs,
  letterSpacing: '0.25px',
  textTransform: 'uppercase',
  color: '#a8c3e5',
  fontWeight: 700,
});

export const TIP_TREE_STYLE = css({
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: FONT_SIZE.sm,
  lineHeight: 1.4,
});

export const JSON_TREE_LINE_STYLE = css({
  whiteSpace: 'pre',
});

export const JSON_TREE_SUMMARY_STYLE = css({
  cursor: 'pointer',
});

export const JSON_TREE_CHILDREN_STYLE = css({
  paddingLeft: SPACE.xxl,
  borderLeft: `1px solid ${OVERLAY.treeGuide}`,
  marginLeft: SPACE.sm,
});

export function filterBarStyle(compact: boolean): CSSProperties {
  return {
    display: 'flex',
    gap: compact ? SPACE.md : SPACE.xxl,
    padding: `${SPACE.md} ${SPACE.xl}`,
    borderBottom: `1px solid ${BORDER.subtle}`,
    background: SURFACE.panel,
    flexWrap: 'wrap',
    alignItems: 'center',
  };
}

export const FILTER_GROUP_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.md,
  flexWrap: 'wrap',
});

export const FILTER_ROW_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.lg,
  flexWrap: 'wrap',
  width: '100%',
});

export const FILTER_GROUP_LABEL_STYLE = css({
  fontSize: FONT_SIZE.sm,
  opacity: 0.86,
  fontWeight: 600,
});

export const FILTER_CHIP_STYLE = css({
  padding: `${SPACE.sm} ${SPACE.lg}`,
  borderRadius: RADIUS.lg,
  border: `1px solid ${BORDER.input}`,
  background: SURFACE.input,
  color: TEXT.primary,
  cursor: 'pointer',
  fontSize: FONT_SIZE.sm,
});

export const FILTER_CHIP_ACTIVE_STYLE = css({
  background: ACCENT.subtleBg,
  borderColor: ACCENT.primary,
  color: ACCENT.subtleText,
  boxShadow: `0 0 0 1px ${OVERLAY.activeRing}`,
});

export function filterChipStyle(active: boolean): CSSProperties {
  if (!active) return FILTER_CHIP_STYLE;
  return { ...FILTER_CHIP_STYLE, ...FILTER_CHIP_ACTIVE_STYLE };
}

export const FILTER_CHIP_COUNT_STYLE = css({
  marginLeft: SPACE.sm,
  opacity: 0.84,
  fontVariantNumeric: 'tabular-nums',
});

export const ACTIVE_FILTER_CHIP_STYLE = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: SPACE.md,
  padding: `${SPACE.sm} ${SPACE.lg}`,
  borderRadius: RADIUS.pill,
  border: '1px solid #31445c',
  background: SURFACE.chip,
  color: '#d2e2f5',
  fontSize: FONT_SIZE.sm,
});

export const FILTER_CLEAR_BTN_STYLE = css({
  ...SMALL_BTN_STYLE,
  borderColor: '#3d5675',
  color: '#d8e8fb',
});

export const TIP_ROW_STYLE = css({
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.md,
  flexWrap: 'wrap',
});

export const TIP_LABEL_STYLE = css({
  fontSize: FONT_SIZE.sm,
  opacity: 0.82,
  fontWeight: 600,
});

export const TIP_PILL_STYLE = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: SPACE.md,
  padding: `${SPACE.md} ${SPACE.lg}`,
  borderRadius: RADIUS.lg,
  background: OVERLAY.mutedPill,
  fontWeight: 600,
  letterSpacing: '0.2px',
  fontSize: FONT_SIZE.sm,
  width: 'fit-content',
  maxWidth: '100%',
  wordBreak: 'break-word',
});

export const EMPTY_STATE_STYLE = css({
  display: 'flex',
  flexDirection: 'column',
  gap: SPACE.lg,
  padding: SPACE.xl,
});

export const EMPTY_TITLE_STYLE = css({
  fontSize: FONT_SIZE.md,
  fontWeight: 700,
  color: TEXT.strong,
});

export const EMPTY_HINT_STYLE = css({
  fontSize: FONT_SIZE.sm,
  color: '#9eb3ce',
  lineHeight: 1.45,
});
