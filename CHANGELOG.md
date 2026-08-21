# Changelog

Versions follow `Major.Minor.Revision`:
- **Major** — a major feature is added or changed.
- **Minor** — a smaller feature (stylistic change, a single new tool, etc.).
- **Revision** — a bug fix.

The entries below `2.1.7` are backfilled from git history for continuity;
this file starts being maintained going forward from `2.1.7`.

## 2.1.8 — 2026-08-21
- Self-hosted all third-party CSS/JS previously loaded from CDN (Bootstrap,
  Bootstrap Icons, Font Awesome, SortableJS, Fuse.js) as local files under
  `CSS/` and `JS/` instead of `cdn.jsdelivr.net`/`cdnjs.cloudflare.com`, so
  visitors' IP addresses are no longer exposed to those third parties on
  page load. Also unified all pages onto the same local Bootstrap 5.3.8
  build (`terms.html`/`privacy.html` had been pinned to an older 5.3.0 CDN
  build).
- Updated `privacy.html` to disclose the one remaining third-party data
  flow: the in-app Bug Report tool sends the typed report text to Google
  Forms. Added an explicit "don't include PHI in a bug report" warning.
  Effective Date bumped to reflect this content change.

## 2.1.7 — 2026-08-21
- Fixed: using the up/down arrow keys to navigate a sentence's dropdown
  skipped every other item when the sentence had been added dynamically
  (quick-add button or the autocomplete add-sentence box). Caused by those
  dropdowns getting both a delegated (container-level) and a duplicate
  direct (per-element) keydown listener, so every keypress fired the
  navigation logic twice. Removed the redundant direct listeners.
- Dropped the `Pre` suffix from the version string now that a formal
  `Major.Minor.Revision` scheme is in place.

## 2.1.6 Pre — 2026-03-30
- Version bump only (`93ac692`).

## 2.1.5 Pre — 2026-02-23
- Fixed a tabbing issue (`531788a`).

## 2.1.4 Pre — 2026-02-23
- Fixed tabbing behavior (`56f96c0`).

## 2.1.3 Pre — 2026-02-23
- Fixed tabindex (`04c402f`).

## 2.1.2 Pre — 2026-02-11
- Fixed the ability to tab past tabbed sentences (`ba90f83`).

## 2.1.1 Pre — 2026-02-11
- Fixed input jitter on tabbing in iOS Safari (`ec27c51`).

## 2.1.0 Pre — 2026-02-11
- Version bump (`c10d85f`).

## 2.0.0 Pre — 2025-12-21
- Major: introduced quick-add sentences. Also added IBW and IV Drip
  calculators with McLaren tables, updated global sentences, and refreshed
  the legal documents (`f7fef1f`).
