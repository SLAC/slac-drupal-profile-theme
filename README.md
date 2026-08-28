# SLAC Drupal Profile Theme

`slac` is the Drupal front-end theme for SLAC National Accelerator Laboratory
websites. It is derived from [Gesso](https://github.com/forumone/gesso), a
[Sass](http://sass-lang.com/)-based starter theme that outputs accessible HTML5
markup. It uses a mobile-first responsive approach and leverages
[SMACSS](https://smacss.com/) to organize styles. This encourages a
component-based approach to theming through the creation of discrete, reusable
UI elements. The theme is heavily integrated with
[Storybook](https://storybook.js.org/) and the [Component
Libraries](https://www.drupal.org/project/components) module, allowing Drupal
and Storybook to share the same markup.

The theme is distributed as a Composer package
(`slac/slac-drupal-profile-theme`, type `drupal-theme`) rather than being copied
into a site's `web/themes/custom/` directory. See
[Installation](#installation) below.

This theme currently tracks **Gesso 5.4.6**. Component markup, design tokens and
styles have diverged substantially from upstream and are intentionally not kept
in sync; see [Relationship to upstream
Gesso](#relationship-to-upstream-gesso).

To submit bug reports or feature requests for this theme, use this repository's
issue queue. For upstream Gesso itself, see the [Gesso Drupal project
page](https://drupal.org/project/gesso/), the [Gesso GitHub
repo](https://github.com/forumone/gesso), and the [Gesso Storybook demo
site](https://forumone.github.io/gesso/).

## Global prerequisites

The following packages need to be installed on your system in order to compile
and use this theme.

-   [Node](https://nodejs.org/en/) version 24, as pinned in `.nvmrc`. Long-term
    stable recommended.

-   [npm](https://www.npmjs.com/get-npm) version 10.7.0 or greater.

## Installation

This theme is published as a Composer package through the SLAC Satis
repository. It is **not** meant to be copied into `web/themes/custom/`; releases
are built by CI and consumed by Composer.

1.  Make sure the SLAC Satis repository is configured in your site's
    `composer.json`, then require the theme:

    ```shell
    composer require slac/slac-drupal-profile-theme
    ```

    Because `composer.json` declares `"type": "drupal-theme"`, your site's
    Composer installer paths will place it in the appropriate themes directory
    as `slac`.

2.  Enable the theme, then set it as the default theme on the Appearance admin
    page:

    ```shell
    drush theme:enable slac
    ```

3.  Enable the SLAC Helper (`slac_helper`) module. Unlike upstream Gesso, this
    module is **not** bundled in this repository — it is a separate package that
    must be required and installed on its own. It is listed in `slac.info.yml`
    `dependencies`, so it must be present for the theme to function.
    `slac_helper` provides the theme's PHP-side Twig filters, including
    `unique_id`.

4.  Install the [Component Libraries](https://www.drupal.org/project/components)
    module. Since many of the Drupal templates reference twig files inside
    Storybook using Twig namespaces, this module is required for the theme to
    function. It is listed in `slac.info.yml` `dependencies`.

5.  Install the [Twig Tweak](https://www.drupal.org/project/twig_tweak) module.
    It is also listed in `slac.info.yml` `dependencies`.

6.  Optional: Install the [Twig Field
    Value](https://www.drupal.org/project/twig_field_value) module. This is not
    required, but it can make working with Twig templates easier. Please note,
    however, that using the `|field_value` Twig filter from this module will
    break Drupal’s QuickEdit functionality.

7.  Optional: Install the [Background Images
    Formatter](https://www.drupal.org/project/bg_image_formatter) module and its
    Responsive Background Images Formatter submodule. This is not required, but
    it will allow you to use images uploaded to Drupal as background images,
    with different image sizes at different breakpoints.

The screenshot shown on the Appearance admin page is `screenshot.png` in the
theme root.

## Getting started

For development, you can set the theme up as part of a Drupal site or work only
in Storybook. The theme includes npm tasks to compile design tokens, CSS, JS,
Storybook, and the SVG sprite using [webpack](https://webpack.js.org/).

To use these tasks, first run the following npm command in the theme folder to
install node dependencies.

```shell
npm ci
```

To compile the theme, start Storybook, and watch for changes run the following
command in the theme directory:

```shell
npm run dev
```

Open [localhost:6006]() to view Storybook. If you’re using Docker (or some other
container engine) for local development, this might be mapped to a custom domain
or a port on a custom domain such as [storybook.ddev.site]() or [site.ddev.site:6006]().

If you add new SCSS and/or JS files, you will need to restart webpack by
canceling and then re-running `npm run dev`. New files will not be processed
until webpack restarts. Errors will also be shown for duplicate filenames.

### npm scripts

The full set of scripts defined in `package.json`:

| Script | What it does |
| --- | --- |
| `npm run start` | One-off build of the **design tokens only** (`webpack.theme-config.js` in development mode). It does not compile CSS or JS. It is a prerequisite for the watchers, which is why `watch` and `dev` run it first. |
| `npm run watch-theme` | Watches and rebuilds the theme's CSS, JS and SVG sprite (`webpack.dev.js`). |
| `npm run watch-design-tokens` | Watches and rebuilds the generated design-token Sass partial and JS object (`webpack.theme-config.js`). |
| `npm run watch` | `start`, then `watch-theme` and `watch-design-tokens` concurrently. No Storybook. Use this when you are working against a real Drupal site. |
| `npm run dev` | `start`, then `watch-theme`, `watch-design-tokens` and `storybook` concurrently. Use this when you are working in Storybook. |
| `npm run storybook` | Storybook dev server on port 6006, without any theme watchers. |
| `npm run build` | Full production build: design tokens (`webpack.theme-config.js`) followed by CSS/JS/sprite (`webpack.production.js`). This is the build CI runs for releases, and the only build that produces `dist/js/common.js`. |
| `npm run build-storybook` | `build`, then a static Storybook export into `storybook/`. |
| `npm run eslint` | Lints `source/**` JavaScript, excluding story files. |
| `npm run stylelint` | Lints `source/**/*.scss`. |
| `npm test` | Runs `eslint` then `stylelint`. Does not build anything. |
| `npm run component` | Scaffolds a new component (see below). |

Note that the webpack builds run ESLint and Stylelint as plugins, so lint
failures break the build. The standalone `eslint` and `stylelint` scripts are
there for when you want to check linting without waiting for a full build.

## Generating new components

Run `npm run component` to create boilerplate files for a new component. This is
the recommended approach as it will set up basic Twig and Storybook files that
you can modify.

### Interactive mode

Running the command without arguments will prompt you for the component details:

```shell
npm run component
```

### Non-interactive mode

You can also pass arguments to skip the prompts:

```shell
npm run component -- --name my-component --folder 03-components
```

#### Available options

| Option               | Description                                                    |
| --------------------- | --------------------------------------------------------------- |
| `--name <name>`      | Component name (required)                                      |
| `--folder <folder>`  | Component location, e.g., `03-components` (required)           |
| `--title <title>`    | Human-readable title (defaults to Capital Case of name)        |
| `--subfolder <name>` | Optional subfolder within the component location               |
| `--no-modular-sass`  | Add styles to the global stylesheet instead of a separate file |
| `--js`                | Include a JavaScript file                                      |
| `--help, -h`          | Show help message                                              |

## Storybook

Name your stories files `[component].stories.jsx`. See
`source/03-components/menu/menu.stories.jsx` for an example. `.storybook/main.js`
picks up `source/**/*.stories.@(js|jsx|ts|tsx)`.

Prose documentation pages are plain `[name].mdx` files, **not**
`[name].stories.mdx`. Storybook 8 removed support for MDX files that define
stories, so an MDX file may only contain documentation; the stories it documents
have to live in a sibling `.stories.jsx`. Existing examples:
`source/01-global/global.mdx`,
`source/03-components/dropdown-menu/dropdown-menu.mdx`.

### Component Story Format 3 (CSF3)

Stories are written in CSF3: the default export is the component meta, and each
named export is a **plain object** with a `render` function, rather than a
function with properties attached to it.

```jsx
import parse from 'html-react-parser';

import twigTemplate from './menu.twig';
import data from './menu.yml';

const settings = {
  title: 'Components/Menu',
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Default };
```

The pre-CSF3 form — `const Default = args => ...` followed by `Default.args = ...`
— still renders, but new stories should use the object form, and `npm run component`
scaffolds it for you.

Shared story helpers live in `source/06-utility/storybookHelper.jsx`. (This theme
does not use a `.storybook/decorators.jsx` file; the global decorator that runs
`Drupal.attachBehaviors()` is defined inline in `.storybook/preview.js`.)

To match Storybook to your site’s branding, change the colors, brand title,
brand logo and base font in `.storybook/theme.js`, which
`.storybook/manager.js` imports and passes to `addons.setConfig()`. Web fonts
are loaded in `.storybook/manager-head.html` (for the Storybook UI itself) and
`.storybook/preview-head.html` (for the rendered stories). See the [Storybook
docs](https://storybook.js.org/docs/react/configure/theming) for more
information about and examples of theming.

### DDEV and allowed hosts

Storybook 10 validates the `Host` header on dev-server requests. When you access
Storybook through the DDEV router (`https://<project-name>.ddev.site:6006`), the
hostname must be allowlisted in `.storybook/main.js`.

By default, this theme reads `DDEV_HOSTNAME` or `VIRTUAL_HOST` from the environment
(DDEV sets `VIRTUAL_HOST` in the Storybook container) and uses that hostname. If
neither variable is set, any `*.ddev.site` hostname is allowed instead. Access
via `localhost:6006` does not require additional configuration.

If you use a different reverse proxy or custom local domain, add its hostname to
`core.allowedHosts` in `.storybook/main.js`. See the [Storybook `core`
docs](https://storybook.js.org/docs/api/main-config/main-config-core) for
details.

## Sass

Sass can be compiled as part of the global styles.css file or to individual CSS
files for use in a Drupal library.

`@use` is used to import Sass variables, mixins, and/or functions into
individual SCSS files. [`@import` is discouraged by the Sass team and will
eventually be phased out.](https://sass-lang.com/documentation/at-rules/import).
This means that most files will start with `@use '00-config' as *;`. This allows
you to use the design token accessor functions without an additional namespace.
Other functions and mixins can be used similarly. Note that to avoid namespace
collisions, only this theme's own variables, mixins, and functions (those
forwarded from `source/00-config`) should be used with `*`.

All Sass files that are compiled to individual CSS files must have a unique
filename, even if they are in different directories.

### Global styles

Prefix the name of your Sass file with `_`, e.g. `_card.scss`. Add it to the
appropriate aggregate file (i.e. `_components.scss`).

### Individual component/library styles

DO NOT prefix the name of your Sass file with `_`, e.g. `menu.scss`. Import the
config and global aggregate files. Import your SCSS file at the top of your
Storybook file. See `dropdown-menu.stories.jsx` for an example. Don’t forget to
add it to the `slac.libraries.yml` file as well.

### Sass Linting

Stylelint and Prettier are used to lint CSS and SCSS files. Warnings will
break the build, so if you have a valid reason to break Stylelint rules you can
have it ignore code in two ways:

1.  Add `// stylelint-disable-next-line` to the line just before where the
    Stylelint warning is triggered.

2.  To ignore several lines, add `// stylelint-disable` before the code in
    question and add `// stylelint-enable` afterwards.

In both cases above, please add a comment about the valid reason to disable the
Stylelint rule(s) in your use case.

The Stylelint rules can be changed in the `.stylelintrc.yml` file. By default,
the theme extends
[stylelint-config-sass-guidelines](https://github.com/bjankord/stylelint-config-sass-guidelines)
and enables the
[stylelint-prettier](https://github.com/prettier/stylelint-prettier) plugin
(which reports Prettier formatting differences as Stylelint errors), plus
`stylelint-order` and a local `plugin/selector-pseudo-class-lvhfa` rule from
`lib/stylelintLVHFA.js`, with some additional customizations.

The Prettier config can be changed in the `.prettierrc` file.

You can also run Stylelint on its own with `npm run stylelint`.

## JavaScript

JavaScript can be compiled to individual JS files for use in a JavaScript
library or included within a different JS file. JS files that use modern
(ES2015+) syntax must be named `[name].es6.js`, but this is not required by the
compiler. JavaScript files should go in the appropriate folder under source
(e.g., `source/03-components/menu` for menu-related JavaScript). There is not a
separate folder for JS files as there was in older versions of this theme.

All JavaScript files must have a unique filename, even if they are in different
directories.

### Modules

Prefix the name of your JavaScript file with `_`, e.g. `_Menu.es6.js`. Import it
to the appropriate JavaScript file(s), (i.e. `primary-menu.es6.js`).

### Individual component/library scripts

DO NOT prefix the name of your JS file with `_`. Import your JS file at the top
of your Storybook file. See `dropdown-menu.stories.jsx` for an example. Don’t
forget to add it to the `slac.libraries.yml` file as well.

### common.js

Any library you create in `slac.libraries.yml` that includes an individual
component script must include `slac/common` as a dependency. (In most cases, you
will also add `core/drupal` as a dependency, if you are using the `Drupal`
object anywhere in your code.) common.js is generated on **production** builds
(so you will not notice it missing until you deploy to a staging server) and
contains JavaScript that is shared across two or more components, so that it is
not bundled multiple times on the page. The recommended practice is for each
library to declare its dependencies, even if some of them are repeated across
multiple libraries and/or shared with global. This ensures that Drupal will
always load the dependencies before loading any library that depends on them.
See the `dropdown_menu` library in `slac.libraries.yml` as an example.

The common JS file is created using the [Webpack SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/).
To change how it behaves, update `webpack.production.js`. You may also need to
update `slac_library_info_build` in `includes/libraries.inc` to change what
files are included in the `slac/common` library. We recommend using the default
setup unless you have a specific use case that requires advanced configuration.

### JS Linting

ESLint and Prettier are used to lint JavaScript files. If you have a valid
reason to break one of the rules, you can ignore a specific line using any of
the options in the [ESLint
documentation](https://eslint.org/docs/user-guide/configuring#disabling-rules-with-inline-comments).

Please add a comment about the valid reason to disable the ESLint rule(s) in
your use case.

The ESLint config can be changed in the `eslint.config.js` file. The theme
follows the [Forum One JavaScript standards](https://www.npmjs.com/package/@forumone/eslint-config-es5),
which mostly follow the ESLint recommended config. For React files, there are
[additional JSX-specific linting rules](https://www.npmjs.com/package/@forumone/eslint-config-react).
A relaxed variant used by the dev webpack build lives in `eslint.dev.config.js`.

The Prettier config can be changed in the `.prettierrc` file.

You can also run ESLint on its own with `npm run eslint`.

### jQuery

Upstream Gesso no longer ships jQuery. This theme deliberately keeps it, because
two components require it: `source/03-components/dropbutton/dropbutton.es6.js`
(a port of Drupal core's jQuery-based dropbutton) and
`source/03-components/addtocal/addtocal-a11y.es6.js` (the `addtocal` contrib
module's JS requires jQuery).

jQuery is therefore retained in the following places, all of which must stay in
sync:

1.  `jquery` in `package.json` `dependencies`.

2.  `jquery: 'jQuery'` in the `externals` block of `webpack.common.js`, so it is
    treated as a Drupal-provided global rather than bundled.

3.  `core/jquery` in the `dependencies` of both the `dropbutton` and
    `addtocal_a11y` libraries in `slac.libraries.yml`.

4.  `jquery: 'jQuery'` in `config.externals` in `.storybook/main.js`, plus the
    `.storybook/stubs/jquery.js` stub, which is imported from
    `.storybook/preview.js` and publishes the real package as `window.jQuery`
    so that the Storybook external resolves.

Import it at the top of a file the same way `Drupal` and `once` are imported:

```js
import jQuery from 'jquery';
```

If a future refactor removes the last jQuery consumer, remove all of the entries
above together.

### TypeScript

TypeScript is supported for component scripts. The webpack entry glob picks up
`source/**/!(*.stories).{cjs,js,ts}`, so a component script may be named
`[name].es6.ts` instead of `[name].es6.js` and will compile to the same
`dist/js/[name].es6.js` output. The same "no leading underscore, unique
filename" rules apply. `.ts`/`.tsx` files are handled by
[`ts-loader`](https://github.com/TypeStrong/ts-loader) in `transpileOnly` mode,
with type checking done out of band by
[`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin),
so type errors are reported without slowing the bundle down.

Because `resolve.extensionAlias` maps `.es6` to `['.es6.ts', '.es6.js']`, an
existing `import Foo from './_Foo.es6'` keeps working when `_Foo.es6.js` is
renamed to `_Foo.es6.ts`. This means files can be migrated one at a time.

Compiler options live in `tsconfig.json`. The `compilerOptions.paths` block
resolves the module specifiers that are webpack `externals` at build time, so
that the type checker and editors can still find them:

-   `drupal`, `drupalSettings` and `once` resolve to the Storybook stubs in
    `.storybook/stubs/`.
-   `jquery` resolves to the real package (`node_modules/jquery/dist/jquery.js`)
    rather than to a stub, because the stub itself imports that path.

`lib/` is excluded from the project's type checking and has its own
`lib/tsconfig.json`.

## Design tokens

The theme uses the configuration file
`source/00-config/config.design-tokens.yml` to manage its design tokens. The npm
build and dev tasks will automatically generate a global Sass map to easily pull
design tokens into individual SCSS files.

### Functions

The following Sass functions can be used to access the tokens defined in
`config.design-tokens.yml`.

#### `gesso-box-shadow($shadow)`

Output a shadow value from the box-shadow token list.

```scss
box-shadow: gesso-box-shadow(1);
```

#### `gesso-breakpoint($breakpoint)`

Output a size value from the breakpoints token list.

```scss
@include breakpoint(gesso-breakpoint(desktop)) {
  display: flex;
}

@include breakpoint-max(gesso-breakpoint(mobile), true) {
  display: none;
}

@include breakpoint-min-max(
  gesso-breakpoint(mobile),
  gesso-breakpoint(tablet),
  true
) {
  display: block;
}
```

#### `gesso-brand($color, $variant)`

Output a color value from the palette brand token list.

```scss
color: gesso-brand(blue, light);
```

#### `gesso-color($type, $subtype)`

Output a color value from the colors token list.

```scss
color: gesso-color(text, primary);
```

#### `gesso-constrain($constrain)`

Output a size value from the constrains token list.

```scss
max-width: gesso-constrain(sm);
```

#### `gesso-duration($duration)`

Output a timing value from the transitions duration token list.

```scss
transition-duration: gesso-duration(short);
```

#### `gesso-easing($easing)`

Output an easing value from the transitions ease token list.

```scss
transition-timing-function: gesso-easing(ease-in-out);
```

#### `gesso-font-family($family)`

Output a stack value from the font-family token list.

```scss
font-family: gesso-font-family(primary);
```

#### `gesso-font-size($size)`

Output a size value from the font-size token list.

```scss
font-size: rem(gesso-font-size(2));
```

#### `gesso-font-weight($weight)`

Output a weight value from the font-weight token list.

```scss
font-weight: gesso-font-weight(semibold);
```

#### `gesso-grayscale($color)`

Output a color value from the palette grayscale token list.

```scss
color: gesso-grayscale(gray-2);
```

#### `gesso-line-height($height)`

Output a height value from the line-height token list.

```scss
line-height: gesso-line-height(tight);
```

#### `gesso-spacing($spacing)`

Output a size value from the spacing token list.

```scss
margin-bottom: rem(gesso-spacing(md));
```

#### `gesso-z-index($index)`

Output an index value from the z-index token list.

```scss
z-index: gesso-z-index(modal);
```

### Design tokens in JavaScript

The values in the design tokens configuration file are also exported to
JavaScript objects so that the same values can be used in CSS and JS. The JS
objects can be found in `source/00-config/_GESSO.es6.js` (the filename is
inherited from upstream Gesso and deliberately left alone). This generated file
is gitignored and is rebuilt whenever `npm run start`, `npm run build`,
`npm run watch` or `npm run dev` are run.

For example, to use a breakpoint in a script:

```js
import { BREAKPOINTS } from '../../../00-config/_GESSO.es6';

if (window.matchMedia(`min-width: ${BREAKPOINTS.desktop}`).matches) {
  // Some script that should only run on larger screens.
}
```

This will use the same breakpoint as `breakpoint(gesso-breakpoint(desktop))` in
your Sass.

### Viewport width-based media queries

The theme uses custom mixins to specify viewport width based media queries:
-   `breakpoint`: min-width queries
-   `breakpoint-max`: max-width queries
-   `breakpoint-min-max`: queries with both a min and max width

Each mixin takes one or two width parameters, which can be a straight value
(e.g., 800px, 40em) or a design token value called using the `gesso-breakpoint`
function (e.g., `gesso-breakpoint(tablet-lg)`). The `breakpoint-max` and
`breakpoint-min-max` mixins can also take an optional parameter to subtract one
pixel from the max-width value, which can be useful when you want your query to
go up to the value but not to include it, such as when using breakpoint token
values.

#### `@include breakpoint($width) { // styles }`

Output a min-width based media query.

```scss
@include breakpoint(800px) {
  display: flex;
}

@include breakpoint(gesso-breakpoint(desktop)) {
  display: none;
}
```

#### `@include breakpoint-max($width, $subtract_1_from_max) { // styles }`

Output a max-width based media query. The optional `$subtract_1_from_max`
parameter will subtract 1px from the width value if set to `true` (default:
`false`).

```scss
@include breakpoint-max(900px) {
  display: block;
}

@include breakpoint-max(gesso-breakpoint(mobile), true) {
  display: none;
}
```

#### `@include breakpoint-min-max($min-width, $max-width, $subtract_1_from_max) { // styles }`

Output a media query with both a min-width and max-width. The optional
$subtract_1_from_max parameter will subtract 1px from the max-width value if
set to `true` (default: `false`).

```scss
@include breakpoint-min-max(400px, 700px) {
  display: flex;
}

@include breakpoint-min-max(
  gesso-breakpoint(mobile),
  gesso-breakpoint(tablet),
  true
) {
  display: block;
}
```

### Container queries

Custom mixins are also provided for container queries, in
`source/00-config/mixins/_container-query.scss`:

-   `container-query`: min-width container queries
-   `container-query-max`: max-width container queries
-   `container-query-min-max`: container queries with both a min and max width

Each mixin takes one or two width parameters, which can be a straight value
(e.g., 800px, 40em) or a design token value called using the `gesso-breakpoint`
function (e.g., `gesso-breakpoint(tablet-lg)`). The `container-query-max` and
`container-query-min-max` mixins can also take an optional parameter to subtract
one pixel from the max-width value, which can be useful when you want your query
to go up to the value but not to include it, such as when using breakpoint token
values.

Whether the mixins convert their width values to rems is controlled by the
`$container-queries-rems` setting in `source/00-config/_config.settings.scss`
(default: `true`), which is the container-query counterpart to
`$breakpoints-ems`.

In order for container queries to work, you need to set a containment context
on a parent element.

```scss
container-type: inline-size;
```

```scss
container: container-name / inline-size;
```

#### `@include container-query($width) { // styles }`

Output a min-width based container query.

```scss
@include container-query(800px) {
  display: flex;
}

@include container-query(gesso-breakpoint(desktop)) {
  display: none;
}
```

#### `@include container-query-max($width, $subtract_1_from_max) { // styles }`

Output a max-width based container query. The optional `$subtract_1_from_max`
parameter will subtract 1px from the width value if set to `true` (default:
`false`).

```scss
@include container-query-max(900px) {
  display: block;
}

@include container-query-max(gesso-breakpoint(mobile), true) {
  display: none;
}
```

#### `@include container-query-min-max($min-width, $max-width, $subtract_1_from_max) { // styles }`

Output a container query with both a min-width and max-width. The optional
`$subtract_1_from_max` parameter will subtract 1px from the max-width value if
set to `true` (default: `false`).

```scss
@include container-query-min-max(400px, 700px) {
  display: flex;
}

@include container-query-min-max(
  gesso-breakpoint(mobile),
  gesso-breakpoint(tablet),
  true
) {
  display: block;
}
```

### Other mixins

The `svg-mask-image` mixin
(`source/00-config/mixins/_svg-mask-image.scss`) can be used similarly to the
`svg-background` mixin, but it sets `mask-image` instead of `background-image`,
which allows the icon's color to be changed with the `background-color`
property.

Both mixins take an SVG name (from `source/images/backgrounds/` by default) and
an optional location override.

```scss
// Sets background-image; the SVG's own fill wins.
@include svg-background(angle-down);

// Sets mask-image; background-color controls the rendered color.
@include svg-mask-image(angle-down);
background-color: gesso-color(text, primary);
```

## Twig filters and functions

This theme includes some additional filters and functions that can be used in
Twig templates. In Storybook they are registered in `.storybook/preview.js` from
the implementations in `lib/`. In Drupal they are provided by contrib modules or
by the SLAC Helper (`slac_helper`) module, as noted for each filter below.

#### `add_attributes`

Fork of [Drupal Pattern Lab's `add_attribute` Twig function](https://github.com/drupal-pattern-lab/add-attributes-twig-extension).
Allows Twig templates to add attributes that, in Drupal, will be merged with the
Drupal attributes object while also rendering in Storybook. Storybook
implementation: `lib/addAttributesTwigExtension.js`.

```twig
<div {{ add_attributes(
  {
    class: 'your-class-one your-class-two',
    'data-foo': 'bar'
  }
) }}>...</div>
```

#### `keysort`

Twig filter to sort an object by key alphabetically. Storybook implementation:
`lib/keysort.js`.

```twig
{% for key, value in your_object|keysort %}
...
{% endfor %}
```

#### `unique_id`

Twig filter that turns a string into a value safe to use as an HTML `id`. This
theme's templates use `unique_id`, with 28 call sites across 20 Twig files.
Storybook implementation: `lib/uniqueId.js`, registered in `.storybook/preview.js`.
In Drupal it comes from the SLAC Helper (`slac_helper`) module.

Upstream Gesso briefly renamed its equivalent filter to `clean_unique_id` (backed
by a Drupal core filter of the same name) as of its own 5.4.2 release; this theme
deliberately did not follow that rename, because it would have required a
matching change in `slac_helper` and a rewrite of every template call site at
the same time. Upstream reversed the rename again in its 5.4.6 release, going
back to `unique_id` — so there is no pending rename to track anymore, and no
action needed here.

```twig
{% set section_id = 'accordion-section'|unique_id %}
```

#### `field_value`

Twig filter to get the rendered value of a field without its wrapper markup. In
Storybook it is provided by `lib/fieldValue.js`; in Drupal it is provided by the
[Twig Field Value](https://www.drupal.org/project/twig_field_value) module (see
the Installation section above). Note that using `|field_value` breaks Drupal's
QuickEdit functionality.

```twig
{{ content.field_example|field_value }}
```

#### `subheading_level`

Twig filter to transform a heading tag to the next level down (h2 -> h3, h3 ->
h4, etc.) Used when the parent heading level can vary but, to maintain
accessibility, the component's heading or subheading should change accordingly.

```twig
{% set subheading_element = title_element|subheading_level %}

<{{ subheading_element|default('h3') }}>...</{{ subheading_element|default('h3') }}>
```

> **Caveat: Storybook only, for now.** The Storybook implementation exists
> (`lib/subheadingLevelTwigExtension.js` registered in `.storybook/preview.js`),
> but the matching Drupal filter has **not** been added. It would have to come
> from the separate SLAC Helper (`slac_helper`) module, and `slac_helper` does
> not register it yet. Using `|subheading_level` in a template that Drupal
> renders will therefore throw an unknown-filter error. Do not use this filter
> in templates until `slac_helper` provides it.

## Building Storybook

A static Storybook site can be built with `npm run build-storybook`, which
builds the theme assets first and then outputs Storybook to `storybook/` in the
theme root.

`storybook/` is **gitignored** — it is a build artifact and is never committed.
The published demo site is built in CI instead: the
`.github/workflows/publish-demo-site.yml` workflow runs `npm ci` and
`npm run build-storybook` on every push to `main` (and on manual dispatch), then
deploys `storybook/` to this repository's GitHub Pages site.

The demo site is published at
<https://slac.github.io/slac-drupal-profile-theme/>.

## Theme settings

Some aspects of the theme can be configured on the theme settings page
(**Appearance → SLAC → Settings**). The form is built in `theme-settings.php`
and the values are declared in `config/schema/slac.schema.yml`.

**Back to Top**

-   `include_back_to_top` — whether to include the Back to Top component
    (default: on).
-   `threshold` — how far, in pixels, a user should scroll down the page before
    the Back to Top component appears (default: 200).
-   `smooth_scroll` — whether to animate the scroll back to the top (default:
    on).

**Breadcrumb**

-   `include_current_page_in_breadcrumb` — whether the current page is included
    as the last breadcrumb item (default: on).

**Hide Social Share Icons**

-   `hide_social_media_share_icons` — if enabled, social media icons will not be
    shown on the side of the page.

**SLAC Today header link**

-   `slac_today_header_link` — the URL used for the SLAC Today link in the site
    header.

**SLAC search**

-   `include_slac_web_search` — whether to offer the SLAC-wide web search option
    in the search form (default: off).
-   `search_this_site_placeholder` — custom placeholder text shown when the
    "This site" search option is selected. If left empty, the Organization
    Acronym, then the Organization Name, then the Site Name is used.

The list above is the complete set — anything not listed is not a setting of this
theme. In particular, upstream Gesso's **Button styles** theme setting and its
**Gesso Button** link-field formatter are not part of this theme.

## Relationship to upstream Gesso

This theme began as a copy of [Gesso](https://github.com/forumone/gesso) and
still shares its build toolchain, Sass architecture, `gesso-*` design-token
accessor functions, and Storybook integration. The rename from `gesso` to `slac`
happened long ago; there is nothing left to rename.

-   The theme currently tracks **Gesso 5.4.6**, which is the version recorded in
    `package.json`.
-   Upstream **toolchain** changes (Node, webpack, ESLint, Stylelint, Storybook,
    TypeScript, Sass module-system migration) are merged in.
-   Upstream **component, template, and design-token** changes are deliberately
    **not** merged. SLAC's components and tokens have diverged and are
    maintained here.
-   **Gesso 5.4.6 is the baseline for future merges.** Deliberate deviations
    from upstream are marked with a comment at the point of deviation, so the
    reasoning travels with the code — see `webpack.common.js` (the `jquery`
    external and the `if-function` Sass silence), `.stylelintrc.yml`
    (`selector-max-compound-selectors`) and
    `source/00-config/mixins/_button.scss` (the declaration-order suppression).
    Keep that convention: when you deviate, say why inline.
-   A few upstream identifiers are retained on purpose, because renaming them
    would touch every SCSS and JS file for no functional gain: the `gesso-*`
    Sass function prefix, and `source/00-config/_GESSO.es6.js`.

## Contributing

Please use this repository's GitHub issue queue for discussion, bug reports,
feature requests, etc. Pull requests should target `main`.

### Releases

Releases are cut by pushing a tag. The
`.github/workflows/build-assets.yml` workflow then:

1.  Checks out the tag, runs `npm ci` and `npm run build`, and removes
    `node_modules`.
2.  Writes the tag name into `slac.info.yml` as the `version` property.
3.  Zips the result as `slac.zip`, excluding `source/`, `node_modules/`, VCS
    files and `.editorconfig`.
4.  Uploads `slac.zip` to the GitHub Release for that tag.
5.  Sends a `repository_dispatch` (`release-published`) to the
    `slac-it/slac-drupal-satis` repository, so that Satis picks up the new
    version and Composer consumers can require it.

There is no need to commit build artifacts: `dist/css`, `dist/js`,
`dist/design-tokens.js`, the generated design-token partials and `storybook/`
are all gitignored and produced by CI.

## Maintainers

This theme is maintained by the SLAC web team.

It is derived from the [Gesso](https://github.com/forumone/gesso) theme by
[Forum One](https://forumone.com/), which is maintained by
[Corey Lafferty](https://drupal.org/u/clafferty),
[KJ Monahan](https://www.drupal.org/u/kmonahan),
[Dan Mouyard](https://drupal.org/u/dcmouyard) ([@dcmouyard](https://fosstodon.org/@dcmouyard)), and
[Tommy Alter](https://www.drupal.org/u/tomealter).
