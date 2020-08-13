module.exports = {
  // Stop ESLint from looking for a configuration file in parent folders
  root: true,

  //extends: 'react-app',
  plugins: ['@typescript-eslint', 'prettier'],

  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module" // Allows for the use of imports
  },

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      // use <root>/tsconfig.json
      typescript: {}
    }
  },

  rules: {
    'jsx-a11y/href-no-hash': 'off',
    //'no-unused-vars': 'off',
    'no-empty-pattern': 'off',
    'prefer-const': ['warn'],
    '@typescript-eslint/no-unused-expressions': 'off',
    ' @typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/type-annotation-spacing': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    /*
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_' // ignore unused variables whose name is '_'
      }
    ]
     */
  }
}
