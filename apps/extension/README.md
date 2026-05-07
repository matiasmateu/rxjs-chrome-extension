# @rxjs-devtools/extension

Chrome extension app for RxJS event visualization in DevTools.

## Build

- `pnpm --filter @rxjs-devtools/extension build`

The extension manifest references compiled scripts in `dist/`, so run a build before loading
the unpacked extension in Chrome.
