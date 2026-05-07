export type RxDevtoolsEventKind =
  | 'subscribe'
  | 'next'
  | 'error'
  | 'complete'
  | 'unsubscribe'
  | 'create';

export type RxDevtoolsSource = {
  label?: string;
  domain?: string;
  operator?: string;
  tags?: string[];
};

export type RxDevtoolsMessage = {
  kind: RxDevtoolsEventKind;
  observableId: string;
  instanceId: string;
  subscriptionId: string;
  ts: number;
  meta?: Record<string, unknown>;
  data?: unknown;
  source?: RxDevtoolsSource;
};

export type RxDevtoolsEvent = RxDevtoolsMessage;

export const RXJS_DEVTOOLS_FROM = 'RXJS_HOOK' as const;

export function isRxDevtoolsEvent(value: unknown): value is RxDevtoolsEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<RxDevtoolsEvent>;
  return (
    typeof candidate.kind === 'string' &&
    typeof candidate.observableId === 'string' &&
    typeof candidate.instanceId === 'string' &&
    typeof candidate.subscriptionId === 'string' &&
    typeof candidate.ts === 'number' &&
    Number.isFinite(candidate.ts)
  );
}
