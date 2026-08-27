# Phase 4 — `lib/component.js` rewrite and the `unique_id` cleanup

Depends on Phase 1 (`@forumone/tiny-mustache`, `@inquirer/prompts`, `change-case` must be
installed). Everything in this phase is either a developer-facing CLI tool
(`npm run component`) or dead code removal — nothing here touches a file Drupal or Storybook
serves to a browser, so it's zero-risk under the "no rendered output change" constraint by
construction.

## 4.1 `lib/component.js` — full rewrite

Upstream replaces the whole file: the interactive `inquirer`-based prompt flow becomes a
dual-mode CLI (interactive when run with no arguments, non-interactive when passed
`--name`/`--folder`/etc.), file generation moves from inline template strings to Mustache
templates in a new `lib/templates/` directory (Phase 4.2), and it gains the ability to
auto-register the new component in the theme's libraries YAML when the component needs its own
CSS/JS library.

- [x] Replace `lib/component.js` in full with upstream's new version (from
      `gesso-update-diff.diff`, the `lib/component.js` hunk — it's a full-file diff, easiest to
      take upstream's new file wholesale and then apply the two SLAC-specific fixes below).
- [x] **Fix required — theme name is hardcoded to `gesso` in three places.** This repo's theme
      is `slac`, not `gesso`; upstream's script assumes its own theme name in code, not just in
      the shipped defaults. Before this script will work correctly here:
  1. In the `mustacheData` object inside `generator()`, change
     `` attachLibrary: `{{ attach_library('gesso/${componentName}') }}`, `` to
     `` attachLibrary: `{{ attach_library('slac/${componentName}') }}`, `` — otherwise every
     newly-scaffolded component's Twig file attaches a library from a `gesso` namespace that
     doesn't exist in this theme.
  2. In the `if (library) { ... }` block near the end of `generator()`, change
     `const librariesFile = path.join(root, 'gesso.libraries.yml');` to
     `const librariesFile = path.join(root, 'slac.libraries.yml');`. Upstream's own `catch`
     block for this exact line prints: *"If your theme is not called gesso, update the
     component.js script to look for the correct file name."* — this is that update.
  3. In the same block, `newLibrary.dependencies = ['gesso/global'];` →
     `newLibrary.dependencies = ['slac/global'];` (matches `slac.libraries.yml`'s existing
     `global:` library key).
- [x] Keep this theme's existing exclusion list inside `getDirectories()` as-is:
      `['@types', '00-config', '05-pages', '06-utility', 'fonts', 'images']`. Upstream's list
      also excludes `'07-react'`, which doesn't exist in this repo — excluding a nonexistent
      directory name is harmless, so you can take upstream's longer list verbatim if it's
      simpler to diff, but it isn't required.
- [x] Spot-check after rewriting: run `npm run component -- --name test-component --folder
      03-components` (non-interactive mode) in a scratch branch, confirm it creates
      `source/03-components/test-component/{test-component.twig,.yml,.stories.jsx,.scss}` with
      an `attach_library('slac/test-component')` call and a correctly-appended
      `slac.libraries.yml` entry, then delete the scratch output — don't commit generated test
      files.

## 4.2 `lib/templates/*.hbs` — new files

Add these five new files verbatim from the diff (they're new files upstream adds, no existing
content to reconcile):

- [x] `lib/templates/Component.hbs`
- [x] `lib/templates/Data.hbs`
- [x] `lib/templates/Javascript.hbs`
- [x] `lib/templates/Story.hbs`
- [x] `lib/templates/Stylesheet.hbs`

No SLAC-specific changes needed in these — the `slac`-vs-`gesso` fix from 4.1 is entirely
contained in `component.js`'s `mustacheData`, which feeds the `{{&attachLibrary}}` placeholder
these templates reference.

## 4.3 Retire `lib/cleanUniqueId.js`

Per the README's "`unique_id` / `clean_unique_id` story has resolved itself" section: upstream
added `lib/cleanUniqueId.js` at 5.4.2 as (from this theme's side) a forward-compatibility bridge
for a filter rename upstream has since reversed. Upstream's own 5.4.2→5.4.6 diff renames its
`cleanUniqueId.js` back to `uniqueId.js` — i.e., upstream's `lib/uniqueId.js` at 5.4.6 is
byte-identical in content to what this theme's `lib/cleanUniqueId.js` already contains today
(same Date.now()-based implementation, just under the name this theme was already using for its
*other* file).

- [x] Delete `lib/cleanUniqueId.js`.
- [x] Leave `lib/uniqueId.js` completely untouched — verified byte-identical to upstream's new
      `lib/uniqueId.js`, nothing to change.
- [x] The `.storybook/preview.js` import/call removal for `cleanUniqueId` is covered in Phase 3.4
      — if you're doing these phases out of order, make sure that edit lands alongside this
      deletion (an import of a deleted file will break the Storybook build).
- [x] Do **not** touch `slac_helper` or any Twig template's `|unique_id` call sites — those are
      unaffected. This phase only removes now-dead preparatory scaffolding; the live filter and
      all 28 template call sites keep working exactly as they do today.

**Phase 4 status: complete.** The implementing agent found a fourth hardcoded `gesso` reference
this plan missed: `lib/templates/Javascript.hbs`'s
`Drupal.behaviors.{{#camelCase}}gesso-{{ componentName }}{{/camelCase}}` line, which would have
named every generated component behavior `gesso<ComponentName>` instead of `slac<ComponentName>`.
Fixed directly (`gesso-` → `slac-` in that template) alongside the three fixes 4.1 already
called out. All four `gesso`→`slac` sites in the new component generator are now correct.
Spot-check (`--name test-component --folder 03-components`) confirmed correct output, then
cleaned up (scratch files deleted, `slac.libraries.yml` restored to its pre-test state).

**Correction found during the Test phase:** `lib/component.js`'s carried-over
`/* eslint-env node */` header comment (present in upstream's file too) triggers an ESLint
flat-config deprecation warning under this plan's bumped `eslint@^9.39.5`
(`/* eslint-env */ comments are no longer recognized... as of v10.0.0`). Removed the comment
line entirely; `npx eslint lib/component.js` was re-run afterward and stayed clean (this
theme's `eslint.config.js` already provides Node globals for `lib/**` files via its existing
carve-outs, so nothing else needed to change).
