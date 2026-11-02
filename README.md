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

## Local preview

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>. `bundle exec htmlproofer ./_site --disable-external --no-enforce-https` checks the built site (the same check runs in CI).

## Deployment

In the repository settings set **Pages → Source** to **GitHub Actions**. `.github/workflows/pages.yml` then builds with `actions/jekyll-build-pages` (the same gems as classic GitHub Pages), checks internal links and images, and deploys on every push to `main`, daily and on demand. Pull requests are built and checked but not deployed.

GitHub disables scheduled workflows after 60 days without repository activity; re-enable it in the Actions tab if that happens.
