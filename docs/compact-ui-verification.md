# Compact studio UI verification

## Current borderless, scene-first workspace

The current iteration uses a 48-pixel header, a 44-pixel mobile navigation bar,
smaller edge drawers, borderless surfaces and shared 4/8/12-pixel spacing.
Manrope follows the 11/12/13/14/18-pixel text scale documented in the README.
The header and scene HUD have translucent backings for legibility in dark rooms.
Both desktop drawers start closed on a first visit; existing layout choices
remain respected. **Display** folds setting/material controls above the dock.
Open desktop panels meet the window edges, starting at y=48 and ending at the
viewport bottom. Catalog rows are square and full-width; panel/list/footer
bottom insets are zero. Mobile panels fill the region between header and navigation.

`custom-hints.spec.js` checks exact panel bounds at 1080/1440/1600 pixels,
icon-dock bounds and 40-pixel touch targets at 320/390/481/520/844 pixels,
hover transfer, focus/Escape, disabled actions, live title migration,
preservation of existing descriptions, modal hints, custom-menu coexistence,
Chinese labels and Axe. Real Chrome touch events verify that a long press
shows a hint without changing the camera view while a normal tap still changes it.
Native touch swipes also scroll the catalog without loading a card or opening a hint.

`custom-select.spec.js` covers the shared custom menu with real pointer/touch
and keyboard interactions, including arrows, Home/End, PageDown, F4, typeahead,
commit/cancel, disabled choices, dynamic control rebuilding, undo, export
dialogs and Chinese labels. Menus use the browser's top layer to avoid clipping
inside drawers/dialogs. Native selects remain the labelled form/value owners;
their system popup paths are intercepted. The option observer excludes ARIA
attributes so highlighting cannot trigger a recursive synchronization loop.

The layout checks require a full 1440 × 1000 canvas on a first desktop visit,
more than 58% of the desktop width even with both drawers open, and more than
88% of a 390 × 844 phone's height for the 3D view. Dropdowns are also checked
at 320-pixel width and short 390-pixel landscape height. The compact regression
suite checks sticky-header focus, enlarged text, responsive transitions and
Axe accessibility; authoring, studio, room and language suites preserve saved
edits, contact controls, history, actual downloads and localized settings.

This changes UI presentation and disclosure, not the scene contract, renderer,
solver, model assets or browser-storage format. Chrome automation and Axe are
not a physical-device or assistive-technology certification.

**Edge-panel/icon follow-up:** 14 focused Node checks and 20 unique browser
scenarios passed across the layout/localization regression batch and focused
reruns. The final hint/menu/camera-gesture batch passed 11/11. Initial checks
caught short-landscape-only icon styling and modal focus/toggle ordering; both
were corrected and rerun. Desktop and narrow-phone screenshots were inspected.

**Previous scene-first iteration:** 24 focused Node checks and 25 unique browser scenarios passed
across the regression batch and focused reruns. The final HUD/lifecycle batch
passed 10/10 scenarios; the final menu/global-shortcut checks passed 2/2.
Desktop/mobile screenshots were inspected after waiting for layout redraws.
The seven-setting room scenario reached its former 150-second total deadline
during repeated clothing rebuilds; its per-test limit is now 300 seconds, while
the 30-second pixel-change and 60-second scene-ready assertions remain intact.
That scenario passed in 2.2 minutes on the focused rerun.

## Historical compact-layout milestone

This report records the compact-layout milestone. Its desktop Focus view has
since been replaced by a full-window canvas with remembered **Library** and
**Edit** drawers; the figures below describe the milestone as measured. The later
[3D reference iteration](reference-3d-verification.md) adds selectable approximate
posture previews to the reference cards and repeats relevant UI regressions.

**Final results:** 42/42 relevant unit tests and 36/36 browser scenarios passed.
Production builds, formatting, whitespace and dependency checks passed, with
zero reported dependency vulnerabilities. The 30-case regression batch and final
six-case focused batch have no failed, skipped or flaky cases.

The [machine-readable ledger](audit-compact-ui/results.json) records every
browser scenario, exact measurements, environment, source hashes and limits.
Inspected screenshots show the [desktop workspace](audit-compact-ui/desktop.png),
[mobile library](audit-compact-ui/mobile-library.png),
[narrow library](audit-compact-ui/narrow-library.png),
[mobile studio](audit-compact-ui/mobile-studio.png),
[mobile editor](audit-compact-ui/mobile-editor.png), and
[desktop focus view](audit-compact-ui/focus-view.png).

## Changes

- A 56-pixel app toolbar, smaller scene heading and tighter camera controls
  return space to the canvas. Desktop Focus hides both sidebars without editing
  scene data; Escape restores them. Focus is cleared at the mobile breakpoint.
- Library presets and references use compact horizontal rows. Search, all five
  collections and entry quality labels stay visible. Filters opens the less-used
  controls; active filters remain counted while closed, and Reset clears them.
- The search clear control preserves focus. `/` reveals/focuses search outside
  inputs and dialogs and exits desktop focus mode. Typing is not intercepted.
- Catalog counts and local-storage explanation move into a keyboard-accessible
  library information dialog. Import/export and paging remain directly available.
- Inspector tabs stay visible while scrolling. Spacing and description chrome
  are reduced; Contact help holds explanatory prose, not controls or warnings.
- The one-panel mobile workspace now applies through 900 pixels, with a bottom
  navigation bar, safe-area support and scrollable short-height layouts.

## Measured space improvement

The before/after checks use the same stock standing study and source-reference
collection. Counts mean complete cards visible inside the scrollable list, not
the total DOM count. The card bound remains 24 per page.

| Viewport | Reference list height before → after | Complete reference cards before → after |
| --- | --- | --- |
| 1440 × 844 | 182.5 → 576 px | 2 → 7 |
| 1024 × 768 | 112.5 → 465 px | 0 → 5 |
| 390 × 844 | 209 → 496 px | 2 → 6 |
| 320 × 700 | 34 → 352 px | 0 → 4 |

At 1440 × 844 the normal desktop canvas grows from 812 × 515.3125 pixels to
862 × 640.703125 pixels: approximately **32% more canvas area**, before activating
Focus. The compact library's default control area falls from 455 to 132 pixels
at that desktop size and from 415.5 to 152 pixels at 320 × 700.

The intermediate 768 × 1024 tablet view exposes eight complete reference rows.
At 844 × 390, the library and stage scroll internally so filters, pagination
and camera controls remain reachable rather than extending behind navigation.

## Verification inventory

The gate inventory and sanitized test results are recorded in the ledger above.

- New browser coverage checks measured density, filter disclosure/count/reset,
  search clear and focus restoration, `/`, Escape and dialog boundaries, no
  scene solve caused by Focus, breakpoint transitions and short landscape views.
- Automated accessibility checks cover desktop, mobile, the open filter panel,
  library information dialog and figure editor. Enlarged 16-pixel control text
  and reduced-motion mode retain reachable controls without horizontal overflow.
- Existing browser flows verify saved edits/history, source associations, all
  source-reference pages/families, named presets and previews, contact authoring,
  camera/pinch, real PNG/SVG/JSON exports and failure recovery.
- Relevant unit coverage includes architecture, camera input, catalog validation,
  source index, persistent library and preview queue/caching.
- The focused checks caught a decorative arrow leaking into the Filters
  accessible name. Its explicit accessible label now matches its visible action
  and active count; the corrected focused run passes without retries.
- A final keyboard probe found a focused field could sit behind the sticky tabs
  when advanced groups were open. Inspector scroll padding now brings focused
  fields below the header; the added browser case verifies desktop and both
  mobile widths. All six compact UI cases were repeated after that fix.

## Boundaries

This iteration changes presentation and layout controls, not the catalog,
storage contract, model assets, renderer or solver. The 1,283 reference records
are still metadata, not new verified 3D reconstructions. The earlier geometry
and storage audits remain historical evidence; this is not a new full geometry
audit or a physical-device/assistive-technology certification. No new dependency,
external font, image-generation asset, cloud service or hosted deployment is added.
