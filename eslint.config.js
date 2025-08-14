import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Disable prop-types for now to reduce noise
      'react/prop-types': 'off',
      // Allow unused variables in development
      'no-unused-vars': 'warn',
      // Allow unescaped entities
      'react/no-unescaped-entities': 'off',
      // Allow unknown properties (for custom CSS classes)
      'react/no-unknown-property': 'off',
      // Allow global in test files
      'no-undef': 'warn',
      // Allow unreachable code for now
      'no-unreachable': 'warn',
      // Allow empty blocks for now
      'no-empty': 'warn',
    },
  },
  // Special configuration for test files
  {
    files: ['**/test/**/*.{js,jsx}', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        global: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // Special configuration for config files
  {
    files: ['**/*.config.{js,jsx}', 'tailwind.config.js', 'vite.config.js', 'vitest.config.js', 'lighthouserc.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-mixed-spaces-and-tabs': 'off',
    },
  },
  // Special configuration for backend files
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', 'utils/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'warn',
    },
  },
]
