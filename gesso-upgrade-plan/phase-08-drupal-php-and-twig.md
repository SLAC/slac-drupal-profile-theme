# Phase 8 — Drupal PHP and Twig

**Goal:** apply the small set of upstream Drupal-side changes that are output-identical, and
surface the two decisions that are not this plan's to make.

**Diff reference:** lines 1432–1466 (`gesso.info.yml`), 1747–1760 (`gesso.theme`),
2933–3399 (`includes/**`), 26383–26420 (`theme-settings.php`).

**Not blocking.** Land as its own PR.

**Context:** this theme's PHP is already modernized relative to upstream 5.0.9 — there are
zero `isset($x) ? $x : NULL` ternaries left in `includes/`, so the bulk of upstream's
`includes/form.inc` and `includes/field.inc` cleanup is already done here. What remains is
small.

---

## 8.1 `theme_get_setting()` — drop the redundant second argument (APPLY)

Upstream drops the explicit theme name from `theme_get_setting()` calls. This theme is
`base theme: false`, so `theme_get_setting('x')` and `theme_get_setting('x', 'slac')`
resolve identically when `slac` is the active theme. Dropping the argument is more correct
(it works if the theme is ever subthemed) and output-identical.

Diff reference: lines 3174–3196.

Four call sites:

- [ ] `includes/html.inc:23` — `theme_get_setting('include_back_to_top', 'slac')`
      → `theme_get_setting('include_back_to_top')`
- [ ] `includes/html.inc:37` — `theme_get_setting('threshold', 'slac')`
      → `theme_get_setting('threshold')`
- [ ] `includes/html.inc:39` — `theme_get_setting('smooth_scroll', 'slac')`
      → `theme_get_setting('smooth_scroll')`
- [ ] `includes/navigation.inc:16` — `theme_get_setting('include_current_page_in_breadcrumb', 'slac')`
      → `theme_get_setting('include_current_page_in_breadcrumb')`

Verify none remain: `grep -rn "theme_get_setting([^)]*," includes *.php` returns nothing.

- [ ] **Do not** apply the rest of the `gesso_page_attachments_alter()` hunk. Upstream
      restructures it to add the external-link settings; that component is excluded. Keep this
      theme's `if ($include_back_to_top) { … }` shape and its SLAC-specific
      `HTTP_X_MASKED_PATH` block untouched.

---

## 8.2 `includes/node.inc` — docblock indentation (APPLY, cosmetic)

Diff lines 3330–3334: the `_add_regions_to_template()` docblock has misaligned asterisks.

- [ ] Fix if this theme's copy has the same defect:
      `sed -n '18,24p' includes/node.inc`. Purely cosmetic.
- [ ] **Do not** apply the `array()` → `[]` conversions from lines 3338–3351 unless this
      theme's copy still uses `array()` — check `grep -n 'array(' includes/node.inc`. If it
      does, converting is output-identical and worth doing for coding-standards compliance.

---

## 8.3 `core_version_requirement` — DECISION REQUIRED, not applied

Upstream: `core_version_requirement: ^8.9 || ^9` → `'^10.1'`.
This theme: `core_version_requirement: ^9 || ^10`.

This is a **product decision about which Drupal versions the package supports**, not a
tooling change. Narrowing it to `^10.1` would make Composer refuse to install this theme on
any Drupal 9 or Drupal 10.0 site.

- [ ] **Do not change it as part of this upgrade.**
- [ ] Raise separately: does any consuming site still run Drupal 9? If not, bump to
      `'^10.1 || ^11'` (note upstream 5.4.2 predates D11 support; `^10.1` alone would block
      D11 sites).
- [ ] If it *is* bumped, the `dependencies` list in `slac.info.yml` (`components`,
      `slac_helper`, `twig_tweak`) should be re-checked for D10-only versions.

---

## 8.4 `gesso_image_path` → `image_path` — OPTIONAL, deferred by default

Upstream renames the preprocess variable (diff lines 3164–3168):

```php
// before
$variables['gesso_image_path'] = '/' . $variables['directory'] . '/dist/images';
// after
$variables['image_path'] = '/' . $variables['directory'] . '/dist/images';
$variables['#attached']['drupalSettings']['gesso']['imagePath'] = '…';
```

**Output-identical if done completely; broken images if done partially.** This theme has
11 in-repo references plus a Storybook stub and a global-data key. All of them are in this
repo — there is no cross-repo coupling — so the rename *is* safely doable. It just has zero
functional benefit, which is why it is not the default.

### Recommendation

**Skip it.** The variable name is internal, the current name is consistent across the theme,
and the no-visual-change goal is better served by not touching 13 files for a rename. Record
the deviation and move on.

### If you do it anyway — complete file list

- [ ] `includes/html.inc:13` — `$variables['gesso_image_path']` → `$variables['image_path']`
- [ ] `includes/html.inc:14` — `drupalSettings['gesso']['gessoImagePath']` →
      `drupalSettings['gesso']['imagePath']`
- [ ] `source/00-config/storybook.global-data.yml:55` — `gesso_image_path: 'images'` →
      `image_path: 'images'`
- [ ] `.storybook/stubs/drupal.js` — `gessoImagePath: 'images'` → `imagePath: 'images'`
      (created in Phase 5, §5.5)
- [ ] `source/03-components/icon/icon.twig:25,35` — `{{ gesso_image_path }}` → `{{ image_path }}`
- [ ] `source/03-components/mega-menu/mega-menu.twig:60` — the `include`/`with` key **and** value
- [ ] `source/03-components/search/search.twig:63` — same
- [ ] `source/02-layouts/subfooter/subfooter.twig:19,45,53` — three `gesso_image_path ~ '/…'`
      concatenations
- [ ] `templates/form/facet-label.html.twig:27` — the `'gesso_image_path': gesso_image_path` pair
- [ ] `templates/layout/html.html.twig:59` — `gesso_image_path: gesso_image_path,`
- [ ] `templates/navigation/menu--extras--social-links.html.twig:1` — the **macro parameter name**
- [ ] `templates/navigation/menu--extras--social-links.html.twig:70` — the `include`/`with` pair
- [ ] `templates/navigation/menu--extras--social-links.html.twig:91` — the macro **call argument**
- [ ] Also grep any JS that reads `drupalSettings.gesso.gessoImagePath`:
      `grep -rn "gessoImagePath" source .storybook`
- [ ] Authoritative sweep before committing:
      `grep -rn "gesso_image_path\|gessoImagePath" . --exclude-dir=node_modules --exclude-dir=.git`
      must return nothing.
- [ ] Verify in Storybook that every icon and the subfooter logos still render (they are the
      only consumers of the path).

---

## 8.5 Everything else in the Drupal-side diff — NOT applied

Restating with the specific reason for each, since these are the changes most likely to look
like "just conventions" but aren't:

| Change | Diff lines | Why not |
| --- | --- | --- |
| `includes/facets.inc` (new file) | 2933–2978 | Adds `c-facet` / `c-button c-button--small` classes to facet links and rewrites facet item classes. This theme has its own facet handling (`slac.info.yml` overrides `facets/drupal.facets.dropdown-widget`, and there are `dropdown_widget`/`input_widget` libraries plus `templates/form/facet-label.html.twig`). Upstream's version would fight it. |
| `includes/file.inc` (new file) | 3019–3040 | Rewrites file-link classes to `c-file`; depends on the excluded `file` component's CSS. |
| `gesso.theme` → `require` `facets.inc` + `file.inc` | 1747–1760 | Follows from the two above. **Do not add the requires** — `require_once` on a nonexistent file is a fatal. |
| `includes/form.inc` → `gesso_form_alter()` | 3049–3057 | Rewrites the delete button's class from `button` to `c-button`. Markup change. |
| `includes/form.inc` → `gesso_preprocess_field_multiple_value_form()` | 3076–3089 | Adds `c-button--small` to add-more buttons. Markup change. |
| `includes/form.inc` → `gesso_preprocess_links__dropbutton()` | 3139–3155 | Adds `c-button c-dropbutton__button` to dropbutton links. Markup change, and this theme has its own jQuery dropbutton implementation. |
| `includes/form.inc` → `form-element__` → `form_element__` suggestion rename | 3129–3135 | **Actively dangerous.** Changes which template files Drupal matches. This theme has `templates/form/form-element*.html.twig` overrides keyed on the current naming — the rename silently drops them. |
| `includes/field.inc` → `gesso_preprocess_field()` paragraph index | 2987–3004 | Adds a `$paragraph->index` property consumed by the excluded `gesso_preprocess_paragraph()`. |
| `includes/field.inc` → `gesso_theme_suggestions_gesso_icon_alter()` | 3013–3018 | `gesso_icon` is a render element provided by `gesso_helper`; the `slac_helper` equivalent may not exist. |
| `includes/paragraph.inc` → `gesso_preprocess_paragraph()` | 3360–3377 | Adds `paragraph_index`, `parent_field`, `parent_type`, `parent_bundle` variables. Additive to Twig context, but pairs with the field.inc change and with excluded templates. |
| `includes/navigation.inc` → `gesso_preprocess_menu()` | 3281–3291 | Adds `is_active` to menu items. This theme's `source/02-layouts/nav/nav.twig` and menu templates are diverged; adding the variable is harmless, but the upstream templates that consume it are excluded, so it's dead weight. |
| `includes/navigation.inc` → `gesso_preprocess_menu_local_tasks()` / `_local_task()` | 3293–3322 | Adds `c-button-group__link c-button c-button--base` (+ `c-button--small`) to local task links. Markup change. |
| `includes/media.inc` → `align` → `u-align` class rewrite | 3255–3259 | Changes caption alignment classes on every embedded media item. Markup change, and depends on `u-align*` utilities existing in `source/06-utility`. |
| `includes/views.inc` → auto-populate `$variables['title']` | 3387–3396 | Makes views render a title where they previously rendered none. Markup change. |
| `includes/libraries.inc` → `gesso_element_info_alter()` | 3239–3246 | Attaches `gesso/icon_link` to the `gesso_icon_link` element. Both the element and the library are excluded. |
| `includes/html.inc` → external-link `drupalSettings` | 3189–3221 | Ships the excluded `external-link` component. |
| `theme-settings.php` → External Links fieldset | 26391–26419 | Same. Would also need matching keys in `config/schema/slac.schema.yml`, which the diff does not provide for this theme. |
| `gesso.info.yml` → `libraries-override: system/base` CSS disables | 1446–1451 | Removes core `align.module.css`, `clearfix.module.css`, `hidden.module.css` from every page. Real visual change. |
| `gesso.info.yml` → `title` region | 1463 | Adds a region; needs block placement config (excluded) and a `page.html.twig` change. |
| `gesso.info.yml` → `ckeditor4-styles.css` | 1452–1456 | Requires a `source/ckeditor4-styles.scss` that doesn't exist here. This theme deliberately loads its font stack into both CKEditor 4 and 5 — leave `ckeditor_stylesheets` / `ckeditor5-stylesheets` exactly as they are. |
| `gesso.libraries.yml` → ~25 new library entries | 1486–1746 | All point at `dist/` artifacts for excluded components. |
| `gesso.libraries.yml` → remove `core/jquery` from `dropbutton` | 1551 | This theme's dropbutton **is** the jQuery implementation. Removing the dependency breaks it. |
| `config/install/*`, `config/optional/*` | 1322–1370 | No `config/install/` in this repo. |
| `gesso_helper/**` | 1761–2932 | Separate repo. See [`cross-repo-slac-helper.md`](cross-repo-slac-helper.md). |
| `templates/**` (107 files) | throughout | Diverged tree; wholesale application changes markup everywhere. |
| `source/**` component SCSS/Twig/JS/YML | throughout | See `README.md` § B. |

---

## 8.6 One thing worth cherry-picking later

`gesso.libraries.yml`'s most useful structural change is the one **not** tied to new
components: upstream makes every library that ships component JS declare its own
`core/drupal`, `core/once` and `gesso/common` dependencies explicitly, rather than relying on
`global` having loaded them. The README section added at diff lines 1062–1080 explains why
(`common.js` is production-only, so a missing dependency shows up on staging, not locally).

This theme is **mostly** already doing that — 21 of its libraries declare `slac/common` — but
four ship JS without it. Findings from a scan of `slac.libraries.yml` against the source:

| Library | Ships | Declares | Gap |
| --- | --- | --- | --- |
| `back_to_top` | `dist/js/back-to-top.es6.js`, which does `import Drupal from 'drupal'` and reads `settings.gesso.backToTopThreshold` | **no dependencies at all** | Missing `core/drupal`, `core/drupalSettings`, and `slac/common`. `Drupal` is a webpack external, so this only works today because `slac/global` happens to have loaded `core/drupal` first. Genuine latent bug. |
| `addtocal_a11y` | `dist/js/addtocal-a11y.es6.js`, which does `import jQuery from 'jquery'` | **no dependencies at all** | Missing `core/jquery` and `slac/common`. Same latent-ordering problem, and this one is attached via `libraries-extend` on `addtocal/addtocal`, so `slac/global` is not guaranteed to have run. |
| `alert_bar` | `dist/js/alert-bar.es6.js` (no imports — plain DOM listener) | none | Only `slac/common` is arguably needed, and only if the file ever grows a shared import. Lowest priority. |
| `dropbutton` | `dist/js/dropbutton.es6.js` | `core/jquery`, `core/drupal`, `core/drupalSettings`, `core/once` | Missing `slac/common` only. |

- [ ] Verify each finding against the current source before changing anything (the scan
      above is a starting point, not gospel): for each library, read the JS it ships and list
      every `import` at the top.
- [ ] Add the missing `core/*` dependencies. **This is the real fix** — a library that uses
      the `Drupal` global without declaring `core/drupal` is relying on load order it does not
      control.
- [ ] Add `slac/common` wherever the shipped JS imports anything from `source/06-utility/` or
      `source/00-config/_KEYCODE.es6.js` — those get split into `dist/js/common.js` on
      **production builds only**, so a missing dependency reproduces on staging and not
      locally.
- [ ] Re-verify after Phase 2: `webpack.production.js`'s `splitChunks` must still emit
      `dist/js/common.js` (see Phase 2, §2.9), otherwise `slac_library_info_build()` never
      registers `slac/common` and all 21+ declarations resolve to nothing.

Do this as its own commit with the audit results in the message — it is the highest-value
non-visual change available from this diff.

---

## Definition of done

- Four `theme_get_setting()` calls simplified; `grep -rn "theme_get_setting([^)]*," includes *.php`
  is empty.
- `core_version_requirement` unchanged, with the decision raised separately.
- `gesso_image_path` rename skipped (or completed across all 13 references and verified).
- `slac.libraries.yml` dependency audit done (§8.6).
- No new `require_once` lines in `slac.theme`.
- `git diff --stat -- templates/` is empty.
