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
    'prefer-rest-params': "off", /* TODO: Should be warn */
    // old "@typescript-eslint/ban-ts-ignore": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/type-annotation-spacing': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'error',
    //'@typescript-eslint/camelcase': 'warn',
    "@typescript-eslint/no-var-requires": 'warn',
    // note you must disable the base rule as it can report incorrect errors
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["off"],
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
    'no-constant-condition': ["error", { "checkLoops": false }]
  }
}
