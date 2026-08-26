# Phase 5 — PHP hygiene fixes in `includes/*.inc`

No dependency on the earlier phases; can be done independently. Both items below are pure
renames/substitutions with identical runtime behavior — they don't change any preprocessed
variable, template suggestion, or rendered value, so they satisfy the no-output-change
constraint by inspection, not just by exclusion.

Everything else this diff changes in `includes/*.inc` (`block.inc`, `facets.inc`, `field.inc`,
`file.inc`, `form.inc`, `html.inc`, `navigation.inc`, `paragraph.inc`, `taxonomy.inc`,
`user.inc`, `views.inc`) is either a bare PHP type-hint addition on upstream's own
`gesso_*`-prefixed functions (which don't exist in this theme's `slac_*`-prefixed equivalents —
nothing to port) or depends on `gesso_helper_get_theme_setting()` / the excluded
`hook_library_info_alter()` rewrite, both covered in the plan README's exclusion table.
`includes/libraries.inc` is excluded entirely — see the README.

## 5.1 `includes/media.inc` — `FilteredMarkup` → `Markup`

Upstream replaces the deprecated `Drupal\filter\Render\FilteredMarkup` with
`Drupal\Core\Render\Markup`. `FilteredMarkup` extends `Markup` and adds no behavior beyond it
for this use case (`FilteredMarkup::create()` and `Markup::create()` both just wrap an
already-sanitized string as `\Drupal\Component\Render\MarkupInterface` so Twig won't re-escape
it) — this is a forward-compatibility fix for a class that Drupal core has deprecated, not a
behavior change.

In `includes/media.inc`:

- [x] Change `use Drupal\filter\Render\FilteredMarkup;` to `use Drupal\Core\Render\Markup;`.
- [x] Change `$variables['node'] = FilteredMarkup::create(Html::serialize($dom));` to
      `$variables['node'] = Markup::create(Html::serialize($dom));` (inside
      `slac_preprocess_filter_caption()`).
- [x] Confirm no other file in this theme references `FilteredMarkup` (only this one call site
      does). Confirmed via repo-wide grep — zero remaining references.

## 5.2 Namespace the shared `_add_regions_to_template()` helper

`includes/node.inc` defines a bare, unprefixed `_add_regions_to_template($allowed_regions,
&$variables)` helper, called from three other files. Upstream renames its equivalent to
`_gesso_add_regions_to_template()` specifically to stop it colliding with any other module or
theme that happens to define a same-named global function — a real (if low-probability) fatal-
error risk today, since PHP would error on redeclaration. Apply the same fix with this theme's
own prefix.

- [x] `includes/node.inc`: rename the function definition
      `function _add_regions_to_template($allowed_regions, &$variables) {` to
      `function _slac_add_regions_to_template($allowed_regions, &$variables) {`, and update its
      own call site inside `slac_preprocess_node()` to match.
- [x] `includes/media.inc`: update the call inside `slac_preprocess_media()` (in the
      `view_mode == 'full'` branch) from `_add_regions_to_template(...)` to
      `_slac_add_regions_to_template(...)`.
- [x] `includes/taxonomy.inc`: update the call inside `slac_preprocess_taxonomy_term()`.
- [x] `includes/user.inc`: update the call inside `slac_preprocess_user()`.
- [x] Grep for any other bare `_add_regions_to_template(` call sites outside `includes/` before
      considering this done (e.g. in `.theme`, custom modules that theme-hook into this) —
      none were found in this repo's own `includes/` tree beyond the four listed above, but this
      theme is shipped as a Composer package consumed by other sites, so double-check nothing
      else in this repo calls it by the old name. Confirmed: repo-wide grep (excluding
      node_modules/.git/vendor) found no remaining bare-name call sites; only hits outside
      `includes/` were in plan documentation prose.

**Phase 5 status: complete.**
