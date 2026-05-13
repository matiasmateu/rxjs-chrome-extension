import { execFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { build } from 'esbuild';

const execFileAsync = promisify(execFile);

const rootDir = resolve(import.meta.dirname, '..');
const distDir = resolve(rootDir, 'dist');

const entryPoints = ['src/index.ts', 'src/protocol.ts', 'src/monitor-rx.ts'];

const sharedOptions = {
  entryPoints,
  bundle: true,
  external: ['rxjs'],
  minify: true,
  platform: 'neutral',
  sourcemap: false,
  target: ['es2020'],
  treeShaking: true,
};

await rm(distDir, { recursive: true, force: true });

await build({
  ...sharedOptions,
  format: 'esm',
  outdir: resolve(rootDir, 'dist/esm'),
});

await build({
  ...sharedOptions,
  format: 'cjs',
  outdir: resolve(rootDir, 'dist/cjs'),
  outExtension: { '.js': '.cjs' },
});

await execFileAsync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], {
  cwd: rootDir,
});
