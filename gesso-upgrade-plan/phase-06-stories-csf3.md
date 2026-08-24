# Phase 6 — Storybook stories: CSF2 → CSF3

**Goal:** convert the theme's 153 `*.stories.jsx` files from Component Story Format 2
(a story is a function with properties attached) to CSF3 (a story is an object with a
`render` key), matching the upstream 5.4.2 convention.

**Diff reference:** the CSF3 shape appears in every `source/**/*.stories.jsx` hunk; the
canonical minimal example is at diff lines 7789–7795 (`headings.stories.jsx`), and the
generator template at 3843–3861 (`lib/component.js`).

**Not blocking.** Storybook 8 still executes CSF2 stories. This phase is a convention
alignment, and it touches **zero** Drupal-rendered output — stories are Storybook-only.
Land it as its own PR after Phases 1–5 are green.

---

## 6.1 Scope

```
153  source/**/*.stories.jsx
231  `<Story>.args = …` assignments
 17  `<Story>.argTypes = …`
  2  `<Story>.parameters = …`
  2  `<Story>.storyName = …`
  1  `<Story>.decorators = …`
  1  `<Story>.play = …`
 11  `…bind({})` usages
  1  `const Template = …` pattern
```

Get the authoritative file list:

```bash
grep -rlE '^[A-Za-z0-9_]+\.(args|argTypes|parameters|storyName|decorators|play) = ' \
  source --include='*.stories.jsx' | sort
```

---

## 6.2 The transformation

### CSF2 (current)

```jsx
const Tag = args => parse(twigTemplate({ ...args }));
Tag.args = { ...data };
Tag.argTypes = { num_cols: { control: 'select', options: [1, 2] } };
Tag.parameters = { controls: { exclude: ['num_cols'] } };
Tag.storyName = 'Tag (default)';
```

### CSF3 (target)

```jsx
const Tag = {
  render: args => parse(twigTemplate({ ...args })),
  args: { ...data },
  argTypes: { num_cols: { control: 'select', options: [1, 2] } },
  parameters: { controls: { exclude: ['num_cols'] } },
  name: 'Tag (default)',
};
```

Mapping table:

| CSF2 | CSF3 |
| --- | --- |
| the story function itself | `render:` |
| `.args = X` | `args: X` |
| `.argTypes = X` | `argTypes: X` |
| `.parameters = X` | `parameters: X` |
| `.decorators = X` | `decorators: X` |
| `.play = X` | `play: X` |
| **`.storyName = 'X'`** | **`name: 'X'`** ← the key is renamed |
| `const Story = Template.bind({})` | inline the template body into `render:`, or keep a shared `render` function and reference it |

`export default settings; export { Tag };` at the bottom is unchanged — CSF3 keeps the
default-export-meta / named-export-stories structure.

### The `.storyName` → `name` rename

This is the only rename that changes behaviour if missed: a stray `.storyName` on an object
is silently ignored and the story falls back to its export name. Two files affected — find
them with:

```bash
grep -rn '\.storyName = ' source --include='*.stories.jsx'
```

### The `bind({})` / `Template` pattern

11 usages. `Template.bind({})` produces a fresh function so per-story `.args` don't collide.
In CSF3 that is unnecessary — object stories don't share state. Convert:

```jsx
// before
const Template = args => parse(twigTemplate({ ...args }));
const Default = Template.bind({});
Default.args = { ...data };
const Wide = Template.bind({});
Wide.args = { ...data, modifier_classes: 'c-x--wide' };

// after
const render = args => parse(twigTemplate({ ...args }));
const Default = { render, args: { ...data } };
const Wide = { render, args: { ...data, modifier_classes: 'c-x--wide' } };
```

Find them:

```bash
grep -rn 'bind({})\|^const Template' source --include='*.stories.jsx'
```

### Multi-story files

Most files here export 2–4 stories from one module (see
`source/03-components/accordion/accordion.stories.jsx` — `NarrowAccordion` and
`WideAccordion`, each with a distinct multi-line `render` body). Convert each story
independently; do **not** try to factor a shared `render` unless the bodies are already
identical.

---

## 6.3 Execution strategy

A blind regex sweep over 153 files with multi-line arrow-function bodies and JSX will produce
broken output. Work directory by directory and let the tooling verify:

- [ ] **Order:** `source/01-global/` → `source/02-layouts/` → `source/03-components/` →
      `source/04-templates/` → `source/05-pages/`. Commit per directory.
- [ ] After each directory: `npx eslint source/<dir> && npm run build-storybook`.
      A broken story surfaces as a Storybook build error or an empty story pane.
- [ ] Files with only `.args` (the overwhelming majority — 231 of 253 assignments) are
      near-mechanical. Do those first, in bulk, per directory.
- [ ] Files with `.argTypes`, `.parameters`, `.storyName`, `.decorators`, `.play` (23
      assignments total) — handle by hand.
- [ ] `npx prettier --write 'source/**/*.stories.jsx'` at the end of each directory so
      formatting churn doesn't hide logic errors.

### Verification per story

Storybook renders each story to HTML. Because stories are the only automated render surface
for this theme's components, use them as the regression check for the whole upgrade:

- [ ] Capture the pre-Phase-6 static Storybook build (`storybook/`) as a baseline.
- [ ] After conversion, build again and compare rendered story markup. See
      [`verification.md`](verification.md) § "Storybook HTML diffing" for a scripted approach.
- [ ] Story **markup** must be identical. Story **names** and ordering must be identical
      (this is where a missed `.storyName` shows up).

---

## 6.4 What NOT to change in this phase

- [ ] Do **not** add `withGlobalWrapper` imports (upstream adds them to
      `01-global/html-elements/*` stories). This theme has its own
      `source/06-utility/storybookHelper.jsx` wrappers, and adding a
      `l-constrain u-spaced-4` wrapper changes how those stories render. If you want
      the upstream wrapper, do it as a separate, deliberate change — see Phase 5, §5.6.
- [ ] Do **not** adopt upstream's story `args`/data changes. Those go with the excluded
      component and design-token changes.
- [ ] Do **not** convert stories for components that don't exist here.
- [ ] Do **not** touch `source/06-utility/storybookHelper.jsx` — it is not a story file and
      its `decorators` export is consumed as-is by CSF3 (`decorators: decorators`).

---

## 6.5 Also apply: `lib/component.js` generator

Already covered in Phase 4, §4.4 — the scaffolder's JSX template emits CSF3. Confirm it is
consistent with what you produced here (note upstream's template has a trailing-whitespace
artifact after `};` — drop it).

---

## Definition of done

- `grep -rE '^[A-Za-z0-9_]+\.(args|argTypes|parameters|storyName|decorators|play) = ' source --include='*.stories.jsx'`
  returns nothing.
- `grep -rn 'bind({})' source --include='*.stories.jsx'` returns nothing.
- `npm run build-storybook` succeeds.
- Story count, story names, and rendered story markup are unchanged from the baseline.
- `npx eslint source` exits 0.
