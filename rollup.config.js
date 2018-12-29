import rollupBabel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps';
import browserifyPlugin from 'rollup-plugin-browserify-transform';
import nodeResolver from 'rollup-plugin-node-builtins';
import nodeGlobals from 'rollup-plugin-node-globals';

const commonJsResolver = commonjs({
  // non-CommonJS modules will be ignored, but you can also
  // specifically include/exclude files
  include: 'node_modules/**', // Default: undefined
  // these values can also be regular expressions
  // include: /node_modules/

  // if true then uses of `global` won't be dealt with by this plugin
  ignoreGlobal: true, // Default: false

  // if false then skip sourceMap generation for CommonJS modules
  sourceMap: true, // Default: true
});


const sharedPlugins = [
  rollupBabel({
    babelrc: false,
    presets: [
      ['@babel/env', { modules: false }],
      '@babel/flow',
    ],
    exclude: 'node_modules/**',
    plugins: ['@babel/plugin-proposal-class-properties'],
  }),
  commonJsResolver,
  nodeGlobals(),
  nodeResolver(),
  browserifyPlugin,
];


const shared = {
  input: 'lib/png.js',
  external: [],
};

export default [
  {
    ...shared,
    output: {
      name: 'pngjs3',
      file:
        process.env.NODE_ENV === 'production' ?
          './dist/pngjs3.umd.min.js' :
          './dist/pngjs3.umd.js',
      format: 'umd',
      exports: 'named',
      sourcemap: process.env.NODE_ENV !== 'production',
    },
    plugins: [
      ...sharedPlugins,
      process.env.NODE_ENV === 'production' && filesize(),
      process.env.NODE_ENV === 'production' &&
          terser({
            output: { comments: false },
            compress: {
              keep_infinity: true, // eslint-disable-line camelcase
              pure_getters: true, // eslint-disable-line camelcase
            },
            warnings: true,
            ecma: 6,
            toplevel: false,
          }),
    ],
  },
  {
    ...shared,
    output: [
      {
        file: 'dist/pngjs3.es6.js',
        format: 'es',
        exports: 'named',
        sourcemap: true,
      },
      {
        file: 'dist/pngjs3.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
    ],
    plugins: [
      ...sharedPlugins,
      sourceMaps(),
      process.env.NODE_ENV === 'production' && filesize(),
    ],
  },
];
