import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/panel.tsx'],
  outfile: 'dist/panel.js',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['../vendor/react.esm.js', '../vendor/react-dom.esm.js'],
});

if (watch) {
  await ctx.watch();
  console.log('esbuild: watching for changes');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
