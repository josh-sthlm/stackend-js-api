//@flow
import nodeResolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
//import replace from '@rollup/plugin-replace'
import typescript from 'rollup-plugin-typescript2'
//import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import multiInput from 'rollup-plugin-multi-input';

const NAME = "stackend";
import pkg from './package.json'

const extensions = ['.ts']
const noDeclarationFiles = { compilerOptions: { declaration: false } }

const babelRuntimeVersion = pkg.dependencies['@babel/runtime'].replace(
  /^[^0-9]*/,
  ''
)

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return (id) => pattern.test(id)
}

export default [
  // CommonJS
  /*
  {
    input: 'src/api.ts',
    output: { file: 'lib/api.ts', format: 'cjs', indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      commonjs(),
      json(),
      typescript({ useTsconfigDeclarationDir: true }),
      babel({
        extensions,
        plugins: [
          ['@babel/plugin-transform-runtime', { version: babelRuntimeVersion }],
        ],
        runtimeHelpers: true,
      }),
    ],
  },
  */
  // ES
  {
    input: ['src/**/*.ts'],
    output: {  format: 'es', indent: false, preserveModules: true, dir: 'es' },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      commonjs(),
      json(),
      multiInput(),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            { version: babelRuntimeVersion, useESModules: true },
          ],
        ],
        runtimeHelpers: true,
      }),
    ],
  }
]
