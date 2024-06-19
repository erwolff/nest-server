module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'dprint-integration'
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:dprint-integration/recommended',
    'plugin:dprint-integration/disable-conflict'
  ],
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: [
    '.eslintrc.js'
  ],
  rules: {
    'dprint-integration/dprint': [
      'warn',
      {
        lineWidth: 120
      },
      {
        typescript: {
          'indentWidth': 2,
          'quoteStyle': 'preferSingle',
          'singleBodyPosition': 'maintain',
          'bracePosition': 'maintain',
          'useBraces': 'maintain',
          'preferSingleLine': false,
          'memberExpression.linePerExpression': false,
          'binaryExpression.linePerExpression': false,
          'trailingCommas': 'never',
          'arrowFunction.useParentheses': 'preferNone'
        }
      }
    ],
    'arrow-parens': ['warn', 'as-needed'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn']
  }
};
