# Cross-repo follow-up — `slac_helper`

**Not part of this upgrade.** This file records what the 5.0.9 → 5.4.2 diff changes in
upstream's `gesso_helper` submodule, so a maintainer can decide what (if anything) to port to
the separate `slac_helper` Drupal module.

---

## Why this is separate

Upstream Gesso ships a `gesso_helper/` directory inside the theme — a Drupal module that
provides Twig extensions, render elements, field formatters, and a Drush command. **This repo
has no such directory.** `slac.info.yml` instead declares:

```yaml
dependencies:
  - components
  - slac_helper
  - twig_tweak
```

`slac_helper` is a separate package with its own repository and release cycle. Nineteen files
in the diff (lines 1761–2932) belong to it, and none of them can be applied here.

---

## What the diff changes in `gesso_helper`

| File | Diff lines | Change |
| --- | --- | --- |
| `gesso_helper.info.yml` | 1810–1819 | `core_version_requirement: ^8.9 \|\| ^9` → `^8.9 \|\| ^9 \|\| ^10` |
| `gesso_helper.module` | 1820–1838 | Adds `hook_theme()` registering a `gesso_icon` render element |
| `gesso_helper.services.yml` | 1839–1850 | **Removes** the `unique_id.twig_extension` service |
| `src/TwigExtension/UniqueIdTwigExtension.php` | 2883–2917 | **Deleted** (see § "The `unique_id` story") |
| `src/TwigExtension/SubheadingLevelTwigExtension.php` | 2835–2882 | **New** — registers the `subheading_level` Twig filter |
| `src/TwigExtension/AddAttributesTwigExtension.php` | 2793–2821 | Docblock fixes + initialises `$context_attribute = []` before the reference assignment (a real defensive fix) |
| `src/TwigExtension/KeysortTwigExtension.php` | 2822–2834 | Docblock only |
| `src/Element/GessoButton.php` | 1898–2008 | **New** — `gesso_button` render element (link styled as a button, with icon options) |
| `src/Element/GessoIcon.php` | 2009–2072 | **New** — `gesso_icon` render element |
| `src/Element/GessoIconLink.php` | 2073–2184 | **New** — `gesso_icon_link` render element |
| `src/Plugin/Field/FieldFormatter/GessoButtonFormatter.php` | 2261–2443 | Extended with icon settings (`icon_name`, `icon_is_hidden`, `icon_label`, `icon_position`, `icon_direction`, `modifier_classes`) |
| `src/Plugin/Field/FieldFormatter/IconLinkFormatter.php` | 2616–2792 | **New** — `gesso_helper_icon_link` field formatter |
| `src/Plugin/Field/FieldFormatter/GessoIconTrait.php` | 2444–2543 | **New** — shared icon settings form/validation |
| `src/Plugin/Field/FieldFormatter/GessoModifierClassesTrait.php` | 2544–2615 | **New** — shared modifier-classes setting |
| `config/schema/gesso_helper.schema.yml` | 1761–1809 | Schema for the new formatter settings above |
| `src/Commands/GessoHelperCommands.php` | 1851–1897 | `drupal_get_path()` → `$this->themeHandler->getPath()` (D10 compat); use-statement ordering; drops the `gesso_image_path` exclusion from the rename regex |
| `src/GessoHelperDirFilterExclude.php` | 2185–2216 | Docblock only |
| `src/GessoHelperDirFilterInclude.php` | 2217–2260 | Docblock only |
| `templates/gesso-icon.html.twig` | 2918–2932 | **New** — template for the `gesso_icon` element |

---

## The `unique_id` story — read this before touching Twig

This is the one item that couples the two repos, and the coupling is weaker than it first
looks.

**What upstream did:** deleted `UniqueIdTwigExtension.php` and its service registration, then
switched every Twig call site from `|unique_id` to `|clean_unique_id`.

**Why that works:** `clean_unique_id` is a **Drupal core** Twig filter, registered by
`Drupal\Core\Template\TwigExtension` and bound to
`\Drupal\Component\Utility\Html::getUniqueId()` — the exact callable the deleted custom
extension used. The custom filter was redundant.

**Consequence for this repo:** renaming the 28 `|unique_id` call sites in `source/` and
`templates/` does **not** require a `slac_helper` release. It is functionally a no-op.

**But verify before you do it.** Run this on a site at the lowest supported Drupal version
(`slac.info.yml` says `^9 || ^10`):

```bash
drush php:eval "print_r(array_map(fn(\$f) => \$f->getName(), \Drupal::service('twig')->getFilters()));" | grep unique
```

Expect `clean_unique_id` in the output. If it is missing, the rename needs `slac_helper` to
register it and the risk profile changes completely.

Sequencing and the full call-site list are in [Phase 4, §4.6](phase-04-lib-and-twig-extensions.md).

- [ ] Separately: check whether `slac_helper` still registers a `unique_id` filter. If it
      does, that is now dead code once the rename lands — but leave it in place until the
      rename is verified in production, as a rollback path.

---

## Recommended triage for `slac_helper`

Ordered by value, highest first. None of this is required by the theme upgrade.

### 1. `AddAttributesTwigExtension.php` defensive fix — worth porting

```php
+    $context_attribute = [];
     $context_attribute = &$context;
```

Guards against an undefined-variable notice when the reference walk hits a missing segment.
Small, safe, output-identical. If `slac_helper` carries a copy of this extension, port it.

- [ ] Check whether `slac_helper` has its own `AddAttributesTwigExtension`. If so, port the
      one-line fix.

### 2. `GessoHelperCommands.php` D10 compatibility — port if the command still exists

`drupal_get_path()` was **removed in Drupal 10**. If `slac_helper` carries a descendant of
this Drush command, it is already broken on D10.

- [ ] Check for a `slac_helper` Drush command using `drupal_get_path()`. Replace with
      `$this->themeHandler->getPath('slac')`.
- [ ] More likely: the command is the "rename Gesso to your theme name" scaffolder, which is
      useless for an already-renamed theme. If so, **delete it** rather than fixing it.
- [ ] Note the diff also drops `(?!_image_path)` from the rename regex — that only matters if
      the scaffolder is retained, and it pairs with the `gesso_image_path` → `image_path`
      rename (Phase 8, §8.4).

### 3. `core_version_requirement` — align with the theme

- [ ] Whatever is decided for the theme's `core_version_requirement` (Phase 8, §8.3),
      `slac_helper` must be at least as permissive, or Composer will refuse the pair.

### 4. `SubheadingLevelTwigExtension.php` — port only if you use the filter

Phase 4 adds the **Storybook** side (`lib/subheadingLevelTwigExtension.js`), which means
`|subheading_level` will work in Storybook and **fatal in Drupal** until `slac_helper`
registers the PHP filter.

- [ ] Nothing in this theme uses `|subheading_level` today
      (`grep -rn "subheading_level" source templates` → empty). So this is forward-looking.
- [ ] **If** a future component wants it, port the extension to `slac_helper` **first**.
- [ ] Until then, consider documenting the asymmetry (Phase 10, §10.5) so nobody reaches for
      the filter and gets a white screen.

### 5. Icon / button render elements and formatters — probably skip

`GessoButton`, `GessoIcon`, `GessoIconLink`, `IconLinkFormatter`, `GessoIconTrait`,
`GessoModifierClassesTrait`, `gesso-icon.html.twig`, and the schema additions are all part of
upstream's icon system, which pairs with the excluded `icon-link`, `icon--exit` and `file`
components and the `gesso/icon_link` library.

- [ ] Skip unless there is a product need for icon-annotated link/button field formatters.
- [ ] If ported: they also need the corresponding `source/03-components/icon-link/**` and
      `source/03-components/icon/_icon--exit.scss` from the theme diff, plus the
      `icon_link` library entry and `gesso_element_info_alter()` from `includes/libraries.inc`
      — i.e. it is a feature port, not an upgrade step. Track it as its own piece of work.

### 6. Docblock-only changes — skip

`KeysortTwigExtension.php`, `GessoHelperDirFilterExclude.php`,
`GessoHelperDirFilterInclude.php`. Coding-standards noise; no reason to churn a separate
repo for it.

---

## Suggested ticket

> **Port applicable Gesso 5.4.2 `gesso_helper` changes to `slac_helper`**
>
> Context: the `slac` theme is being upgraded from Gesso 5.0.9 to 5.4.2. Nineteen files in
> the upstream diff belong to `gesso_helper`, which in our case is the separate `slac_helper`
> module.
>
> In scope:
> - Port the `AddAttributesTwigExtension` `$context_attribute = []` initialisation fix (if we
>   carry that extension).
> - Fix or remove any Drush command using `drupal_get_path()` (removed in Drupal 10).
> - Align `core_version_requirement` with whatever the theme lands on.
> - Decide whether to keep the `unique_id` Twig filter registered. Upstream dropped theirs in
>   favour of core's `clean_unique_id`; if we do the theme-side rename, ours becomes dead
>   code.
>
> Out of scope (feature work, separate ticket if wanted):
> - `subheading_level` Twig filter — only needed if a component starts using it.
> - `gesso_button` / `gesso_icon` / `gesso_icon_link` render elements and the icon field
>   formatters — these pair with theme components we deliberately did not merge.
>
> Reference: `gesso-update-diff.diff` lines 1761–2932 in the theme repo, and
> `gesso-upgrade-plan/cross-repo-slac-helper.md`.
