# notchnotch.github.io

The NotchNotch website: landing page, documentation, Store and changelog, built
with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

The content isn't edited here. `scripts/sync.mjs` brings it in before each build:

- **Docs**, privacy, security and contributing pages from
  [`NotchNotch/notchnotch`](https://github.com/NotchNotch/notchnotch) `docs/`,
  so documentation changes in the same pull request as the code. Each page's
  "Edit page" link goes there.
- **Changelog** from that repository's `CHANGELOG.md`.
- **Store pages** from the signed catalog in
  [`NotchNotch/notchnotch-extensions`](https://github.com/NotchNotch/notchnotch-extensions).
  The build stops if the signature doesn't verify.
- **Download button** from the newest published release.

The **Deploy** workflow publishes to GitHub Pages on every push, every three
hours, and when run by hand.

## Develop

```sh
npm install
NOTCHNOTCH_SOURCE=../notchnotch node scripts/sync.mjs   # or without it, to clone
npx astro dev
```

Generated content (`src/content/docs/docs/`, `src/data/`, …) isn't committed.
