import {
  EMPTY_HINT_STYLE,
  EMPTY_STATE_STYLE,
  EMPTY_TITLE_STYLE,
  SMALL_BTN_STYLE,
  TIP_BTNS_STYLE,
  TIP_CONTENT_STYLE,
  TIP_HEADER_STYLE,
  TIP_LABEL_STYLE,
  TIP_PILL_STYLE,
  TIP_ROW_STYLE,
  TIP_SCROLL_STYLE,
  TIP_SECTION_STYLE,
  TIP_SECTION_TITLE_STYLE,
  TIP_TITLE_STYLE,
  rightPanelStyle,
  tipStyle,
} from './styles';
import type { TooltipPanelProps } from './types';
import JsonTree from './JsonTree';

export function TooltipPanel({
  tooltipState,
  messageInfo,
  copyLabel,
  compact,
  width,
  onCopy,
  onDownload,
  onPin,
  onClose,
  pinnedId,
}: TooltipPanelProps) {
  const tooltipTitle = tooltipState.visible
    ? tooltipState.title || 'Event details'
    : 'Event details';
  const hasMessage = tooltipState.visible && tooltipState.message;
  const hasOperatorDetails = Boolean(
    messageInfo?.operator || (messageInfo?.tags && messageInfo.tags.length),
  );

  const renderRow = (label: string, value: string | null | undefined) => {
    if (!value) return null;
    return (
      <div style={TIP_ROW_STYLE}>
        <span style={TIP_LABEL_STYLE}>{label}:</span>
        <span style={TIP_PILL_STYLE}>{value}</span>
      </div>
    );
  };

  return (
    <div style={rightPanelStyle({ compact, width })}>
      <div style={tipStyle(compact)}>
        <div style={TIP_HEADER_STYLE}>
          <div style={TIP_TITLE_STYLE}>{tooltipTitle}</div>
          <div style={TIP_BTNS_STYLE} role="group" aria-label="Event actions">
            <button
              type="button"
              style={SMALL_BTN_STYLE}
              onClick={onCopy}
              disabled={!tooltipState.visible || !tooltipState.message}
              aria-label="Copy event JSON"
            >
              {copyLabel}
            </button>
            <button
              type="button"
              style={SMALL_BTN_STYLE}
              onClick={onDownload}
              disabled={!tooltipState.visible || !tooltipState.message}
              aria-label="Download event JSON"
            >
              Download
            </button>
            <button
              type="button"
              style={SMALL_BTN_STYLE}
              onClick={onPin}
              disabled={!tooltipState.visible || (!tooltipState.canPin && pinnedId == null)}
              aria-label={pinnedId != null ? 'Unpin selected event' : 'Pin selected event'}
            >
              {pinnedId != null ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              style={SMALL_BTN_STYLE}
              onClick={onClose}
              disabled={!tooltipState.visible}
              aria-label="Close event details"
            >
              Close
            </button>
          </div>
        </div>
        <div style={TIP_SCROLL_STYLE} role="region" aria-label="Event details content">
          {hasMessage ? (
            <div style={TIP_CONTENT_STYLE}>
              <div style={TIP_SECTION_STYLE}>
                <div style={TIP_SECTION_TITLE_STYLE}>Identity</div>
                {renderRow('Domain', messageInfo?.domainLabel || 'Unknown domain')}
                {renderRow('Label', messageInfo?.label || 'Unknown label')}
                {renderRow('Kind', messageInfo?.kindLabel || 'Unknown kind')}
                {renderRow('Observable', messageInfo?.observableId || 'Unknown observable')}
                {renderRow('Instance', messageInfo?.instanceId)}
                {renderRow('Subscription', messageInfo?.subscriptionId)}
              </div>

              <div style={TIP_SECTION_STYLE}>
                <div style={TIP_SECTION_TITLE_STYLE}>Timing</div>
                {renderRow('Time', messageInfo?.timeLabel || 'Unknown time')}
              </div>

              {hasOperatorDetails ? (
                <div style={TIP_SECTION_STYLE}>
                  <div style={TIP_SECTION_TITLE_STYLE}>Operator</div>
                  {renderRow('Operator', messageInfo?.operator)}
                  {messageInfo?.tags && messageInfo.tags.length ? (
                    <div style={TIP_ROW_STYLE}>
                      <span style={TIP_LABEL_STYLE}>Tags:</span>
                      <span style={TIP_PILL_STYLE}>{messageInfo.tags.join(', ')}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={TIP_SECTION_STYLE}>
                <div style={TIP_SECTION_TITLE_STYLE}>Payload</div>
                {messageInfo &&
                messageInfo.dataPayload !== null &&
                messageInfo.dataPayload !== undefined ? (
                  <JsonTree data={messageInfo.dataPayload} />
                ) : (
                  <span style={TIP_PILL_STYLE}>None</span>
                )}
              </div>
            </div>
          ) : (
            <div style={EMPTY_STATE_STYLE} role="status" aria-live="polite">
              <div style={EMPTY_TITLE_STYLE}>No event selected</div>
              <div style={EMPTY_HINT_STYLE}>
                Hover a marble to inspect event details. Click a marble to pin it while exploring
                the timeline.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
