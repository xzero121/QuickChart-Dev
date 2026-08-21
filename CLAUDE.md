# QuickChart

Static HTML/CSS/JS app (no build step, no `package.json`). Primary app is
`index.html`; also `editor.html`, `terms.html`, `privacy.html`.

## Versioning

The app follows `Major.Minor.Revision` (e.g. `2.1.7`):

- **Major** — a major feature is added or changed (e.g. `2.0` introduced
  quick-add sentences).
- **Minor** — a smaller feature (a stylistic change, a single new tool, etc.).
- **Revision** — a bug fix.

As of `2.1.7` the `Pre` suffix used through `2.1.6 Pre` has been dropped.

The displayed version string is the single source of truth for the app's
version — there is no `package.json` or manifest to keep in sync:

```
index.html → <div id="versionText" class="version-text">Version: X.Y.Z</div>
```

When bumping the version:
1. Update that line in `index.html`.
2. Add an entry to `CHANGELOG.md` describing the change and which digit moved.
