'use strict';

module.exports = [
  {
    files: ['site/**/*.js'],
    ignores: ['site/vendor/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        Blob: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        URL: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      semi: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
];
