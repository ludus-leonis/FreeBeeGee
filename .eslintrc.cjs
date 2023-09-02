module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  plugins: [
    'jsdoc'
  ],
  extends: [
    'standard',
    'plugin:jsdoc/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: [
    'test/**/*'
  ],
  rules: {
    'jsdoc/no-multi-asterisks': 2,
    'jsdoc/no-undefined-types': 2,
    'jsdoc/tag-lines': [2, 'any', { startLines: 1 }],
    'jsdoc/require-jsdoc': 2,
    'jsdoc/require-param': 2,
    'jsdoc/require-param-description': 2,
    'jsdoc/require-param-name': 2,
    'jsdoc/require-param-type': 2,
    'jsdoc/require-property': 2,
    'jsdoc/require-property-description': 2,
    'jsdoc/require-property-name': 2,
    'jsdoc/require-property-type': 2,
    'jsdoc/require-returns': 2,
    'jsdoc/require-returns-check': 2,
    'jsdoc/require-returns-description': 2,
    'jsdoc/require-returns-type': 2,
    'jsdoc/require-throws': 2,
    'jsdoc/require-yields': 2,
    'jsdoc/require-yields-check': 2
  }
}
