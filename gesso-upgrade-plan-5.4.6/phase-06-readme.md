# Phase 6 — update this theme's `README.md`

The upstream diff changes upstream's own `README.md` in three ways relevant here: it documents
the new `npm run component` CLI modes, adds a note about Storybook's DDEV host-allowlisting, and
adds a maintainer credit. This theme's `README.md` is independently written (not a copy of
upstream's), but mirrors upstream's structure in a few sections and explicitly credits upstream's
maintainers, so the equivalent updates apply here too — plus one update this plan's own findings
require: the `unique_id` / `clean_unique_id` section is now describing a scenario that no longer
matches upstream's direction.

Do this phase last, after Phases 1–5, so the "currently tracks Gesso X" line and the
`unique_id` section reflect the final, actually-applied state.

## 6.1 Version pointer

- [x] In the "Relationship to upstream Gesso" section: `This theme currently tracks **Gesso
      5.4.2**, which is the version recorded in package.json.` → `This theme currently tracks
      **Gesso 5.4.6**, which is the version recorded in package.json.`

## 6.2 "Generating new components" section

Current text (§"Generating new components", right before "## Storybook"):

```markdown
## Generating new components

Run `npm run component` to create boilerplate files for a new component. This is
the recommended approach as it will set up basic Twig and Storybook files that
you can modify.
```

- [x] Replace with (adapted from upstream's README addition, keeping this section's existing
      opening sentence and updating it for the new dual-mode CLI added in Phase 4):

  ```markdown
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
  ```

  (Note the fenced code block above is written with the outer ` ``` ` already closed at
  "you can modify." in the plan text purely for this document's own Markdown nesting — when
  editing the real `README.md`, write it as one continuous section like the rest of the file.)

## 6.3 DDEV / Storybook allowed-hosts note

Add a new subsection under "## Storybook" (after the existing brand-theming paragraph that ends
"...for more information about and examples of theming."), matching the `core.allowedHosts`
config added to `.storybook/main.js` in Phase 3:

```markdown
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
```

- [x] Confirm this repo's `.github`/dev docs don't already document a different local-dev setup
      that this would contradict — adjust wording if so.

## 6.4 Rewrite the `unique_id` / `clean_unique_id` section

Current text (§"Twig filters and functions" → `#### unique_id / clean_unique_id`):

```markdown
#### `unique_id` / `clean_unique_id`

Twig filter that turns a string into a value safe to use as an HTML `id`. This
theme's templates use `unique_id` — it is the live filter, with 28 call sites
across 20 Twig files. Upstream Gesso renamed the filter to `clean_unique_id`;
both names are registered in Storybook (`lib/uniqueId.js` and
`lib/cleanUniqueId.js`), but only `unique_id` is available in Drupal, where it
comes from the SLAC Helper (`slac_helper`) module.

**Use `unique_id` in templates.** The rename to `clean_unique_id` is deferred to
a future change, because it has to land in `slac_helper` and in this theme's
templates at the same time.

```twig
{% set section_id = 'accordion-section'|unique_id %}
```
```

- [x] Replace with (reflecting Phase 4.3's cleanup and upstream's own reversal):

  ```markdown
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
  ```

## 6.5 Maintainers credit

Current text (§"Maintainers"):

```markdown
It is derived from the [Gesso](https://github.com/forumone/gesso) theme by
[Forum One](https://forumone.com/), which is maintained by
[Corey Lafferty](https://drupal.org/u/clafferty),
[KJ Monahan](https://www.drupal.org/u/kmonahan), and
[Dan Mouyard](https://drupal.org/u/dcmouyard) ([@dcmouyard](https://fosstodon.org/@dcmouyard)).
```

- [x] Replace with (matches upstream's own README maintainer-list addition):

  ```markdown
  It is derived from the [Gesso](https://github.com/forumone/gesso) theme by
  [Forum One](https://forumone.com/), which is maintained by
  [Corey Lafferty](https://drupal.org/u/clafferty),
  [KJ Monahan](https://www.drupal.org/u/kmonahan),
  [Dan Mouyard](https://drupal.org/u/dcmouyard) ([@dcmouyard](https://fosstodon.org/@dcmouyard)), and
  [Tommy Alter](https://www.drupal.org/u/tomealter).
  ```

  Leave the `<!-- TODO: confirm the current maintainers of this theme -->` placeholder and "This
  theme is maintained by the SLAC web team." line above it untouched — that's about this theme's
  own maintainers, unrelated to upstream's credit line.

**Phase 6 status: complete.** All five edits landed in the real `README.md`; verified against
the actual post-Phase-4 repo state (`lib/uniqueId.js` present, `lib/cleanUniqueId.js` deleted,
`.storybook/preview.js` only registers `uniqueId`) before writing 6.4's replacement text.

---

**All phases of the 5.4.2 → 5.4.6 upgrade plan are now implemented.** Next: run the "Test"
section from the implement-gesso-upgrade skill (npm install, stylelint, eslint, theme build,
Storybook build) and fix anything it surfaces.
