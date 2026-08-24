# Phase 10 — README

**Goal:** merge the upstream README changes into this theme's `README.md`, and correct the
documentation that this upgrade makes wrong.

**Diff reference:** lines 1041–1301.

**Not blocking.** Land as its own PR (documentation-only).

---

## 10.0 Finding: this theme's README is upstream Gesso's, verbatim

Before planning the merge, note the state of `README.md` (482 lines):

- Title is `# Gesso`; the opening paragraph describes Gesso, links to
  `forumone.github.io/gesso`, the Gesso drupal.org project page, and the Gesso issue queue.
- Installation section instructs the reader to "Place the Gesso theme in your site's theme
  directory (e.g., themes/gesso)" and to "Enable the Gesso Helper module".
- It documents `drush help gesso` for renaming the theme — a step this theme completed long ago.
- References `gesso.libraries.yml` (this theme's file is `slac.libraries.yml`).
- "Building Storybook" points at `YOUR_URL/themes/gesso/storybook/index.html`.
- "Contributing" points at the Gesso GitHub issue queue and a `5.x-RC` branch.
- "Maintainers" credits the Forum One maintainers.

None of that is a consequence of this upgrade, and fixing it is **not** in scope for the
diff. But it means a straight application of the upstream README diff produces a document
that is *more* accurate about the toolchain and still wrong about the theme's identity.

**Recommendation:** do both, in two commits.

1. **Commit A** — apply the upstream content changes (§10.1–10.5). Mechanical, low judgement.
2. **Commit B** — correct the theme-identity and packaging inaccuracies (§10.6). Needs a
   decision from the maintainer about how much to rewrite; propose the changes and let them
   review.

If you only have appetite for one, do Commit A — it is the one the diff actually asks for.

---

## 10.1 Global prerequisites (diff 1045–1055) — APPLY, adjusted

Upstream:

```markdown
-   [Node](https://nodejs.org/en/) version 20. Long-term stable
    recommended.

-   [npm](https://www.npmjs.com/get-npm) version 10.7.0 or greater.
```

- [ ] Replace the current "Node version 14.x.x or greater / npm version 7.x.x or greater"
      block.
- [ ] **Say 22, not 20.** This repo's `.nvmrc` pins `22` (Phase 1, §1.1), and CI reads
      `node-version-file: '.nvmrc'`. Documenting 20 would contradict the pin.

Suggested text:

```markdown
-   [Node](https://nodejs.org/en/) version 22, as pinned in `.nvmrc`. Long-term
    stable recommended.

-   [npm](https://www.npmjs.com/get-npm) version 10.7.0 or greater.
```

---

## 10.2 New `common.js` section (diff 1062–1080) — APPLY

Insert after the "Individual component/library scripts" subsection, before "JS Linting".
This is the single most useful addition in the README diff — it documents the
production-only `dist/js/common.js` split-chunk behaviour that Phase 8, §8.6 identifies as a
latent bug source here.

Upstream text, with names adapted to this theme:

```markdown
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
update `slac_library_info_build` in `libraries.inc` to change what files are
included in the `slac/common` library. We recommend using the default setup
unless you have a specific use case that requires advanced configuration.
```

- [ ] Apply, with `gesso` → `slac` in the three identifiers
      (`slac.libraries.yml`, `slac/common`, `slac_library_info_build`).
- [ ] Verify the `dropdown_menu` example is still apt — this theme's `dropdown_menu` library
      does declare `slac/common` and `slac/mobile_menu`. Yes, good example.

---

## 10.3 JS Linting section (diff 1089–1097) — APPLY

Upstream replaces the Airbnb paragraph:

```markdown
The ESLint config can be changed in the `eslint.config.js` file. Gesso follows
the [Forum One JavaScript standards](https://www.npmjs.com/package/@forumone/eslint-config-es5),
which mostly follow the ESLint recommended config. For React files, there are
[additional JSX-specific linting rules](https://www.npmjs.com/package/@forumone/eslint-config-react);

The Prettier config can be changed in the `.prettierrc` file.
```

- [ ] Apply. This is required — Phase 3 deletes `.eslintrc.js`, so the current text
      ("The ESLint config can be changed in the `.eslintrc.js` file. Gesso follows the Airbnb
      standards…") becomes actively misleading.
- [ ] Mention `eslint.dev.config.js` too — upstream's text omits it, but Phase 3 creates it
      and `webpack.dev.js` uses it. Add a sentence:
      *"A relaxed variant used by the dev webpack build lives in `eslint.dev.config.js`."*
- [ ] Fix upstream's trailing `;` typo after the React link (it should be a `.`).

---

## 10.4 New jQuery section (diff 1100–1149) — APPLY, rewritten

Upstream adds a "### jQuery" section under JavaScript explaining that Gesso no longer ships
jQuery and how to add it back for Storybook and Drupal.

**This theme's situation is the opposite**: it *does* use jQuery
(`source/03-components/dropbutton/dropbutton.es6.js`,
`source/03-components/addtocal/addtocal-a11y.es6.js`). Applying upstream's text verbatim
would tell the reader jQuery is absent, which is wrong.

- [ ] Add the section, rewritten to describe reality:

```markdown
### jQuery

Upstream Gesso no longer ships jQuery. This theme deliberately keeps it, because
two components require it: `source/03-components/dropbutton/dropbutton.es6.js`
(a port of Drupal core's jQuery-based dropbutton) and
`source/03-components/addtocal/addtocal-a11y.es6.js` (the `addtocal` contrib
module's JS requires jQuery).

jQuery is therefore retained in three places, all of which must stay in sync:

1.  `jquery` in `package.json` `dependencies`.
2.  `jquery: 'jQuery'` in the `externals` block of `webpack.common.js`, so it is
    treated as a Drupal-provided global rather than bundled.
3.  `core/jquery` in the `dropbutton` library's `dependencies` in
    `slac.libraries.yml`, and `core/jquery` wherever `addtocal_a11y` is attached.

Import it at the top of a file the same way `Drupal` and `once` are imported:

```js
import jQuery from 'jquery';
```

If a future refactor removes the last jQuery consumer, remove all three entries
above and the `.storybook/stubs/jquery.js` stub together.
```

- [ ] Adjust the third point to match whatever Phase 8, §8.6 concluded about
      `addtocal_a11y`'s dependencies.
- [ ] Mention `.storybook/stubs/jquery.js` only if Phase 5, §5.5 created it.

---

## 10.5 Media-query and container-query docs — APPLY selectively

### "Width-based media queries" → "Viewport width-based media queries" (diff 1158–1168)

- [ ] Rename the heading (line 380 of the current README).
- [ ] Apply the list-marker change (`-   ` → `- `) if you want to match upstream's
      formatting. Cosmetic; harmless either way. Note the rest of this README uses `-   `
      (three spaces) consistently, so changing just this list is inconsistent —
      **recommend leaving the markers alone.**

### New "Container queries" section (diff 1176–1251)

- [ ] Apply **only if Phase 7, §7.6 added `source/00-config/mixins/_container-query.scss`.**
      Documenting mixins that don't exist is worse than not documenting them.
- [ ] If applied: insert after the `breakpoint-min-max` subsection, before the Twig section.
      Copy the upstream text verbatim (it documents `container-query`,
      `container-query-max`, `container-query-min-max`, the `container-type: inline-size`
      requirement, and the `$subtract_1_from_max` parameter).
- [ ] Also mention `$container-queries-rems` in `source/00-config/_config.settings.scss` —
      upstream's text omits it, but Phase 7 adds it and it controls whether the mixins convert
      to rems.

### New "Twig Filters and Functions" section (diff 1253–1288)

Upstream documents `add_attributes`, `keysort`, and `subheading_level`.

- [ ] Apply, **with these corrections for this theme:**
  - `add_attributes` — accurate. This theme uses it in ~173 Twig files. Keep upstream's text.
  - `keysort` — accurate. Keep.
  - `subheading_level` — Phase 4 adds the **Storybook** filter
    (`lib/subheadingLevelTwigExtension.js`), but the **Drupal** filter is provided by
    `slac_helper`. Until `slac_helper` registers it, this filter works in Storybook and
    fatals in Drupal. Document that caveat explicitly or omit the subsection.
  - **Add `clean_unique_id` / `unique_id`** — not in upstream's list, but this theme has 28
    call sites and now registers both filters in Storybook (Phase 5, §5.4). Document that
    `unique_id` is the current filter, `clean_unique_id` is the upstream name, and both are
    available in Storybook while only `unique_id` is available in Drupal (via `slac_helper`)
    until the cross-repo rename lands.
  - **Add `field_value`** — provided by `lib/fieldValue.js` in Storybook and by the
    Twig Field Value contrib module in Drupal. The README already mentions the module in the
    Installation section; cross-reference it.
  - Fix upstream's heading-level inconsistency: `#### add_attributes`, `#### keysort`, then
    `### subheading_level`. Make them all `####`.

### Maintainers section (diff 1293–1301)

- [ ] Upstream updates the maintainer links (drops Twitter handles, adds a Mastodon link).
      **Do not apply** — see §10.6; this theme should not be crediting Gesso's maintainers as
      its own.

---

## 10.6 Commit B — correct this theme's documentation (propose, don't assume)

These are wrong *before* this upgrade and will still be wrong after Commit A. Each needs a
maintainer decision, so propose them as a reviewable diff rather than landing silently.

- [ ] **Title and intro.** `# Gesso` → `# SLAC`, with a paragraph explaining that this is a
      Gesso-derived Drupal theme distributed as a Composer package, and noting the Gesso
      version it tracks (5.4.2). Keep the credit to Gesso and the links to the upstream
      project — attribution is right, identity confusion isn't.
- [ ] **Installation section.** It currently describes installing and *renaming* upstream
      Gesso. Replace with how this theme is actually consumed:
      `composer require slac/slac-drupal-profile-theme` from the Satis repository, then
      `drush theme:enable slac`. Keep the contrib-module requirements
      (`components`, `twig_tweak`, optional `twig_field_value`, `bg_image_formatter`) — those
      are still accurate and match `slac.info.yml` `dependencies`. Replace "Enable the Gesso
      Helper module" with "Enable the SLAC Helper (`slac_helper`) module", and note it is a
      **separate** package, not bundled in this repo.
- [ ] **Remove the `drush help gesso` renaming instructions entirely.** They describe a
      one-time operation already performed, and `drush gesso` does not exist for this theme.
- [ ] **`gesso.libraries.yml` → `slac.libraries.yml`** throughout (`grep -n "gesso\." README.md`).
- [ ] **"Building Storybook"** — `YOUR_URL/themes/gesso/storybook/index.html` →
      the GitHub Pages URL for this repo's demo site (see Phase 9, §9.1), plus a note that
      `storybook/` is gitignored and built in CI.
- [ ] **"Storybook" section** says to change colours in `.storybook/manager.js` and fonts in
      `.storybook/manager-head.html`. Colours actually live in `.storybook/theme.js` (which
      `manager.js` imports). Correct it.
- [ ] **"Theme settings"** describes Gesso's Back to Top / Breadcrumb / Button-styles
      settings. Check against `theme-settings.php` and `config/schema/slac.schema.yml` —
      this theme has additional settings (`slac_today_header_link`,
      `hide_social_media_share_icons`, `include_slac_web_search`,
      `search_this_site_placeholder`) that are undocumented, and the Gesso Button formatter
      belongs to `slac_helper`. Document what exists.
- [ ] **"Contributing"** — point at this repo's issue queue, and describe the actual release
      process (tag push → `build-assets.yml` → GitHub Release → Satis dispatch), not
      Gesso's `5.x-RC` branch convention.
- [ ] **"Maintainers"** — the SLAC maintainers, with a line crediting Gesso and its
      maintainers as the upstream project.
- [ ] **New section: "Relationship to upstream Gesso".** Worth adding: state which Gesso
      release this theme tracks (5.4.2), that upstream component/token changes are
      deliberately not merged, and point at `gesso-upgrade-plan/` (or wherever this plan
      ends up) for the deviation list. That makes the next upgrade much cheaper.

---

## 10.7 Documentation the upgrade makes stale (not in the diff) — APPLY

Things Phases 1–9 change that the README currently describes incorrectly, and which upstream's
own README diff does not cover:

- [ ] **"Getting started"** — the section says `npm run dev` compiles the theme, starts
      Storybook, and watches. After Phase 1 the script set changed:
      - `npm run start` now only builds design tokens (it no longer runs `webpack.dev.js`).
      - `npm run watch-theme`, `npm run watch-design-tokens` are new.
      - `npm run watch` = start + both watchers (no Storybook).
      - `npm run dev` = start + both watchers + Storybook.
      - `npm run eslint` and `npm run stylelint` are new standalone lint scripts.
      Document all of these.
- [ ] **"Sass Linting"** — remove the reference to
      [`stylelint-config-prettier`](https://github.com/prettier/stylelint-config-prettier).
      That package is deleted in Phase 1 and no longer exists in the toolchain; Stylelint 16
      handles Prettier compatibility natively.
- [ ] **"Storybook"** — the current text says "Name your stories files
      `[component].stories.jsx`" and points at `menu.stories.jsx` as an example. Verify
      `source/**/menu.stories.jsx` still exists (`find source -name 'menu.stories.jsx'`); if
      not, point at a file that does. Also document that docs pages are now `*.mdx`
      (not `*.stories.mdx`) — Phase 5, §5.7.
- [ ] **"Storybook"** — add a note about CSF3 if Phase 6 landed: stories are objects with a
      `render` key, not functions with attached properties.
- [ ] **New: TypeScript.** Phase 2 adds `tsconfig.json`, `ts-loader` and
      `fork-ts-checker-webpack-plugin`, and the webpack entry glob now picks up `.ts` files.
      Document that `.es6.ts` component scripts are supported, and that `.storybook/stubs/*`
      are mapped as the `drupal` / `drupalSettings` / `once` / `jquery` module types via
      `compilerOptions.paths`.
- [ ] **Prerequisites** — mention `.npmrc` (`legacy-peer-deps=true`) if it turns out to be
      required for a clean `npm ci` (Phase 1, §1.6).

---

## Definition of done

- Commit A applied: prerequisites, `common.js`, JS Linting, jQuery, Twig filters
  (+ container queries if Phase 7 added the mixins).
- §10.7 staleness fixed: script list, `stylelint-config-prettier` removal, `.mdx` naming,
  CSF3 note, TypeScript section.
- No reference in `README.md` to `.eslintrc.js`, `.eslintrc-dev.js`, `babel.config.json`,
  `deploy-storybook`, `stylelint-config-prettier`, or `gesso.libraries.yml`.
  Verify: `grep -nE '\.eslintrc|babel\.config|deploy-storybook|stylelint-config-prettier|gesso\.libraries' README.md`
  returns nothing.
- Commit B either landed or opened as a reviewable proposal.
