/* eslint no-console: "off" */
// Storybook 10's esbuild-register no longer supplies a bare `__dirname` when
// transpiling this file (unlike Storybook 8) — omitting it entirely fails
// with "ReferenceError: __dirname is not defined" before any build starts.
// `import.meta.url` is safe to use here, verified empirically against this
// Storybook version: esbuild-register does not inject a require()-based
// polyfill for it the way it does for `createRequire`/actual `require()`
// calls. Do NOT add a `require(...)` or `createRequire(...)` call anywhere
// in this file — THAT is what breaks under `"type": "module"` with
// "ReferenceError: require is not defined". This is why the webpack `path`
// fallback below uses the bare string `'path-browserify'` instead of
// `require.resolve('path-browserify')`.
import { fileURLToPath } from 'node:url';
import path, { resolve, dirname } from 'node:path';
import * as embeddedSass from 'sass-embedded';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProdBuild = process.env.NODE_ENV === 'production';
const ddevHostname = process.env.DDEV_HOSTNAME || process.env.VIRTUAL_HOST;

const storybookConfig = {
  stories: ['../source/**/*.mdx', '../source/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@storybook/react-webpack5',
  },
  typescript: {
    check: false,
  },
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-webpack5-compiler-swc',
  ],
  features: {
    actions: false,
  },
  core: {
    allowedHosts: ddevHostname ? [ddevHostname] : ['.ddev.site'],
  },
  staticDirs: ['../dist'],
  webpackFinal: async (config, { configType }) => {
    // Storybook 8 removes fast-refresh as a framework option and instead
    // requires manual set-up.
    // Adapted from https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#frameworkoptionsfastrefresh-for-webpack5-based-projects-removed
    // and https://github.com/pmmmwh/react-refresh-webpack-plugin?tab=readme-ov-file#usage.
    const swcLoaderRule = config.module.rules.find(
      rule =>
        (rule.loader && rule.loader.toString().includes('swc-loader')) ||
        (rule.use &&
          rule.use.some(
            subRule =>
              subRule.loader && subRule.loader.toString().includes('swc-loader')
          ))
    );
    if (swcLoaderRule) {
      swcLoaderRule.sideEffects = true;
      const swcLoaderConfig =
        swcLoaderRule.loader ||
        swcLoaderRule.use.find(
          subRule =>
            subRule.loader && subRule.loader.toString().includes('swc-loader')
        );
      if (swcLoaderConfig) {
        swcLoaderConfig.options = {
          ...swcLoaderConfig?.options,
          jsc: {
            ...swcLoaderConfig?.options?.jsc,
            transform: {
              ...swcLoaderConfig?.options?.jsc?.transform,
              react: {
                ...swcLoaderConfig?.options?.jsc?.transform?.react,
                development: !isProdBuild,
                refresh: !isProdBuild,
                runtime: 'automatic',
              },
            },
          },
        };
      }
    }

    config.module.rules.push({
      test: /\.twig$/,
      use: [
        {
          loader: '@forumone/twig-loader',
          options: {
            twigOptions: {
              namespaces: {
                global: resolve(__dirname, '../', 'source/01-global'),
                layouts: resolve(__dirname, '../', 'source/02-layouts'),
                components: resolve(__dirname, '../', 'source/03-components'),
                templates: resolve(__dirname, '../', 'source/04-templates'),
                pages: resolve(__dirname, '../', 'source/05-pages'),
              },
            },
          },
        },
      ],
    });

    config.module.rules.push({
      test: /config\.design-tokens\.yml$/,
      exclude: /node_modules/,
      use: [
        'js-yaml-loader',
        path.resolve(__dirname, '../lib/configLoader.cjs'),
      ],
    });

    config.module.rules.push({
      test: /\.ya?ml$/,
      exclude: /config\.design-tokens\.yml$/,
      loader: 'js-yaml-loader',
    });

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            esModule: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: embeddedSass,
            webpackImporter: false,
            sassOptions: {
              loadPaths: [path.resolve(__dirname, '../source')],
              // Kept in sync with webpack.common.js — see the comment there for
              // why this is `if-function` and not upstream's `mixed-decls`.
              silenceDeprecations: ['if-function'],
            },
          },
        },
      ],
    });

    config.externals = {
      drupal: 'Drupal',
      drupalSettings: 'drupalSettings',
      once: 'once',
      jquery: 'jQuery',
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: 'path-browserify',
    };

    config.resolve.modules.push(path.resolve(__dirname, '../source'));
    config.stats = 'errors-warnings';
    // Storybook's iframe bundle is a dev/preview tool, not shipped to site
    // visitors — the default webpack asset/entrypoint size hints don't apply.
    config.performance = { hints: false };

    if (configType === 'DEVELOPMENT') {
      config.plugins.push(function readyToGoPlugin() {
        this.hooks.beforeCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `\n${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: Storybook's webpack beginning compilation.`
          );
        });
        this.hooks.afterCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `\n${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: Storybook's compilation complete. Watching for changes.`
          );
        });
      });
    }

    config.plugins = [
      !isProdBuild &&
        new ReactRefreshWebpackPlugin({
          overlay: {
            sockIntegration: 'whm',
          },
        }),
      ...config.plugins,
    ].filter(Boolean);

    return config;
  },
};

export default storybookConfig;
