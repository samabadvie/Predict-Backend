module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/docs/rules
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'lines-between-class-members': ['error', 'always'],
    'lines-around-comment': ['error', {
      'beforeBlockComment': false,
      'afterBlockComment': true
    }],
    'no-return-await': 'off',
    '@typescript-eslint/return-await': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      'caughtErrors': 'none',
      'args': 'none'
    }],
    'no-unneeded-ternary': ['error', { 'defaultAssignment': false }],
    'no-await-in-loop': 'error',
  },
};

