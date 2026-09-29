# PHP review notes (document, don't apply)

This file is a deliverable, as in W6-D9. It records upstream's PHP-layer changes per release:
- `includes/*.inc`, `gesso.theme` → `slac.theme`, `theme-settings.php`;
- the info/libraries YAML that pairs with them;
- `gesso_helper/` → **`slac_helper`**, which lives in the **slac-drupal-profile** repo at `web/modules/custom/slac_helper`; it is not in this theme.

Each entry says what upstream changed, whether it applies to SLAC, the **Drupal 11** relevance, and the **consumer impact**. Six local consumer sites run `base theme: slac` sub-themes, so settings, library and template-suggestion changes behave differently there.

**Legend:** `applied` (decision + commit) · `not applied` · `n/a` (SLAC has no equivalent) · `consider` (a recommended follow-up, not done).

**How to fill it in, per hop:**
1. `bash .claude/gesso-hop.sh diff <from> <to>` lists the PHP layer.
2. Read `git -C ~/.cache/gesso-slac/upstream diff <from> <to> -- includes gesso.theme theme-settings.php gesso_helper gesso.info.yml gesso.libraries.yml`.
3. Map `gesso_*` → `slac_*`.
4. For **5.0.10 → 5.4.2**, W6-D9's notes cover the same upstream diffs. Start from `git -C /Users/btschu/Development/W6-D9 show "gesso-upgrade-hop-by-hop:.claude/gesso-plans/php-review-notes.md"` and verify each item against SLAC's own `includes/`. **W6-D9's notes stop at 5.4.2**, so 5.4.3 → 5.4.6 must be written from the upstream diff.
5. Check Drupal API claims against core 10.6.17 in the slac-drupal-profile checkout (`web/core`), not from memory. The old branch called `FilteredMarkup` "deprecated"; it is `@internal`.

## Decisions already made (2026-09-29)

| Upstream change | Release | Status | Notes |
| --- | --- | --- | --- |
| `theme-settings.php`: typed signature `(array &$form, FormStateInterface $form_state, ?string $form_id = NULL): void`, `$theme` derived from `$form['config_key']` and passed to `theme_get_setting()` | 5.4.4 / 5.4.6 | **applied after the hops** (user decision; flag it) | Take the hunk from the old branch: `git show f712137 -- theme-settings.php`. It uses `theme_get_setting(..., $theme)` in place of upstream's `gesso_helper_get_theme_setting()`, since `slac_helper` has no ThemeSettings service. It is a real fix: with `?string $form_id = NULL`, the existing admin-theme workaround finally runs. No output change in core's own form flow (`ThemeSettingsForm` sets the active theme first). Land it as its own commit after hop 23. |
| `includes/html.inc`: drop the explicit theme argument from `theme_get_setting()` | 5.4.2 (html.inc only; upstream's `navigation.inc` kept `'gesso'` until 5.4.6) | **not applied** | **Changes behaviour on sub-theme sites.** Without `'slac'`, the calls read `<subtheme>.settings` (core does not fall back to the base theme). On slac-slacit-d9, `include_current_page_in_breadcrumb` is 0 in `slac.settings` but 1 in `slac_it.settings`. The old branch applied it at `6c15040` (and extrapolated it to `navigation.inc`). Don't. |
| `_add_regions_to_template()` → theme-prefixed name | 5.4.3 (`a0d7494a`) | **not applied** | Would break any sub-theme or custom module calling the old global function. If ever wanted, it needs a consumer grep and a release note. |
| `Drupal\filter\Render\FilteredMarkup` → `Drupal\Core\Render\Markup` in `media.inc` | 5.4.4 (`fd8f6828`, `e8a94817`) | **not applied** | `FilteredMarkup` is `@internal` and `final`, not deprecated. Low risk either way; not needed for D11. |
| `core_version_requirement` → `'^10.3 \|\| ^11'` | 5.4.6 | **applied at hop 23** (W6-D9's decision) | `slac_helper.info.yml` must be bumped in lock-step and released first (review-flags A-2). "D11 declared, not tested." Record a removed-API scan of `includes/*.inc`, `slac.theme` and `theme-settings.php` here at hop 23. The 2026-09-28 scan found no D11-removed APIs, plus 18 `theme_get_setting()` calls (deprecated on 11.3+). |

## Known upstream items to write up at their hop

- **5.4.5 (`af67369f`):** `gesso_library_info_alter()` sets `preprocess: FALSE` on `dist/js`. Changes aggregation. Document it.
- **5.4.6 (`2ed1fdf4`):** a static `common:` library replaces `gesso_library_info_build()`. **Consider** it as a follow-up.
  - `slac_library_info_build()` only defines `slac/common` when the **active** theme's path has `dist/js/common.js`, so sub-themed sites lose it.
  - slac-today works around this in `slac_today.theme` (`slac_today_library_info_alter`).
  - Once `splitChunks` is in `webpack.common.js` (hop 23), both dev and prod emit `common.js`, so a static library is safe.
- **5.4.6 (`99c7a811`):** `gesso_helper_get_theme_setting()` / ThemeSettings service. `n/a` until `slac_helper` has one. It is upstream's answer to `theme_get_setting()`'s D11.3+ deprecation.

## slac_helper (the other repo)

- **State as of 2026-09-28:** `core_version_requirement: ^9 || ^10`; the composer name is still `forumone/gesso_helper`. No SubheadingLevel, no ThemeSettings. `UniqueIdTwigExtension` is random, like Storybook's.
- **Old triage:** the first upgrade triaged the 19 upstream `gesso_helper` files in `git -C /Users/btschu/Development/slac-drupal-profile-theme show 1f31a9d:gesso-upgrade-plan/cross-repo-slac-helper.md`. Its release attributions need re-checking. For example, the `AddAttributes` `is_array` fix is 5.4.4 (`262f63cd`).
- **This rebuild changes nothing in slac_helper.** Items for it go under "Needs your action" in `gesso-review-flags.md`.

## Per-release notes

*(Append one section per hop: `## 5.0.10`, `## 5.0.11`, …)*

## 5.0.10

### `includes/navigation.inc`: new `gesso_preprocess_menu()`   (not applied)

Upstream adds `is_active = TRUE` to every menu item whose `url->toString()` equals `\Drupal::request()->getRequestUri()`, paired with `menu.twig`, `mega-menu.twig` and `dropdown-menu.twig` markup changes that consume it.

- **SLAC:** `includes/navigation.inc` has `slac_preprocess_breadcrumb()`, `slac_theme_suggestions_menu_alter()` and `slac_preprocess_pager()`, but no `slac_preprocess_menu()`. Nothing in `source/` or `templates/` reads `is_active`; our menus use core's `item.in_active_trail` (`mega-menu.twig`). Adding the function alone would change nothing visible, and the Twig half is ours (skipped).
- **Drupal 11:** nothing. `\Drupal::request()` and `Url::toString()` are unchanged in D11.
- **Consumers:** a base-theme `slac_preprocess_menu()` would run for every sub-theme too (before the sub-theme's own `<subtheme>_preprocess_menu()`), adding a request-URI string compare per menu item on every page. Core's active-trail data is the better signal (the upstream comparison ignores query strings and language prefixes).
- Same finding as W6-D9's 5.0.10 note.

## 5.0.11

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.1.0

### `includes/form.inc`: form-element suggestions use underscores   (already present)

Upstream changes `gesso_theme_suggestions_form_element_alter()` from `'form-element__' . $type` / `$id` to `'form_element__' . …`.

- **SLAC:** `slac_theme_suggestions_form_element_alter()` already emits `form_element__<type>`, `form_element__<name>` and `form_element__<id with - → _>` (null-coalescing reads). It is ahead of upstream; nothing to apply.
- Why it matters: suggestions are theme-hook machine names; Drupal maps `_` to `-` only when resolving the template filename, so a hyphenated suggestion can never match. SLAC's `templates/form/form-element--current-facets.html.twig` and `form-element--keywords.html.twig` resolve against the underscore suggestions, so they are live.
- **Drupal 11:** nothing; `hook_theme_suggestions_HOOK_alter()` is unchanged.
- **Consumers:** none; no change.

## 5.1.2

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.1.3

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.1.4

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.2.0

Six PHP-layer changes, the most D10/D11-relevant set so far. Both of upstream's Drupal 10 fixes are already in SLAC.

### `gesso_helper/src/Commands/GessoHelperCommands.php`: `drupal_get_path()` replaced   (already done)

Upstream replaces the D10-removed `drupal_get_path('theme', 'gesso')` with `\Drupal::service('extension.list.theme')->getPath('gesso')`, and loosens a regex in the `gesso:setup-theme` Drush command.
- **SLAC:** `drupal_get_path` appears nowhere in `includes/`, `slac.theme`, `theme-settings.php` or `slac_helper` (checked read-only in slac-drupal-profile). No action.
- **Drupal 11:** the replacement API is the D10/D11 one.

### `gesso_helper/gesso_helper.info.yml` and `gesso.info.yml`: `^8.9 || ^9 || ^10`   (already ahead)

- **SLAC:** `slac.info.yml` and `slac_helper.info.yml` are both `^9 || ^10`. Neither allows `^11` yet; decided for hop 23 (`'^10.3 || ^11'`, review-flags A-2).
- `gesso.info.yml` also splits CKEditor stylesheets (`ckeditor4-styles.css` under `ckeditor_stylesheets`, `editor-styles.css` under a new `ckeditor5-stylesheets`) and adds a `title` region. `slac.info.yml` already has its own `ckeditor5-stylesheets` block; the region list is ours. Not applied (scope: `slac.*.yml`).

### `includes/html.inc`: `gesso_image_path` → `image_path`   (not applied)

- **SLAC:** `slac_preprocess()` sets `$variables['gesso_image_path']`, and **8 files** in `templates/` and `source/` read it. The rename would break every one unless done atomically with all of them. Skipped, as W6-D9 did (it has 9).
- **Consumers:** sub-theme templates may also read `gesso_image_path`; a rename would need a consumer grep and a release note.

### `gesso_helper/src/TwigExtension/UniqueIdTwigExtension.php`: `unique_id` becomes random   (already done in slac_helper)

Upstream changes the filter from `Html::getUniqueId()` to `Html::getId($id) . '--' . Crypt::randomBytesBase64(8)`.
- **SLAC:** `slac_helper/src/TwigExtension/UniqueIdTwigExtension.php` already returns `Html::getId($id) . '--' . Crypt::randomBytesBase64(8)` (read-only check). Storybook's `lib/uniqueId.js` is random too, so the two runtimes agree.
- Note for caching: random IDs change markup on every render, which defeats byte comparison of rendered HTML and interacts with render caching; that trade-off is already live on SLAC sites.

### `includes/file.inc` (new) + `gesso.theme` `require_once`   (not applied)

New `gesso_preprocess_file_link()` rewrites `file` classes to `c-file` (unanchored `preg_replace('/file/', 'c-file', …)`, so it would also rewrite substrings such as `file-icon`). It pairs with upstream's new `file` component, which we do not take. SLAC has no `slac_preprocess_file_link()`. Skipped together with the `require_once`.
- **Consumers:** adding it would change file-link markup on every sub-theme site.

## 5.2.1

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.2.2

Eight PHP-layer files. Six are docblock/coding-standards cleanup with no behavioural effect (`GessoHelperDirFilterExclude.php`, `GessoHelperDirFilterInclude.php`, `GessoButtonFormatter.php`, `AddAttributesTwigExtension.php`, `KeysortTwigExtension.php`, and the docblock half of `GessoHelperCommands.php`). `gesso.info.yml` drops the CKEditor 4 Google font (ours).

### `GessoHelperCommands.php`: theme path via `$this->themeHandler->getPath()`   (n/a)

Upstream swaps `\Drupal::service('extension.list.theme')->getPath('gesso')` for `$this->themeHandler->getPath('gesso')`; `ThemeHandler` has no `getPath()`, so upstream's Drush scaffolding command is broken from 5.2.2 until 5.4.6 re-injects `extension.list.theme` (W6-D9's finding).
- **SLAC:** `slac_helper/src/Commands/SlacHelperCommands.php` (read-only check) still uses `\Drupal::service('extension.list.theme')->getPath('slac')`, which is correct. Nothing to do; it only affects the sub-theme scaffolding command, never a site.

### `includes/form.inc`: new `gesso_form_alter()`   (not applied; visual)

Rewrites the entity-form delete button's classes with an anchored `preg_replace('/^button/', 'c-button', …)`.
- **SLAC:** no `slac_form_alter()` (only `slac_theme_suggestions_form_alter()` and `slac_form_views_exposed_form_alter()`). Adding it would restyle delete buttons on every site, sub-themes included.
- **Drupal 11:** `hook_form_alter()` unchanged.

### `includes/media.inc`: `align` → `u-align` in `gesso_preprocess_filter_caption()`   (not applied; visual, and unsafe)

`str_replace('align', 'u-align', $variables['classes'])` is unbounded: `text-align-center` would become `text-u-align-center` and an existing `u-align` would become `u-u-align`. It pairs with an upstream `filter-caption.html.twig` change we do not take.
- **SLAC:** `slac_preprocess_filter_caption()` reads `data-align` into an `align` variable; no class rewrite. Not applied. If ever wanted, it needs a bounded rewrite over an exploded class list.
- **Consumers:** would change caption markup on every sub-theme site.

## 5.2.3

### `includes/form.inc`: new `gesso_preprocess_field_multiple_value_form()`   (not applied; visual)

Exposes `disabled` (from `#disabled`) to the template and adds `c-button--small` to the "Add another item" button on multi-value widgets.
- **SLAC:** no `slac_preprocess_field_multiple_value_form()`. The `disabled` variable only matters with upstream's matching `field-multiple-value-form.html.twig`, which is ours-scope and not taken. Skipped.
- **Drupal 11:** the hook and the variables it reads are unchanged.
- **Consumers:** would restyle multi-value form buttons on every sub-theme site.

## 5.2.4

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.2.5

### `includes/form.inc`: new `gesso_preprocess_links__dropbutton()`   (not applied; visual)

Appends `c-button` and `c-dropbutton__button` to every link in a dropbutton (a class-array append, so none of the substring bugs of the 5.2.0/5.2.2 rewrites). It pairs with upstream's dropbutton component rewrite, which we do not take.
- **SLAC:** no `slac_preprocess_links__dropbutton()`; our `dropbutton.scss` is ours and does not assume those classes. Skipped.
- **Drupal 11:** `hook_preprocess_links__HOOK()` unchanged.
- **Consumers:** would restyle every dropbutton on every sub-theme site.

## 5.2.6

No PHP code changes.

### `gesso.info.yml`: `libraries-override` disables three `system/base` component stylesheets   (not applied)

`css/components/align.module.css`, `clearfix.module.css` and `hidden.module.css` set to `false`, pairing with upstream's own `u-align`/clearfix/hidden utilities.
- **SLAC:** `slac.info.yml` overrides `core/drupal.dropbutton`, the facets dropdown widget and `views_accordion`, but not `system/base`. Our theme has not adopted upstream's utility replacements (the 5.2.2 `u-align` rewrite was skipped), so removing core's `.align-*`, `.clearfix` and `.hidden`/`.visually-hidden` rules would break markup that relies on them. Not applied.
- **Consumers:** an override in the base theme's info file applies to every sub-theme site.
- **Drupal 11:** the three files still exist in `system/base` in D11.

## 5.2.7

### `includes/html.inc`: `drupalSettings.gesso.imagePath` attached   (already present under our key)

Upstream adds `$variables['#attached']['drupalSettings']['gesso']['imagePath']` next to its `image_path` Twig variable.
- **SLAC:** `slac_preprocess()` already attaches `drupalSettings.gesso.gessoImagePath` (`includes/html.inc:14`) alongside the `gesso_image_path` Twig variable; the external-link, mega-menu and dropdown-menu components read `gessoImagePath`. Nothing to apply.
- **If the rename is ever adopted** it is one atomic change: the PHP variable and setting, 8 templates/components reading `gesso_image_path`, the JS readers of `gessoImagePath`, the Storybook stub and `@types`, and any sub-theme template that reads `gesso_image_path`.
- **Drupal 11:** nothing.

## 5.2.8

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.3.2

21 PHP-layer files (8 new). None applied. W6-D9's notes have no 5.3.2 section, so this is from the upstream diff.

### `gesso_helper`: icon and icon-link render elements, formatters, templates   (n/a in the theme; `slac_helper` has none)

New `GessoButton`, `GessoIcon`, `GessoIconLink` render elements, an `IconLinkFormatter` plus `GessoIconTrait`/`GessoModifierClassesTrait`, a `gesso_icon` theme hook and `gesso-icon.html.twig`, config schema for the formatter settings, and `GessoButtonFormatter` gaining icon/modifier options. `GessoHelperCommands.php` reorders `use` statements; `AddAttributesTwigExtension.php` initialises `$context_attribute`.
- **SLAC:** `slac_helper` has none of these; adopting them is new functionality (a cross-repo decision), not an upgrade step. The `AddAttributesTwigExtension` fix (an undefined variable when the context has no `attributes`) is worth checking in `slac_helper` separately.
- **Drupal 11:** the new classes use `RenderElement`/`FormatterBase` APIs that exist in D10 and D11. (`RenderElement` is `@deprecated in drupal:10.3.0 and is removed from drupal:12.0.0`, checked in core 10.6.17; a port should extend `RenderElementBase`.)

### `includes/facets.inc` (new) + `gesso.theme` `require_once`   (not applied; visual)

`gesso_preprocess_facets_item_list()` sets `class="c-facet" rel="no-follow"` on facet links, adds `is-expanded`, and removes core's `facet-item*` classes; `gesso_preprocess_facets_summary_item_list()` makes summary links `c-button c-button--small`.
- **SLAC:** no `facets.inc`; we theme facets through our own `templates/misc/facets-item-list.html.twig` and the `facets/drupal.facets.dropdown-widget` override. Would change facet markup and classes on every site. Skipped.
- **Consumers:** facet-using sub-themes would see class changes (removed `facet-item`).

### `includes/navigation.inc`: `menu_local_tasks` / `menu_local_task` preprocess   (not applied; visual)

Tags primary/secondary tabs with `#level` and adds `c-button-group__link c-button c-button--base` (+ `c-button--small` for secondary) to every local-task link.
- **SLAC:** no such preprocess; our `templates/navigation/menu-local-tasks.html.twig` is ours. Would restyle admin tabs on every page for logged-in editors. Skipped.

### `includes/form.inc`, `includes/node.inc`: `?? NULL` refactors and coding standards   (n/a)

`isset(...) ? ... : NULL` → `??`, `array()` → `[]`, docblock indentation. Behaviour-neutral. SLAC's `form.inc` already uses `??` in the functions it shares.

### `includes/field.inc`: `gesso_theme_suggestions_gesso_icon_alter()`   (n/a)

Only meaningful with the `gesso_icon` theme hook above.

### `includes/libraries.inc`: `gesso_element_info_alter()` attaches `gesso/icon_link`   (n/a)

Pairs with the `gesso_icon_link` element; SLAC has no such element or library.

### `includes/paragraph.inc`: generic `gesso_preprocess_paragraph()`   (not applied)

Exposes `parent_field`, `parent_type`, `parent_bundle` to every paragraph template.
- **SLAC:** `slac_preprocess_paragraph()` already exposes `is_nested` (parent is a paragraph) and `is_dark`. Adding the upstream variables is harmless but unused by our templates. Skipped.
- **Drupal 11:** `getParentEntity()` is unchanged.

### `includes/views.inc`: `views_view` title fallback   (not applied)

When a view has no `title` variable, upstream fills it from `$view->getTitle()`.
- **SLAC:** `slac_preprocess_views_view()` sets `path` and our `is_dark` logic but no title fallback; adding it would make view titles appear where they are now blank (visual). Skipped.
- **Consumers:** would change rendered output of views embedded on sub-theme sites.

## 5.4.0

Upstream reworks its Twig extensions on both sides at once. We take the `lib/` (Storybook) side selectively so that it mirrors **`slac_helper`**, not upstream's `gesso_helper` (see the Twig runtime parity rows in `gesso-deviations.md`).

### `gesso_helper`: `UniqueIdTwigExtension.php` deleted; `unique_id` → `clean_unique_id`   (not applied)

- **SLAC:** `slac_helper.services.yml` registers `unique_id.twig_extension` (read-only check), and **20** of our templates/components use `unique_id`. The Storybook half (`lib/cleanUniqueId.js`) is held back to match. Upstream reverts the rename at 5.4.5.
- **If ever adopted:** atomic across the `slac_helper` extension and its service, `lib/`, `.storybook/preview.js`, the 20 theme files, and any sub-theme templates using `unique_id`.

### `gesso_helper`: `SubheadingLevelTwigExtension.php` added   (not applied)

A `subheading_level` filter. `slac_helper` has none; the JS half is held back too. Adoptable later as a pair (a `slac_helper` change first). Not a D11 concern (`AbstractExtension`/`TwigFilter` unchanged).

### `includes/field.inc`: `gesso_preprocess_field()` numbers paragraphs; `includes/paragraph.inc`: `paragraph_index`   (not applied)

Sets `->index` on each paragraph in an `entity_reference_revisions` field and exposes it as `paragraph_index`. Supports upstream's component rewrites (ours-scope). SLAC has no `slac_preprocess_field()` and our templates do not read `paragraph_index`. Skipped.
- **Consumers:** harmless if added (a new variable), but unused.

## 5.4.1

No PHP-layer changes (the upstream diff lists no `includes/`, `gesso.theme`, `theme-settings.php` or `gesso_helper/` files).

## 5.4.2

Five PHP-layer files. None applied.

### `gesso.info.yml`: `core_version_requirement: '^10.1'`   (not applied)

Upstream drops D8/D9. Ours stays `^9 || ^10` until the decided hop-23 change to `'^10.3 || ^11'` (with `slac_helper` in lock-step, review-flags A-2).

### `gesso_helper/src/Element/GessoButton.php`: `RenderElement` → `RenderElementBase`   (not applied)

`RenderElement` is deprecated in 10.3 and removed in **12**, not 11 (it still exists in D11 and extends `RenderElementBase`), as W6-D9 noted. SLAC has no `Element/` classes, and `slac_helper` has no `RenderElement` subclass (read-only grep). Pattern to follow if any are ever added: extend `RenderElementBase`.

### `includes/html.inc`: external-link settings; `theme_get_setting()` second argument dropped   (not applied)

- Upstream adds an `add_external_link_icons` theme setting that attaches its `external-link` library and three `drupalSettings.gesso.externalLink*` values. Ours-scope feature: SLAC's `external-link.es6.js` is its own implementation (lock/external icons, SLAC's domain list) and reads only `gessoImagePath`. The Storybook stub carries upstream's three keys now (taken with `stubs/drupal.js`); nothing reads them.
- Upstream also drops `'gesso'` from `theme_get_setting('include_back_to_top', 'gesso')` and from the `threshold`/`smooth_scroll` reads. **SLAC keeps its `'slac'` arguments** (`html.inc` ×3, `navigation.inc` ×1): STATE decision and trap S7. Without the argument a `base theme: slac` sub-theme reads its *own* settings, which it never sets, so the base theme's values would stop applying. (W6-D9 suggested the opposite tidy for its own theme; it has no sub-themes.)
- **D11:** nothing.

### `includes/views.inc`: title only when the view has one   (not applied)

`gesso_preprocess_views_view()` now sets `title` only if `$view->getTitle()` is non-empty. `slac_preprocess_views_view()` has no title handling at all (it sets `path` and `is_dark`), so there is nothing to mirror.

### `theme-settings.php`: the external-link settings form   (not applied)

Form half of the `html.inc` feature above. The one decided `theme-settings.php` change (typed signature, `$theme` from `config_key`) lands after hop 23.

## 5.4.3

Seven PHP-layer files. None applied.

### `gesso_helper` Twig extensions: `[$this, 'method']` → `$this->method(...)`   (not applied)

`AddAttributes`, `Keysort` and `SubheadingLevel` switch their callables to PHP 8.1 first-class callable syntax. Behaviour is identical; Drupal 10 already requires PHP 8.1, so either form works on D10 and D11. `slac_helper`'s `Keysort`, `UniqueId` and `AddAttributes` extensions still use `[$this, 'method']` (read-only check); nothing to do there.

### `includes/navigation.inc`: `gesso_preprocess_menu()` accepts string URLs   (not applied)

A guard for menu items whose `url` is already a string. SLAC has no `slac_preprocess_menu()` (see 5.0.10), so there is nothing to guard.

### `includes/node.inc`, `taxonomy.inc`, `user.inc`: `_add_regions_to_template()` → `_gesso_add_regions_to_template()`   (not applied)

Upstream namespaces its private helper. SLAC defines `_add_regions_to_template()` in `node.inc` and calls it from `media.inc`, `node.inc`, `taxonomy.inc` and `user.inc`. **Not renamed** (STATE decision: the old branch's `_slac_` helper rename is not re-landed). Sub-theme angle: an un-prefixed global function can collide with a module or sub-theme defining the same name, which is the reason upstream prefixed it; nothing in the profile checkout's custom themes calls or defines it (read-only grep; the six consumer sites were not checked). A rename would be a PHP public-surface change for sub-themes, so it stays a documented option.
- **D11:** nothing.

## 5.4.4

32 PHP-layer files, +134/−126: mostly upstream's phpcs/phpstan pass (`: void` return types, typed parameters, docblocks) plus its first Drupal 11 changes. None applied.

### `gesso.info.yml`: `core_version_requirement: '^10.1 || ^11.0'`; `gesso_helper` `^… || ^11`, `php >=8.1`, Drush 11/12 service ranges   (not applied)

Upstream's D11 opening. Ours changes at hop 23 to the decided `'^10.3 || ^11'`, with `slac_helper` in lock-step (review-flags A-2).

### `gesso_helper` `AddAttributesTwigExtension`: accepts an array `attributes` (`262f63cd`)   (not applied; flagged for slac_helper)

`add_attributes()` now wraps a context attribute that is a plain array in `new Attribute()` instead of calling methods on the array. **`slac_helper`'s copy lacks it** (read-only check): it only creates an `Attribute` when the value is empty. With a non-empty array it then calls `->offsetExists()` / `->removeAttribute()` on the array, a fatal error. Worth taking in `slac_helper`: review-flags **A-4** (optional; another repo). The Storybook half (`lib/addAttributesTwigExtension.js`) needs no change.

### `includes/media.inc`: `FilteredMarkup::create()` → `Markup::create()`   (not applied: STATE decision)

`Drupal\filter\Render\FilteredMarkup` is `@internal` in core 10.6.17 but present and not deprecated, so SLAC's `slac_preprocess_filter_caption()` keeps working (D11 not checked here: no D11 core checkout). The STATE decision stands: this is one of the old branch's changes that is **not** re-landed.

### `includes/navigation.inc`: `gesso_preprocess_menu()` D11 URL fix   (not applied)

Handles an empty `url` and checks `instanceof Url` before `toString()`. SLAC has no `slac_preprocess_menu()` (see 5.0.10).

### `theme-settings.php`: typed signature `(array &$form, FormStateInterface $form_state, ?string $form_id = NULL): void`   (not applied here)

The decided post-upgrade commit re-lands the typed signature and `$theme` from `config_key` from `f712137`; it lands after hop 23, not in the hop.

### The rest   (not applied)

`: void` / parameter types across `includes/*.inc` and `gesso_helper`, `GessoHelperCommands` and the dir-filter classes typed, `form.inc`/`html.inc` reformatting. No behaviour change; SLAC's `includes/` has its own functions. **D11:** the only D11-relevant upstream items are the version constraints and the menu URL guard above.

## 5.4.5

Eight PHP-layer files. None applied.

### `gesso_helper`: `UniqueIdTwigExtension.php` and its service restored   (not applied; nothing to do)

The other half of upstream's `clean_unique_id` revert (see 5.4.0). The restored class (`Html::getId($id) . '--' . Crypt::randomBytesBase64(8)`) is the same implementation `slac_helper` has always kept (read-only check), with the same `unique_id` filter. Drupal and Storybook are in parity again with no change on our side.

### `includes/libraries.inc`: `gesso_library_info_alter()` opts `dist/js/*` out of JS aggregation   (not applied; worth considering)

New: for the theme's own libraries, every `dist/js/*` file gets `preprocess: FALSE` (upstream commit `af67369f`, "stop aggregating theme js"). With aggregation on, core's `JsOptimizer` (10.6.17) re-parses each preprocessed file with Peast and re-prints it compactly; on a parse error it logs and serves the file unminified. So webpack/terser output is minified twice, and a Peast parse or render problem would surface only on sites with aggregation on, never in Storybook or our `dist/` checks.
- **SLAC:** `slac_library_info_build()` defines `slac/common`; `slac.libraries.yml` sets no `preprocess` anywhere. Not applied (PHP layer, document-only), but a reasonable post-merge follow-up: a `slac_library_info_alter()` of the same shape.
- **Consumers:** a base-theme `hook_library_info_alter()` guarded by `$extension === 'slac'` would change only `slac/*` libraries; sub-themes' own libraries keep their settings. Cost: those files are served one by one instead of inside the aggregate (cheap over HTTP/2).
- **D11:** not checked here (no D11 core checkout); the hook itself is unchanged in D11.

### `includes/navigation.inc`: the menu URL guard simplified; `c-button-group-item__link` class   (not applied)

`gesso_preprocess_menu()` (which SLAC does not have) gets a simpler guard; a local-tasks link class is renamed to match upstream's button-group markup (ours-scope).

### `gesso_helper/src/Element/*`: annotation `@RenderElementBase(...)` → `@RenderElement(...)`   (not applied)

Upstream's 5.4.2 class rename had also rewritten the plugin annotation; the annotation name must stay `@RenderElement`. SLAC has no `Element/` classes.

### `includes/field.inc`   (not applied)

`: void` only.

## 5.4.6

14 PHP-layer files, plus the two `.info.yml` changes. Applied: only the decided `core_version_requirement`.

### `gesso.info.yml` / `gesso_helper.info.yml`: `core_version_requirement: '^10.3 || ^11'`   (applied to `slac.info.yml`: the STATE decision)

`slac.info.yml` goes `^9 || ^10` → `'^10.3 || ^11'`, W6-D9's and upstream's value. `slac_helper` must get the same bump and be released before the theme is tagged (review-flags **A-2**). What supports D11 here is static: these notes found no D11 blocker in upstream's PHP across 23 releases, and a fixed-string scan of SLAC's `includes/`, `slac.theme` and `theme-settings.php` for 25 APIs removed by D10/D11 (`drupal_get_path`, `file_create_url`, `drupal_set_message`, `db_query`, `entity_load`, `drupal_render(`, `SafeMarkup`, `format_date`, `user_load`, `node_load`, `drupal_add_js`, `->url(`, …) finds none (next item for the one D11.3 deprecation). Nothing has been run on a D11 site.

### `gesso_helper`: `ThemeSettings` service and `gesso_helper_get_theme_setting()`; `theme_get_setting()` replaced throughout   (not applied)

Drupal 11.3 deprecates `theme_get_setting()` in favour of the `ThemeSettingsProvider` service (removal in Drupal 13). Upstream adds a wrapper service that uses the provider when it exists (optional argument `@?Drupal\Core\Extension\ThemeSettingsProvider`) and falls back to `theme_get_setting()` on 10.3–11.2, and routes every call through it.
- **SLAC:** 18 `theme_get_setting()` calls (`html.inc` 4, `region.inc` 2, `block.inc`, `navigation.inc`, `page.inc` 1 each, `theme-settings.php` 9). They keep working on D10 and D11 (deprecation notices from 11.3), so they are not a blocker for the `'^11'` declaration. A `slac_helper` wrapper of the same shape would be the D13-proof version; another repo, so not here.
- **Consumers:** sub-themes calling `theme_get_setting()` themselves are unaffected either way.

### `includes/html.inc`, `navigation.inc`: config dependency from the active theme, not `gesso.settings`   (not applied)

Upstream now adds the cacheable dependency on `\Drupal::config($activeTheme . '.settings')` instead of the base theme's. SLAC's `html.inc` (×2) and `navigation.inc` use `slac.settings`; on a sub-themed site the settings a page reads are the sub-theme's (`theme_get_setting()` without a theme argument), so the cache tag should be the sub-theme's too. A real, small sub-theme cache-invalidation fix, but a PHP-layer change: documented, not applied. (SLAC's `theme_get_setting(…, 'slac')` calls read the base theme's settings on purpose, trap S7; for those, `slac.settings` is the right tag. A fix would have to follow each call's theme argument.)

### `includes/libraries.inc`: `gesso_library_info_build()` removed; `common:` becomes a static library in `gesso.libraries.yml`   (not applied; recommended follow-up)

Upstream defines `gesso/common` statically (`dist/js/common.js`) instead of building it for the active theme only. This is exactly SLAC's known pre-existing issue: `slac_library_info_build()` defines `slac/common` only when the active theme's own `dist/js/common.js` exists, so on sub-themed sites `slac/common` is undefined (slac-today works around it). A static `common:` entry in `slac.libraries.yml` fixes that, but changes `slac.libraries.yml` and `libraries.inc` (ours-scope, a library-definition change for consumers); recommended as a post-merge follow-up, see the register's known issues. Upstream also renames its `external-link` library to `external_link`; SLAC has no separate library for it (`dist/js/external-link.es6.js` is part of `slac/global`).

### `theme-settings.php`: `$theme` from `config_key`   (not applied here)

Part of the decided post-upgrade commit (the typed signature and `$theme` from `config_key`, from `f712137`).

### `gesso_helper` Drush command: `ThemeHandlerInterface` → `ThemeExtensionList`   (not applied)

`ThemeHandlerInterface::rebuildThemeData()` is deprecated in 10.3 and removed in **12** (core 10.6.17's docblock); upstream moves its sub-theme generator to `extension.list.theme`. SLAC has no Drush commands in the theme; `slac_helper` has none of this.

## Post-upgrade: `theme-settings.php` (applied; the STATE decision)

The one PHP change the rebuild applies, from the old branch (`f712137`), and the same logic upstream ships at 5.4.4 (typed signature) and 5.4.6 (`$theme` from `config_key`):
- **Signature** `slac_form_system_theme_settings_alter(array &$form, FormStateInterface $form_state, ?string $form_id = NULL): void`. The existing "work-around for a core bug affecting admin themes" tests `isset($form_id)`, which was never a parameter, so it was dead code. Core's `ThemeSettingsForm::buildForm()` (10.6.17) calls the function with two arguments, so `$form_id` stays `NULL` and the form is built; when the generic form-alter path also calls it (three arguments, `slac` as the active theme), it now returns early as intended.
- **`$theme` from `$form['config_key']`** (`slac.settings` → `slac`, `<subtheme>.settings` → the sub-theme), else the active theme. All nine `theme_get_setting()` reads pass it. Before, they read the **active** theme's settings, which on `/admin/appearance/settings/<theme>` is normally the admin theme, so the form showed the wrong defaults for `slac` and for every sub-theme.
- **Not re-landed** (STATE decision): the `theme_get_setting()` argument drop elsewhere, `FilteredMarkup` → `Markup`, the `_slac_` helper rename.
- **Consumers:** sub-themes' own `theme-settings.php` files are untouched; their settings pages now show their own saved values in `slac`'s fields.
- Checked with `php -l` only; not exercised on a site.
