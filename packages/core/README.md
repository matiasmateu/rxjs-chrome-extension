# rxjs-monitor

`rxjs-monitor` sends RxJS stream events to the RxJS DevTools Chrome plugin so you can inspect subscriptions and emissions in the `RxJS` DevTools panel.

## Install

```bash
npm install rxjs-monitor rxjs
```

## Usage

### 1) Install the Chrome plugin

Install the **RxJS DevTools** Chrome plugin first.  
If the plugin is not installed, `monitorRX` will not show any data in DevTools.

### 2) Add `monitorRX` to your stream

```ts
import { interval, take } from 'rxjs';
import { monitorRX } from 'rxjs-monitor';

const stream$ = interval(250).pipe(
  take(5),
  monitorRX({
    domain: 'checkout',
    label: 'Payment Poller',
    tags: ['polling', 'payments'],
    meta: { source: 'web-app' },
  }),
);

stream$.subscribe();
```

### 3) View events

1. Open your app in Chrome.
2. Open Chrome DevTools.
3. Open the `RxJS` panel.
4. Trigger the stream and view `subscribe`, `next`, `error`, `complete`, and `unsubscribe` events.

## `monitorRX` options

- `instanceId`: Custom ID for one monitor instance.  
  Use this when you want a stable identifier across rerenders.
- `observableKey`: Stable observable ID used for grouping in the panel.
- `label`: Display name shown in the panel.
- `domain`: Domain or feature name used for filtering and grouping.
- `tags`: Extra labels used for filtering.
- `meta`: Extra metadata included with each emitted event.
- `serialize`: Custom function to serialize `next` and `error` payloads before they are sent.
- `notify`: Custom transport function to send protocol messages.

## Troubleshooting

If TypeScript reports RxJS type conflicts from multiple `rxjs` installs, ensure a single shared version:

```bash
npm dedupe
npm ls rxjs rxjs-monitor
```
