import path, { dirname } from 'node:path';
import { Glob } from 'glob';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import RemovePlugin from 'remove-files-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import SpriteLoaderPlugin from 'svg-sprite-loader/plugin.js';
import * as embeddedSass from 'sass-embedded';
import { fileURLToPath } from 'node:url';

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));

async function gatherProjectFiles() {
  const jsFiles = {};
  const scssFiles = {};
  const jsGlob = new Glob('source/**/!(*.stories).{cjs,js,ts}', {
    ignore: ['**/_*', 'source/@types/**', 'source/07-react/**'],
  });
  const scssGlob = new Glob('source/**/*.scss', jsGlob);
  for await (const currentFile of jsGlob.iterate()) {
    const filePaths = currentFile.split(path.sep);
    const sourceDirIndex = filePaths.indexOf('source');
    if (sourceDirIndex >= 0) {
      const fileName = path.basename(currentFile).replace(/\.c?[jt]s$/, '');
      const newFilePath = `js/${fileName}`;
      // Throw an error if duplicate files detected.
      if (jsFiles[newFilePath]) {
        throw new Error(`More than one file named ${fileName}.[jt]s found.`);
      }
      jsFiles[newFilePath] = {
        import: path.resolve(__dirname, currentFile),
      };
    }
  }

  for await (const currentFile of scssGlob.iterate()) {
    const filePaths = currentFile.split(path.sep);
    const sourceDirIndex = filePaths.indexOf('source');
    if (sourceDirIndex >= 0) {
      const fileName = path.basename(currentFile, '.scss');
      const newFilePath = `css/${fileName}`;
      // Throw an error if duplicate files detected.
      if (scssFiles[newFilePath]) {
        throw new Error(`More that one file named ${fileName}.scss found.`);
      }
      scssFiles[newFilePath] = {
        import: `./${currentFile}`,
      };
    }
  }
  return {
    ...jsFiles,
    ...scssFiles,
  };
}

const commonConfig = {
  entry: () => gatherProjectFiles(),
  plugins: [
    new MiniCssExtractPlugin(),
    new RemovePlugin({
      after: {
        test: [
          {
            folder: './dist/css',
            method: absolutePath => /\.js(\.map)?$/m.test(absolutePath),
            recursive: true,
          },
        ],
        log: false,
        logError: true,
        logWarning: false,
      },
    }),
    new StylelintPlugin({
      exclude: ['node_modules', 'dist', 'storybook'],
    }),
    new SpriteLoaderPlugin(),
    new ForkTsCheckerWebpackPlugin(),
  ],
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // We will check types in fork plugin
          transpileOnly: true,
        },
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['swc-loader'],
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.scss$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
            },
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              // Ignore /core/ URLs
              url: {
                filter: url => !url.includes('/core/'),
              },
            },
          },
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: embeddedSass,
              webpackImporter: false,
              sassOptions: {
                loadPaths: [path.resolve(__dirname, 'source')],
                // Upstream Gesso silences `mixed-decls` here. As of Dart Sass
                // 1.103 that deprecation is obsolete — Sass has adopted the new
                // behaviour unconditionally — and silencing it now emits its own
                // "deprecation is obsolete" warning, so it is dropped.
                //
                // `if-function` is silenced instead: Sass now wants
                // `if(sass($cond): $a; else: $b)` in place of `if($cond, $a, $b)`.
                // Upstream 5.4.2 still uses the classic form (see
                // 00-config/functions/_iff.scss and mixins/_grids.scss), so
                // migrating would diverge from upstream and pin us to very new
                // Sass. Revisit when upstream moves.
                // https://sass-lang.com/d/if-function
                silenceDeprecations: ['if-function'],
              },
            },
          },
        ],
      },
      {
        test: /images\/_sprite-source-files\/.*\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
              spriteFilename: 'sprite.artifact.svg',
              outputPath: 'images/',
            },
          },
          'svg-transform-loader',
          // DEVIATION (2.7): explicit SVGO config so v3's default preset cannot
          // strip viewBox from sprite symbols.
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      {
        test: /fonts\/.*\.(woff2?|ttf|otf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/i,
        exclude: ['/node_modules/'],
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
      },
      {
        test: /\.(png|svg|jpg|gif|webp)$/i,
        exclude: [/images\/_sprite-source-files\/.*\.svg$/, '/node_modules/'],
        type: 'asset',
        generator: {
          filename: 'images/backgrounds/[hash][ext][query]',
        },
      },
    ],
  },
  externals: {
    // DEVIATION: jquery retained — used by dropbutton.es6.js and
    // addtocal-a11y.es6.js. Upstream removed this entry.
    jquery: 'jQuery',
    drupal: 'Drupal',
    drupalSettings: 'drupalSettings',
    once: 'once',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    extensionAlias: {
      '.es6': ['.es6.ts', '.es6.js'],
    },
    modules: [path.resolve(__dirname, 'source'), 'node_modules'],
    enforceExtension: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: false,
  },
  stats: 'minimal',
};

export default commonConfig;
