import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

import js from '@eslint/js'

export default defineConfig([
  // ─── Ignore generated dirs ──────────────────────────────────────────────────
  globalIgnores(['dist', 'node_modules', 'build', 'public']),

  // ─── Base rules for all JS/JSX files ────────────────────────────────────────
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ── Code quality ──────────────────────────────────────────────────────
      // WARN on unused vars (not error) — existing code has many; tighten later
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',

      // Fast refresh — warn only (existing non-component exports)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // React hooks — keep as warn (many existing violations to fix incrementally)
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error', // this one stays error — always
      // react-hooks v7 new rules — warn only during migration of existing code
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',

      // ── Import sorting ────────────────────────────────────────────────────
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            // React first
            ['^react', '^react-dom'],
            // External packages (MUI, hookform, axios, i18next, zod, recharts, others)
            ['^@mui', '^@hookform', '^react-', '^axios', '^i18next', '^zod', '^recharts', '^\\w'],
            // Internal absolute paths
            ['^(contexts|components|features|layouts|pages|routes|services|utils|theme|i18n)(/|$)'],
            // Relative: parent first, then sibling
            ['^\\.\\./'],
            ['^\\./'],
            // Style imports last
            ['\\.css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',
    },
  },

  // ─── Architecture guard: forbid direct axios in components/pages ─────────
  // This is ERROR — new code must not violate this
  {
    files: ['src/components/**/*.{js,jsx}', 'src/pages/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                '[ATLS Architecture] Do not import axios in components/pages. ' +
                'Use src/features/<module>/services.js instead.',
            },
          ],
        },
      ],
    },
  },

  // ─── Service/hook files — allowed to use axios ───────────────────────────
  {
    files: ['src/features/**/*.{js,jsx}', 'src/services/**/*.{js,jsx}', 'src/utils/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])
