import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: {
    panel: 'src/panel.tsx',
    background: 'src/entries/background.ts',
    contentScript: 'src/entries/contentScript.ts',
    injectedHook: 'src/entries/injectedHook.ts',
    devtools: 'src/entries/devtools.ts',
  },
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  jsx: 'automatic',
});

if (watch) {
  await ctx.watch();
  console.log('esbuild: watching for changes');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
