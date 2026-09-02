# Changelog

Versions follow `Major.Minor.Revision`:
- **Major** — a major feature is added or changed.
- **Minor** — a smaller feature (stylistic change, a single new tool, etc.).
- **Revision** — a bug fix.

The entries below `2.1.7` are backfilled from git history for continuity;
this file starts being maintained going forward from `2.1.7`.

## 3.1.0 — 2026-09-01
- Minor: **copy a sentence to another page**. On a multi-page run, every
  sentence *added* during the run — typed in, quick-added, or copied — gains a
  copy button at the left of its control row. It opens a small picker listing
  the other pages; choosing one drops a clone into that page's section of the
  same name. Values come across as typed, so a ventilator-settings sentence
  filled in on the initial trip lands on the return trip already filled in.
- The copy is a **snapshot, not a link**: any `~linkId` tags in the sentence are
  stripped on the way over, with each linked field's current shared value baked
  into the clone first. The two copies hold the same values at the moment of the
  copy and drift apart freely afterwards. Locked state doesn't travel either —
  locking is a choice about the sentence you're looking at.
- Base sentences (the ones the configuration ships) get no copy button; they
  already sit on whichever pages their config puts them on, and a button on each
  one would only crowd the control row. Single-page configurations are
  unaffected — with nowhere to copy to, the button never appears.
- A page that doesn't carry the section is listed but disabled, saying so on
  hover, rather than being silently absent from the picker.

## 3.0.0 — 2026-09-01
- Major: **multi-page narratives**, for "wait and return" calls where one run
  produces two (or more) reports that share most of their data. A
  configuration can declare a `pages` array — typically an initial trip and a
  return trip — and a tab strip switches between them. **Generate and Copy act
  on the active page only**, since each leg is its own PCR; after copying a
  non-final page, the prompt offers to move to the next leg instead of
  starting a new run. New Run resets every page at once.
- Major: **linked fields**. A placeholder can carry a `~linkId` tag
  (`[customDropdown:Sending Facility~locA]`) binding it to a hidden shared
  variable, so every field with that tag holds one value — across pages *and*
  across sentences on the same page. A linked field is drawn as a chip with a
  muted gold border, led by a gold chain icon. Clicking the chain detaches that
  one field: the chain is slashed and greyed, the border turns to a grey dash,
  and the field keeps its current value but no longer syncs and can be edited
  independently. (A chain rather than a key, so it isn't confused with sentence
  locking.) Role reversal between legs falls out of the page's own text: the
  initial trip tags Sending Facility `~locA`, the return trip tags it `~locB`.
- Pages may reuse another page's sentences with `"inherit": "<page name>"`,
  optionally swapping link ids via `"remapLinks"` so a mirrored leg needs no
  duplicated section array.
- Both features are config-driven and invisible by default: a configuration
  with no `pages` key and no link tags renders exactly as before — no page
  steps, no chain icons. Added `waitreturn.json` as a working three-page
  example.
- **Choose Template** replaces the free-text configuration name box. A button
  beside New Run opens a dialog listing the available templates by name and
  description, marking the current one and flagging multi-page templates — so
  nobody has to know a filename any more. The list comes from `templates.json`
  (filenames, in display order); each template's own new `name` and
  `description` fields supply its label and summary, so the catalogue stays in
  the config files. Files left out of the manifest, such as `global.json`, are
  never offered.
- **Output Section Titles** moved out of the header into a new Settings dialog,
  opened from the toolbox menu at bottom-left, and the setting is now
  remembered between visits. The duplicate mobile copy of the toggle is gone.
- The header is now logo / page steps / buttons, with the page steps centred
  between the two.
- Saved browser state moved to a versioned envelope to hold multiple pages and
  the shared values. A run in progress from a previous version is migrated on
  first load rather than discarded.
- The placeholder pattern gained a capture group for the link id, placed ahead
  of the options group so existing label handling is unaffected. `editor.html`
  no longer warns about a dropdown "not found" when its label carries a link
  tag. (The editor cannot yet author `pages`; multi-page configurations must be
  hand-edited for now.)

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
