# Icenux

The website of **Icenux**, an open-source hobby project of small Linux tools. A [Jekyll](https://jekyllrb.com) site served by GitHub Pages at <https://icenux.github.io> (repository `Icenux/icenux.github.io`).

## Structure

```
_config.yml            site settings (url, plugins, default layout)
_layouts/default.html  <head>, background, header, <main>, footer, search, scripts
_includes/             header, footer, search overlay, app card, "Keep exploring", search index
_data/apps.yml         every app: version, tagline, icon, preview, links — single source of truth
_data/nav.yml          main menu
index.html             home            →  /
apps/index.html        app lineup      →  /apps/
apps/<slug>.html       app profiles    →  /apps/<slug>/
404.html               not-found page
assets/                style.css, main.js, app screenshots
scripts/update-versions.py   syncs versions from GitHub releases
.github/workflows/pages.yml  build, check and deploy
```

Menu, footer, cards and site search are generated, so changing the menu or an app's version is a one-place edit. Pages only contain their own content plus a short front matter (`title`, `description`, `permalink`, `nav`).

## Adding an app

1. Add an entry to `_data/apps.yml` (copy an existing one). Put screenshots in `assets/apps/<slug>/`.
2. Create `apps/<slug>.html` — copy a similar profile and change the front matter (`app: <slug>`, `next: [slug, slug]` for the "Keep exploring" links).

The card on `/apps/`, the footer link, the search entries and the version fields all follow from the data file.

## Versions

`version` and `released` in `_data/apps.yml` come from each repo's latest GitHub release. `scripts/update-versions.py` refreshes them (`--check` only reports). The Pages workflow runs it during every build (push and daily), so the live site is always current. It does not commit: `main` is protected, so the values in the repository can lag behind — run the script locally and commit through a pull request when you want them updated. Profile pages use `{{ app.version }}`, never a hard-coded number.

## Fonts

Headings use **Chakra Petch** (600, 700) and text uses **Inter** (400, 500, 600), both under the SIL Open Font License (`assets/fonts/OFL-*.txt`). They are served from this site as subset `woff2` files (Latin and Latin Extended-A) — the pages make no requests to Google or other third parties. The two critical files are preloaded in `_layouts/default.html`, the rest use `font-display: swap`.

## Security

- **Content Security Policy** in `_layouts/default.html` (a `<meta>` tag, because GitHub Pages cannot set headers): scripts only from this site plus the one inline snippet that sets the `js` class (allowed by its hash). The search index is a generated file, `assets/search-index.js`. If you change that inline snippet, recompute its `sha256` in the CSP.
- **No third-party requests:** fonts, scripts and images are all served from this site.
- **Downloads are pinned to the release tag** (`tag` in `_data/apps.yml`, refreshed with the version), and single-file downloads show their SHA-256 (`script_path` / `sha256`, computed by `scripts/update-versions.py`). A changed file under an unchanged tag is reported by the script.
- **Signing key fingerprints** live in `_data/keys.yml`, are shown on the ccc and repo-doctor pages and are published in the Icenux repository, so they can be compared in two places.
- **GitHub Actions are pinned to commit SHAs**, and Dependabot (`.github/dependabot.yml`) proposes updates weekly.

## Local preview

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>. `bundle exec htmlproofer ./_site --disable-external --no-enforce-https` checks the built site (the same check runs in CI).

## Deployment

In the repository settings set **Pages → Source** to **GitHub Actions**. `.github/workflows/pages.yml` then builds with `actions/jekyll-build-pages` (the same gems as classic GitHub Pages), checks internal links and images, and deploys on every push to `main`, daily and on demand. Pull requests are built and checked but not deployed.

GitHub disables scheduled workflows after 60 days without repository activity; re-enable it in the Actions tab if that happens.
