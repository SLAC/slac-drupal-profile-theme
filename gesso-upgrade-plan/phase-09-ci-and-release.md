# Phase 9 — CI, release workflow, and Docker

**Goal:** keep the two GitHub Actions workflows working after the Storybook 8 migration and
the `deploy-storybook` script removal, and drop the dead Dockerfile.

**Diff reference:** lines 106–157 (`.github/workflows/publish-demo-site.yml`),
1025–1040 (`Dockerfile` deleted), 40–55 + 7–39 (`.buildkite/*` — not applicable).

**Coupling:** `publish-demo-site.yml` **must** land with Phase 1, because Phase 1 deletes the
`deploy-storybook` npm script the current workflow calls.

---

## 9.1 `.github/workflows/publish-demo-site.yml` — REWRITE (required)

### Why it breaks

The current workflow runs:

```yaml
      - name: Deploy Storybook to Github Pages
        run: npm run deploy-storybook -- --ci
        env:
          GH_TOKEN: ${{ github.actor }}:${{ secrets.GITHUB_TOKEN }}
```

`deploy-storybook` is `storybook-to-ghpages`, provided by `@storybook/storybook-deployer`,
which Phase 1 removes (it has no Storybook 8 support). The workflow would fail on the next
push to `main`.

### Target

Apply the upstream rewrite (diff lines 123–157), adapted for this repo's branch name and
pinned action SHAs:

```yaml
# This is a basic workflow to help you get started with Actions

name: Publish demo site

# Controls when the workflow will run
on:
  # Triggers the workflow on push events but only for the main branch
  push:
    branches:
      - main

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 #v7.0.0
      - name: Setup node
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 #v7.0.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      # Installs npm dependencies
      - name: Install npm packages
        run: npm ci
      # Builds Storybook
      - name: Build Storybook artifact
        run: npm run build-storybook
      # Uploads the Storybook artifact
      - uses: actions/upload-pages-artifact@<PINNED_SHA> #v3
        with:
          name: 'github-pages'
          path: './storybook'
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@<PINNED_SHA> #v4
```

### Checklist

- [ ] `branches: [ main ]` → `branches:\n      - main`. **Keep `main`** — do not copy
      upstream's `5.x`.
- [ ] Replace the `deploy-storybook` step with `npm run build-storybook` +
      `actions/upload-pages-artifact` + a separate `deploy` job using
      `actions/deploy-pages`.
- [ ] **Pin the two new actions to commit SHAs.** This repo pins every action
      (`actions/checkout@9c091bb…`, `actions/setup-node@8207627…`,
      `fjogeleit/yaml-update-action@dffe9a5…`, etc.). Upstream's `@v3`/`@v4` floating tags
      violate that convention. Look up the SHAs for `actions/upload-pages-artifact@v3` and
      `actions/deploy-pages@v4` and pin them, with a `#v3` / `#v4` trailing comment to match
      the house style.
- [ ] **Add a `Setup node` step.** The current workflow has none — it relies on the runner's
      default Node. With the new toolchain requiring Node ≥20 and this repo pinning 22 in
      `.nvmrc`, add `actions/setup-node` with `node-version-file: '.nvmrc'` and `cache: npm`
      (mirroring `build-assets.yml`).
- [ ] **`build-storybook` runs `npm run build` first** (see Phase 1, §1.3), so the workflow
      compiles the theme too. That means it now also runs ESLint and Stylelint via webpack —
      this workflow becomes a de facto lint gate on `main`. Good, but be aware it will start
      failing on lint errors.
- [ ] **Remove `permissions: contents: write` from the `build` job.** It was needed by
      `storybook-to-ghpages` (which pushed to `gh-pages`); the artifact-upload approach does
      not need it. The `deploy` job declares `pages: write` + `id-token: write` instead.
- [ ] **Repo setting change required:** GitHub Pages must be switched from "Deploy from a
      branch" (`gh-pages`) to "GitHub Actions" under Settings → Pages. `deploy-pages` fails
      otherwise. This is a manual step — flag it in the PR description.
- [ ] After merging, confirm the Pages URL still serves the Storybook and that the SLAC brand
      (logo, `#8c1515`) renders — that proves `.storybook/theme.js` and `manager-head.html`
      survived Phase 5.

---

## 9.2 `.github/workflows/build-assets.yml` — reconcile npm and Node

This workflow is the release gate (tag push → build → zip → GitHub Release → Satis dispatch).
It is **not** in the upstream diff, so no upstream change applies. But the new toolchain
requires two adjustments.

Current step:

```yaml
      - run: |
          npm i -g npm@10
          npm ci
          npm run build
```

- [ ] **`npm i -g npm@10` is now questionable.** Node 22 ships npm 10 already, so the pin is
      redundant at best. Upstream's README bumps the npm floor to "10.7.0 or greater"; npm 10
      satisfies it. Either drop the line (preferred — one less moving part) or pin more
      precisely (`npm@^10.7.0`). Do **not** leave a bare `npm@10` if you also want a specific
      minor.
- [ ] **Verify `npm run build` still produces everything the zip needs.** Phase 1 changed the
      `build` script. After this upgrade it runs:
      `webpack --config ./webpack.theme-config.js && webpack --config ./webpack.production.js`.
      Confirm the release zip contains:
      - `dist/css/*.css` (all component CSS referenced by `slac.libraries.yml`)
      - `dist/js/*.es6.js`
      - **`dist/js/common.js`** — required by `slac_library_info_build()`; 21+ libraries
        depend on `slac/common`
      - `dist/images/sprite.artifact.svg`
      - `dist/design-tokens.js`
      - `dist/fonts/**` (note the filename pattern changed from `[hash]` to `[name]` — Phase 2)
      - `dist/images/backgrounds/**` (new subdirectory — Phase 2)
- [ ] **The zip `exclusions` list needs a look.** It is currently
      `'*.git* /*node_modules/* .editorconfig source/*'`. New root-level config files added by
      this upgrade (`.swcrc`, `eslint.config.js`, `eslint.dev.config.js`, `tsconfig.json`,
      `.prettierignore`) will be shipped inside the release zip. Harmless — Drupal ignores
      them — but if you want a lean package, extend the exclusions:

```yaml
          exclusions: '*.git* /*node_modules/* .editorconfig source/* .storybook/* lib/* webpack.* .swcrc eslint.config.js eslint.dev.config.js tsconfig.json .prettierignore .stylelintrc.yml .prettierrc .npmrc .nvmrc'
```

      **Careful:** do **not** exclude `includes/`, `templates/`, `config/`, `*.yml`,
      `*.theme`, `theme-settings.php`, or `dist/` — those are the actual theme.
      Also verify nothing in `lib/` is needed at runtime (it isn't — `lib/` is build-time
      only) before excluding it.
- [ ] Test the zip: after a dry-run tag, download the artifact and confirm a consuming
      Drupal site can install the theme from it and that CSS/JS load.

---

## 9.3 `Dockerfile` and `.dockerignore` — delete

Upstream deletes `Dockerfile` (diff lines 1025–1040). This repo has it, and it is dead:

```dockerfile
FROM forumone/gesso:4-node-v14-php-7.4
```

Node 14 / PHP 7.4 cannot build this toolchain (Node ≥20 required), and nothing in the repo
or the workflows references the image.

- [ ] `git rm Dockerfile`
- [ ] `git rm .dockerignore` — it exists only to serve the Dockerfile and is not referenced
      anywhere else. **Check first:** `grep -rn "dockerignore\|Dockerfile" .github/ *.json *.yml 2>/dev/null`.
      If anything references either file, stop and ask.
- [ ] If any developer relies on a local Docker workflow not visible in this repo, this is the
      one deletion in the plan that could inconvenience someone. Mention it in the PR.

---

## 9.4 `.buildkite/` — not applicable

The diff deletes `.buildkite/build.sh` and rewrites `.buildkite/pipeline.yml`. Neither exists
here (this repo has no Buildkite integration; the upstream pipeline mirrors Gesso to
drupal.org).

- [ ] No action.

---

## Definition of done

- `publish-demo-site.yml` rewritten, actions SHA-pinned, `Setup node` step added, `main`
  branch preserved, `contents: write` removed from `build`.
- GitHub Pages source switched to "GitHub Actions" (manual repo setting).
- `build-assets.yml` npm pin resolved; release zip contents verified to include
  `dist/js/common.js`.
- `Dockerfile` and `.dockerignore` deleted.
- `grep -rn "deploy-storybook" .` returns nothing.
