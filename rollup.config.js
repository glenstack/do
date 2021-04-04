import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import nodeGlobals from 'rollup-plugin-node-globals'
// import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'

export default {
  input: './src/index.ts',
  output: {
    exports: 'named',
    format: 'es',
    file: './dist/index.mjs',
    sourcemap: false,
  },
  treeshake: {},
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.nextTick': undefined,
      setImmediate: undefined,
      process: '({})',
    }),
    nodeResolve({ browser: true , preferBuiltins: false}),
    commonjs({
      transformMixedEsModules: true,
    }),
    json(),
    // nodePolyfills(),
    nodeGlobals(),
    typescript(),
    // dynamicImportVars({ warnOnError: true }),
    terser({
      ecma: 'ESNext',
      output: {
        comments: false,
      },
    }),
  ],
}
