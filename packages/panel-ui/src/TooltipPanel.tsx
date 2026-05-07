import {
  RIGHT_PANEL_EMPTY_STYLE,
  RIGHT_PANEL_STYLE,
  SMALL_BTN_STYLE,
  TIP_BTNS_STYLE,
  TIP_CONTENT_STYLE,
  TIP_HEADER_STYLE,
  TIP_LABEL_STYLE,
  TIP_PILL_STYLE,
  TIP_ROW_STYLE,
  TIP_SCROLL_STYLE,
  TIP_STYLE,
  TIP_TITLE_STYLE,
} from './styles';
import type { TooltipPanelProps } from './types';
import JsonTree from './JsonTree';

export function TooltipPanel({
  tooltipState,
  messageInfo,
  copyLabel,
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

  return (
    <div style={RIGHT_PANEL_STYLE}>
      <div style={TIP_STYLE}>
        <div style={TIP_HEADER_STYLE}>
          <div style={TIP_TITLE_STYLE}>{tooltipTitle}</div>
          <div style={TIP_BTNS_STYLE}>
            <button
              style={SMALL_BTN_STYLE}
              onClick={onCopy}
              disabled={!tooltipState.visible || !tooltipState.message}
            >
              {copyLabel}
            </button>
            <button
              style={SMALL_BTN_STYLE}
              onClick={onDownload}
              disabled={!tooltipState.visible || !tooltipState.message}
            >
              Download
            </button>
            <button
              style={SMALL_BTN_STYLE}
              onClick={onPin}
              disabled={!tooltipState.visible || (!tooltipState.canPin && pinnedId == null)}
            >
              {pinnedId != null ? 'Unpin' : 'Pin'}
            </button>
            <button style={SMALL_BTN_STYLE} onClick={onClose} disabled={!tooltipState.visible}>
              Close
            </button>
          </div>
        </div>
        <div style={TIP_SCROLL_STYLE}>
          {hasMessage ? (
            <div style={TIP_CONTENT_STYLE}>
              <div style={TIP_ROW_STYLE}>
                <span style={TIP_LABEL_STYLE}>Domain:</span>
                <span style={TIP_PILL_STYLE}>{messageInfo?.domainLabel || 'Unknown domain'}</span>
              </div>
              <div style={TIP_ROW_STYLE}>
                <span style={TIP_LABEL_STYLE}>Label:</span>
                <span style={TIP_PILL_STYLE}>{messageInfo?.label || 'Unknown label'}</span>
              </div>
              <div style={TIP_ROW_STYLE}>
                <span style={TIP_LABEL_STYLE}>Kind:</span>
                <span style={TIP_PILL_STYLE}>{messageInfo?.kindLabel || 'Unknown kind'}</span>
              </div>
              <div style={TIP_ROW_STYLE}>
                <span style={TIP_LABEL_STYLE}>Observable:</span>
                <span style={TIP_PILL_STYLE}>
                  {messageInfo?.observableId || 'Unknown observable'}
                </span>
              </div>
              {messageInfo?.instanceId ? (
                <div style={TIP_ROW_STYLE}>
                  <span style={TIP_LABEL_STYLE}>Instance:</span>
                  <span style={TIP_PILL_STYLE}>{messageInfo.instanceId}</span>
                </div>
              ) : null}
              {messageInfo?.subscriptionId ? (
                <div style={TIP_ROW_STYLE}>
                  <span style={TIP_LABEL_STYLE}>Subscription:</span>
                  <span style={TIP_PILL_STYLE}>{messageInfo.subscriptionId}</span>
                </div>
              ) : null}
              {messageInfo?.operator ? (
                <div style={TIP_ROW_STYLE}>
                  <span style={TIP_LABEL_STYLE}>Operator:</span>
                  <span style={TIP_PILL_STYLE}>{messageInfo.operator}</span>
                </div>
              ) : null}
              {messageInfo?.tags && messageInfo.tags.length ? (
                <div style={TIP_ROW_STYLE}>
                  <span style={TIP_LABEL_STYLE}>Tags:</span>
                  <span style={TIP_PILL_STYLE}>{messageInfo.tags.join(', ')}</span>
                </div>
              ) : null}
              <div style={TIP_ROW_STYLE}>
                <span style={TIP_LABEL_STYLE}>Time:</span>
                <span style={TIP_PILL_STYLE}>{messageInfo?.timeLabel || 'Unknown time'}</span>
              </div>
              <div>
                <div style={TIP_LABEL_STYLE}>Data payload:</div>
                {messageInfo &&
                messageInfo.dataPayload !== null &&
                messageInfo.dataPayload !== undefined ? (
                  <div style={{ marginTop: '4px' }}>
                    <JsonTree data={messageInfo.dataPayload} />
                  </div>
                ) : (
                  <div style={TIP_LABEL_STYLE}>None</div>
                )}
              </div>
            </div>
          ) : (
            <div style={RIGHT_PANEL_EMPTY_STYLE}>Hover a marble to see details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
