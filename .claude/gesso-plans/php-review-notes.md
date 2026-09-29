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

## 5.1.0

### `includes/form.inc`: form-element suggestions use underscores   (already present)

Upstream changes `gesso_theme_suggestions_form_element_alter()` from `'form-element__' . $type` / `$id` to `'form_element__' . …`.

- **SLAC:** `slac_theme_suggestions_form_element_alter()` already emits `form_element__<type>`, `form_element__<name>` and `form_element__<id with - → _>` (null-coalescing reads). It is ahead of upstream; nothing to apply.
- Why it matters: suggestions are theme-hook machine names; Drupal maps `_` to `-` only when resolving the template filename, so a hyphenated suggestion can never match. SLAC's `templates/form/form-element--current-facets.html.twig` and `form-element--keywords.html.twig` resolve against the underscore suggestions, so they are live.
- **Drupal 11:** nothing; `hook_theme_suggestions_HOOK_alter()` is unchanged.
- **Consumers:** none; no change.
