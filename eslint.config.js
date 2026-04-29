import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import pluginVitest from 'eslint-plugin-vitest';

export default tseslint.config(
  // Files to never lint
  { ignores: ['dist/', 'node_modules/', 'vite.config.ts', 'eslint.config.js'] },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript strict rules with full type-checking
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Config for all source files
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow console.error and console.warn, but not console.log in production
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // Non-null assertions should be avoided — use optional chaining instead
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Disabled: conflicts with no-non-null-assertion (both can't be satisfied simultaneously)
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Prefer const assertions and readonly
      '@typescript-eslint/prefer-readonly': 'error',

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // No unused variables (including type parameters)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Promises must be handled
      '@typescript-eslint/no-floating-promises': 'error',

      // Prefer nullish coalescing over logical OR for defaults
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Numbers in template literals are always safe — no need for String() wrapping
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
    },
  },

  // Relaxed rules for test files
  {
    files: ['src/__tests__/**/*.ts'],
    plugins: { vitest: pluginVitest },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      // Type assertions are common in tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // console.log is fine in tests
      'no-console': 'off',
    },
  },
);
