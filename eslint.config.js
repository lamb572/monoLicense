import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.js'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      functional,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Functional programming rules (per constitution)
      'functional/no-classes': 'error',
      'functional/no-this-expressions': 'error',
      'functional/immutable-data': 'warn',
      'functional/no-let': 'warn',
      'functional/prefer-readonly-type': 'warn',

      // Import rules (per constitution)
      'import/no-cycle': 'error',
      'import/no-default-export': 'error',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',

      // Disable base rules that conflict with TypeScript
      'no-unused-vars': 'off',
    },
  },
  {
    // Relax rules for test files
    files: ['**/*.test.ts', '**/tests/**/*.ts'],
    rules: {
      'functional/immutable-data': 'off',
      'functional/no-let': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Relax rules for CLI apps (need mutation for building results)
    files: ['**/apps/cli/**/*.ts'],
    rules: {
      'functional/immutable-data': 'warn',
      'functional/no-let': 'warn',
      'no-console': 'off',
    },
  },
  {
    // Config files typically use default exports (framework requirement)
    files: ['**/vitest.config.ts', '**/eslint.config.js'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
