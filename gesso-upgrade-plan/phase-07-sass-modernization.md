# Phase 7 — Sass modernization (global built-ins → `sass:*` modules)

**Goal:** replace deprecated global Sass built-in functions with their `sass:math`,
`sass:meta`, `sass:map` and `sass:string` equivalents, and add the two genuinely additive
new mixins. **Every change in this phase produces byte-identical CSS.**

**Diff reference:** lines 5668–5685 (`functions/_font-size.scss`), 5686–5750
(`functions/_gesso.scss`), 5751–5759 (`functions/_index.scss`), 5760–5837
(`functions/_numbers.scss`), 5838–5908 (`functions/_unit-convert.scss`), 5921–6013
(`mixins/_container-query.scss`), 6147–6163 (`mixins/_index.scss`), 6392–6457
(`mixins/_responsive-font-size.scss`), 6458–6471 (`mixins/_svg-mask-image.scss`).

**Not blocking.** Do it as its own PR.

**Why it matters:** `sass-embedded` 1.85 (Phase 1) emits deprecation warnings for global
built-ins; Dart Sass 3.0 will **remove** them. Doing this now means the next `sass-embedded`
bump is a no-op instead of a broken build.

---

## 7.1 What this theme already has

This repo's `source/00-config/` is **ahead of upstream 5.0.9** in two places. Do not
re-apply work that is already done:

| File | Status |
| --- | --- |
| `source/00-config/functions/_font-size.scss` | **Already exists**, identical to upstream 5.4.2's new file. No action. |
| `source/00-config/functions/_index.scss` | **Already forwards `font-size`** (last line instead of first — ordering is irrelevant to `@forward`). No action. |
| `source/00-config/mixins/_responsive-font-size.scss` | **Already refactored** into `custom-responsive-font-size` + `responsive-font-size` and already calls `ideal-font-size()`. See §7.5 for the one remaining delta. |

Everything else in this phase is real work.

---

## 7.2 `source/00-config/functions/_numbers.scss` (diff 5760–5837)

Add `@use 'sass:meta';` alongside the existing `@use 'sass:math';`, then:

| Line | From | To |
| --- | --- | --- |
| 10 | `type-of($number) == 'number' and not unitless($number)` | `meta.type-of($number) == 'number' and not math.is-unitless($number)` |
| 33 | `type-of($number) != number` | `meta.type-of($number) != number` |
| 38 | `type-of($digits) != number` | `meta.type-of($digits) != number` |
| 41 | `not unitless($digits)` | `not math.is-unitless($digits)` |
| 49 | `round($number * $n) / $n` | `math.round($number * $n) / $n` |
| 51 | `ceil($number * $n) / $n` | `math.ceil($number * $n) / $n` |
| 53 | `floor($number * $n) / $n` | `math.floor($number * $n) / $n` |
| 93 | `type-of($value) == 'number'` | `meta.type-of($value) == 'number'` |
| 98 | `type-of($value) != 'number'` | `meta.type-of($value) != 'number'` |
| 106 | `$fraction != floor($fraction)` | `$fraction != math.floor($fraction)` |

- [ ] Apply.
- [ ] **Note:** upstream leaves the `/ $n` slash divisions in `decimal-round()` alone (lines
      49–53). Those are *also* deprecated (Dart Sass wants `math.div`). Upstream did not fix
      them, so this plan does not either — but flag it: if `sass-embedded` starts erroring
      on slash division, `decimal-round()` is the first place to look. `math.div()` is
      numerically identical here, so fixing it is safe if you want to get ahead of it.

---

## 7.3 `source/00-config/functions/_unit-convert.scss` (diff 5838–5908)

Add `@use 'sass:meta';`, then:

| Line | From | To |
| --- | --- | --- |
| 11, 29 | `unitless($value)` | `math.is-unitless($value)` |
| 32, 48, 68 | `type-of($base) != 'number' or unit($base) != 'px'` | `meta.type-of($base) != 'number' or math.unit($base) != 'px'` |
| 51 | `type-of($value) == 'number' and unit($value) != 'em'` | `meta.type-of($value) == 'number' and math.unit($value) != 'em'` |
| 71 | `type-of($value) == 'number' and unit($value) != 'rem'` | `meta.type-of($value) == 'number' and math.unit($value) != 'rem'` |
| 52, 72 | `unit($value) != 'px'` | `math.unit($value) != 'px'` |
| — | `@error "Base font size must be in pixels.";` | `@error 'Base font size must be in pixels.';` (single quotes, for the Prettier/stylelint config) |

- [ ] Apply.

> `rem()` and `px()` are called thousands of times across this theme's SCSS. Verify the
> compiled output carefully (see §7.7) — a mistake here shifts every dimension in the theme.

---

## 7.4 `source/00-config/functions/_gesso.scss` (diff 5686–5750)

Add `@use 'sass:string';` alongside the existing `@use 'sass:meta';` and `@use 'sass:map';`,
then:

| Line | From | To |
| --- | --- | --- |
| 15 | `@error "A valid sass map is required…"` | single quotes |
| 18 | `map-has-key($map, $key)` | `map.has-key($map, $key)` |
| 21 | `@warn "Key \`#{$key}\` not found in map"` | single quotes |
| 60 | `unquote(gesso-get-map(typography, font-family, $ff-type, stack))` | `string.unquote(…)` (wrapped across lines per Prettier) |
| 103 | `unquote(gesso-get-map(transitions, ease, $keys...))` | `string.unquote(…)` |
| 107 | `unquote(gesso-get-map(box-shadow, $keys...))` | `string.unquote(…)` |

- [ ] Apply.
- [ ] **Do NOT add** upstream's new `gesso-letter-spacing()` function (diff 5731–5734). It
      reads `typography.letter-spacing` tokens that do not exist in this theme's
      `config.design-tokens.yml`, and adding those tokens is excluded (see `README.md` § B).
      Add the function only if/when the tokens are added.

---

## 7.5 `source/00-config/mixins/_responsive-font-size.scss` (diff 6392–6457)

This theme's version is already the refactored shape. One delta remains:

- Upstream applies `rem()` **inside** `custom-responsive-font-size` and passes raw token
  values in from `responsive-font-size`, plus adds an `@else { $ideal-size: rem($ideal-size); }`
  branch so an explicit (non-`auto`) `val` token gets `rem()`-converted.
- This theme applies `rem()` in `responsive-font-size` before calling through, and has no
  `@else` branch.

Consequence: if any `responsive-font-size` token in
`source/00-config/config.design-tokens.yml` has an explicit `val` (not `auto`), this theme
currently passes it through **unconverted**.

- [ ] Check: `grep -A3 'responsive-font-size:' source/00-config/config.design-tokens.yml | grep -c "val: auto"`
      versus the total entry count. If **every** `val` is `auto`, the two implementations are
      equivalent and **no change is needed** — leave the file alone.
- [ ] If any `val` is an explicit length, align with upstream (move `rem()` into
      `custom-responsive-font-size`, add the `@else` branch). Then **re-verify the compiled
      `font-size` declarations for the affected scale** — this one *can* change output, which
      is exactly why it needs checking rather than blind application.

---

## 7.6 Additive new mixins (optional but recommended)

Both are unused until called, so they cannot change output.

### `source/00-config/mixins/_svg-mask-image.scss` (diff 6458–6471) — NEW

```scss
// Mixins: SVG Mask Image
// Can be use similarly to svg-background-image mixin, but allows color change of
// icon using background-color property.

@mixin svg-mask-image($image-name, $image-location: 'images/backgrounds/') {
  $url: $image-location + $image-name + '.svg';
  mask-image: url($url);
}
```

- [ ] Create the file.
- [ ] Add `@forward 'svg-mask-image';` to `source/00-config/mixins/_index.scss`.
- [ ] The default `$image-location: 'images/backgrounds/'` matches the new webpack
      `generator.filename` for images from Phase 2, §2.5. Consistent.

### `source/00-config/mixins/_container-query.scss` (diff 5921–6013) — NEW

87 lines: `container-query-min`, `container-query`, `container-query-max`,
`container-query-min-max`. Extract verbatim from the diff.

- [ ] Create the file.
- [ ] Add `@forward 'container-query';` to `source/00-config/mixins/_index.scss`.
- [ ] **Required companion:** the mixin reads `$container-queries-rems`, which
      **does not exist** in this theme's `source/00-config/_config.settings.scss`. Add it:

```scss
$breakpoints-ems: true !default;
$container-queries-rems: true !default;
$support-for-rtl: true !default;
$wysiwyg: false !default;
```

      Use `true` to match this theme's existing `$breakpoints-ems: true`. Without this the
      file fails to compile with `Undefined variable`.
- [ ] Confirm `_config.settings.scss` is exposed to the mixin — `_container-query.scss` does
      `@use '../config.settings' as *;`, same as `_responsive-font-size.scss` already does.
      Verify the relative path resolves (`source/00-config/_config.settings.scss`).

### `source/00-config/mixins/_index.scss` — final target

```scss
@forward 'accessibility';
@forward 'aspect-ratio';
@forward 'breakpoint';
@forward 'button';
@forward 'clearfix';
@forward 'container-query';
@forward 'display-text-style';
@forward 'font-family';
@forward 'focus';
@forward 'grids';
@forward 'image-replace';
@forward 'layout';
@forward 'link';
@forward 'list';
@forward 'menu';
@forward 'mod-selector';
@forward 'responsive-font-size';
@forward 'svg-background';
@forward 'svg-mask-image';
@forward 'underline';
@forward 'variables';
```

- [ ] Apply. Note upstream's `_index.scss` has a different set (no `font-family`,
      `image-replace`, `underline`, `variables`, `accessibility`) — **keep all of this
      theme's entries** and just add the two new ones.

---

## 7.7 Other deprecated call sites outside `00-config`

Only one:

- [ ] `source/03-components/video-hero/video-hero.scss:16` —
      `padding-bottom: percentage(9/16);`
      → `padding-bottom: math.percentage(math.div(9, 16));`
      and add `@use 'sass:math';` at the top of the file (check whether it's already there).
      `percentage(9/16)` is *doubly* deprecated: the global `percentage()` and the slash
      division. Result is `56.25%` either way — verify the compiled value.
- [ ] Re-run the sweep afterwards to confirm nothing was missed:

```bash
grep -rEn "(^|[^.a-zA-Z0-9_-])(round|floor|ceil|percentage|type-of|unitless|unit|unquote|quote|map-has-key|map-get|map-merge|map-keys|str-index|str-slice|str-length|to-upper-case|to-lower-case)\(" source --include='*.scss'
```

      Expected result: empty, or only `if(` (the global `if()` is **not** deprecated —
      3 usages here are fine).

---

## 7.8 Excluded from this phase (restating, because it's tempting)

- [ ] **`source/00-config/mixins/_grids.scss`** — upstream deletes `set-flex-column`,
      `flex-grid`, `css-grid-reset`. This theme calls all three (6 + 8 + 3 call sites).
      **Do not apply.** If you want the `@if $gutter` → `@if $gutter-width` bug fix from
      that hunk (upstream line 6094–6095: `@if $gutter` references an undefined variable),
      apply *only* that one-line fix — but check first whether this theme's copy already has
      it: `grep -n 'gutter' source/00-config/mixins/_grids.scss`.
- [ ] **`source/00-config/mixins/_layout.scss`**, **`_list.scss`**, **`_aspect-ratio.scss`** —
      physical → logical property conversion. Changes emitted CSS for every consumer.
- [ ] **`source/00-config/config.design-tokens.yml`** — retunes the type scale and renames
      `line-height` keys. Excluded.
- [ ] **`source/00-config/storybook.global-data.yml`** — the `gesso_image_path` → `image_path`
      key rename belongs with Phase 8's optional rename; the `icons` list and `file_*` keys
      belong to excluded components. Excluded here.

---

## 7.9 Verification

Because this phase claims byte-identical output, prove it:

- [ ] Before starting: `npm run build && cp -r dist/css /tmp/css-before`
- [ ] After: `npm run build && diff -r /tmp/css-before dist/css`
- [ ] **Expected result: no differences at all.**
- [ ] If `_responsive-font-size.scss` was changed (§7.5) or `video-hero.scss` (§7.7),
      those two files may differ — inspect each changed declaration and confirm the computed
      value is the same (`56.25%` etc.).
- [ ] Confirm the deprecation warnings are gone: `npm run build 2>&1 | grep -i 'deprecat'`
      should be empty (or contain only `mixed-decls`, which is silenced, and slash-division
      warnings from the `decimal-round()` lines noted in §7.2).

---

## Definition of done

- `functions/_numbers.scss`, `functions/_unit-convert.scss`, `functions/_gesso.scss` use
  `sass:math` / `sass:meta` / `sass:map` / `sass:string` throughout.
- `mixins/_svg-mask-image.scss` and `mixins/_container-query.scss` created and forwarded;
  `$container-queries-rems` added to `_config.settings.scss`.
- `video-hero.scss` uses `math.percentage(math.div(9, 16))`.
- `diff -r /tmp/css-before dist/css` is clean (or every difference is explained and
  value-equivalent).
- No Sass deprecation warnings in the build output.
