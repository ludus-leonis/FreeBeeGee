import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

import eslintStandardJs from './eslint.config-standardjs.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [{
  ignores: []
}, ...fixupConfigRules(compat.extends('plugin:jsdoc/recommended', 'plugin:import/recommended')), {
  plugins: {
    ...eslintStandardJs[0].plugins,
    _jsdoc: fixupPluginRules(jsdoc)
  },

  languageOptions: {
    globals: {
      ...globals.browser
    },

    ecmaVersion: 'latest',
    sourceType: 'module',

    parserOptions: {
      allowImportExportEverywhere: true
    }
  },

  settings: {
    'import/extensions': ['.js', '.mjs']
  },

  rules: {
    ...eslintStandardJs[0].rules,
    'import/named': 2,
    'import/no-named-as-default-member': 2,
    'import/no-self-import': 2,
    'jsdoc/no-multi-asterisks': 2,
    'jsdoc/no-undefined-types': 2,

    'jsdoc/tag-lines': [2, 'any', {
      startLines: 1
    }],

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
}]
