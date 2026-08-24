import { defineConfig, globalIgnores } from 'eslint/config';
import f1BaseConfig from '@forumone/eslint-config-es5';
import f1ReactConfig from '@forumone/eslint-config-react';

const config = defineConfig([
  globalIgnores([
    // Generated design-token artifact (gitignored).
    '**/_GESSO.es6.js',
    // Verbatim vendored copy of @drupal/once.
    '.storybook/stubs/once.js',
    // Build output. ESLint 9's flat config only ignores node_modules by default,
    // so without these an unscoped `eslint .` walks the compiled bundles.
    'dist/**',
    'storybook/**',
  ]),
  f1BaseConfig,
  {
    // A bare `*.jsx` in flat config only matches files in the repo root, so the
    // React config never reached source/**. Every .jsx in this theme lives
    // under source/, and several already carry inline `eslint-disable react/…`
    // comments that error out as "rule not found" with the plugin unloaded.
    files: ['**/*.tsx', '**/*.jsx'],
    extends: [f1ReactConfig],
  },
  {
    files: ['**/*.tsx', '**/*.jsx'],
    // Without this eslint-plugin-react prints "React version not specified" on
    // every run.
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Storybook 8 compiles stories with the automatic JSX runtime, so `React`
      // does not have to be in scope; three story files already rely on that.
      'react/react-in-jsx-scope': 'off',
      // React 19 removed PropTypes from the React package, and the .jsx files
      // here are Storybook CSF fixtures and wrappers rather than shipped
      // components, so there is no prop contract to declare.
      'react/prop-types': 'off',
      // Story fixtures are English prose. Rewriting every apostrophe in the
      // copy as `&apos;` would obfuscate the fixture text for no difference in
      // what Storybook renders.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['source/**/*.stories.jsx'],
    rules: {
      // Several components are deliberately hidden from the Storybook sidebar
      // by commenting out their `export { … }` (and sometimes the whole story)
      // while keeping the definition in place: see block, details, media,
      // progress, tagline, mega-menu and others. That leaves a story file with
      // only `export default {}` plus an unreferenced story const, which trips
      // both of these rules.
      'storybook/story-exports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Shims adapted from third-party sources (emulsify-drupal) that stand in
    // for Drupal core globals in Storybook. `.storybook/stubs/once.js` is
    // ignored outright above for the same reason; these keep enough of the
    // upstream shape (an IIFE taking `Drupal`, `Drupal.attachBehaviors`
    // defaulting its own arguments) that reshaping them to satisfy the rules
    // would mean diverging from upstream for no benefit.
    files: ['.storybook/stubs/**'],
    rules: {
      'no-shadow': 'off',
      'no-param-reassign': 'off',
    },
  },
  {
    // allow require() in webpack config files, which use CommonJS,
    // and in lib files, which are used by Node.js.
    // The `.cjs` extension is what marks these files as CommonJS given the
    // package is `"type": "module"`, so it has to be in the glob — and the rule
    // is `no-require-imports`: typescript-eslint 8 dropped `no-var-requires`.
    // `.storybook/main.cjs` is here for the same reason — Storybook loads it via
    // esbuild-register, which needs genuine CommonJS (see the header comment in
    // that file).
    files: ['webpack.*.js', 'lib/**/*.{js,cjs,ts}', '.storybook/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      // Keep destructuring required for declarations but not for plain
      // assignments: `({ target } = event)` reads worse than
      // `target = event.target`, and it cannot be used at all where only one
      // branch of a conditional assigns from the object
      // (accordion.es6.js, lib/stylelintLVHFA.js).
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
    },
  },
]);

export default config;
