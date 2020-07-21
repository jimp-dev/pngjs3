import rollupBabel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps';
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
    presets: [['@babel/env', { modules: false }], '@babel/flow'],
    exclude: 'node_modules/**',
    plugins: ['@babel/plugin-proposal-class-properties'],
  }),
  nodeGlobals(),
  nodeResolver({ browser: true }),
  commonJsResolver,
];

const shared = {
  input: 'lib/index.js',
  external: ['immer', 'browserify-zlib'],
};

const sharedModuleOutput = {
  exports: 'named',
  sourcemap: true,
  globals: {
    immer: 'immer',
    'browserify-zlib': 'zlib',
  },
};

const production = process.env.NODE_ENV !== 'production';

export default [
  {
    ...shared,
    output: {
      name: 'pngjs3',
      file: production ? './dist/pngjs3.umd.min.js' : './dist/pngjs3.umd.js',
      format: 'umd',
      exports: 'named',
      sourcemap: production,
      globals: {
        immer: 'immer',
        'browserify-zlib': 'zlib',
      },
    },
    plugins: [
      ...sharedPlugins,
      production && filesize(),
      production &&
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
        ...sharedModuleOutput,
      },
      {
        file: 'dist/pngjs3.js',
        format: 'cjs',
        ...sharedModuleOutput,
      },
    ],
    plugins: [...sharedPlugins, sourceMaps(), production && filesize()],
  },
];
