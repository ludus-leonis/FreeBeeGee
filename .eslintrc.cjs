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
    'plugin:jsdoc/recommended',
    'plugin:import/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowImportExportEverywhere: true
  },
  ignorePatterns: [
  ],
  rules: {
    'import/named': 2,
    // 'import/no-unused-modules': [2, { unusedExports: true }],
    // no default exports
    'import/no-named-as-default-member': 2,
    'import/no-self-import': 2,
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
  },
  settings: {
    'import/extensions': [
      '.js',
      '.mjs'
    ]
  }
}
