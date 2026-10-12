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

Category disclosures use a fixed chevron column, left-aligned names and
right-aligned counts. Expanded position tags have a fine border, white backing
and accented hover/keyboard-focus states. `panel-design.spec.js` checks their
alignment, visible boundaries, narrow-screen fit and keyboard filtering at
1440-, 390- and 320-pixel widths without changing the active scene.

`custom-hints.spec.js` checks exact panel bounds at 1080/1440/1600 pixels,
icon-dock bounds and 40-pixel touch targets at 320/390/481/520/844 pixels,
hover transfer, focus/Escape, disabled actions, live title migration,
preservation of existing descriptions, modal hints, custom-menu coexistence,
Chinese labels and Axe. Real Chrome touch events verify that a long press
shows a hint without changing the camera view while a normal tap still changes it.
Native touch swipes also scroll the catalog without loading a card or opening a hint.
Pointer-exit checks also leave keyboard-focused and mouse-clicked triggers,
requiring dismissal within one second without moving keyboard focus.

`unified-style.spec.js` covers icon-only panel/mobile navigation, retained
accessible names and pressed states, live filter-count badges, category
disclosure, figure addition/removal and undo/redo, placement action icons and
help disclosure, aligned XYZ fields, non-overlapping source-card actions,
Chinese names and Axe at 320/390-pixel phone and 844-pixel landscape widths.
Navigation uses a shared muted track/white selected tile; editing actions live
in dedicated rows, while field labels, content names and quality feedback remain text.

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

**Unified style follow-up:** 14 focused Node checks and 24 unique browser
scenarios passed across the regression batch and focused reruns. The final
12-case batch covers pointer-exit dismissal, responsive icon navigation,
sticky-header focus, placement precision/validation, mobile contact editing,
history and localization. Two additional source-catalog/category scenarios
passed. Axe and desktop/mobile screenshot inspection cover the redesigned
navigation and grouped fields. The compact mobile header keeps an 8-pixel
focus-scroll clearance below its sticky controls.

**Previous edge-panel/icon follow-up:** 14 focused Node checks and 20 unique browser
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

## Filter menus and information icons

The follow-up filter fix addresses two reproduced problems: long selected values
were clipped by the two-column layout in the 248-pixel desktop drawer, and
expanding categories alongside filters crowded the scrollable library header.
Filters now use full-width rows; categories and filters disclose one at a time
without clearing applied selections or their count. Category activation closes
filters synchronously, without waiting for the native asynchronous toggle event.
Long category/status values
fit at 1440, 1080, 390 and 320-pixel viewport widths.

Dropdowns share a sticky context heading, soft highlighted/selected rows,
selection checks and quieter shadows. Keyboard highlighting scrolls only the
menu, stays below the heading and leaves padding below the active option.
Fractional option geometry is measured directly to avoid clipping at short
viewport heights. The menus remain accessible above drawers/dialogs and fit
320 × 390 screens when opening upwards.

Composition, partner contacts, placement, joint mode and dress-code explanations
use localized information buttons. Hover, focus and ordinary touch taps reveal
custom hints; leaving the trigger/hint, Escape, scrolling or an outside action
dismisses them. Enter/Space can explicitly reopen an information hint after
Escape. Context updates follow scene state. The library information icon
also exposes its explanatory text as a hint, retaining its detailed reading
dialog. Measurements, solved values, quality status and alerts remain visible.

The 24 focused browser scenarios include menu navigation/cancellation, disclosure
exclusivity, unchanged filter values, touch/Chinese hints, authoring/history,
flush drawer edges and phone/landscape layouts, with Axe checks on visible menus
and information hints. The final 10-case regression batch passes without retries.
Architecture and translation checks pass all 14 cases.

## Studio components and integrated search

The filled-search regression was reproduced before changing the layout:
showing Clear doubled the search container from 32 to 64 pixels because the
shared icon class overrode its absolute positioning. The replacement grid keeps
the magnifier, input, Clear and Filters in one row. Browser checks measure equal
empty/filled/cleared height, icon/action center alignment within 0.5 pixels,
non-overlapping controls and viewport bounds at 1440, 1080, 390 and 320 pixels.
Typing dismisses search hints rather than leaving a tooltip over the heading.

The selected filter approach is an integrated search field and inline editor,
with removable chips shown only while the editor is closed. Fields and chips
never duplicate the same selections on screen; the shared Reset control stays
with the visible surface. Removing a chip retains the query and other filter,
returns to page one and restores useful keyboard focus. Native select labels
remain unchanged; tests use exact names to distinguish them from removal buttons.

Both panels share pale backing, white editing surfaces, dark selected navigation,
icon section headings, a prompt composer, accented disclosures, paired figure
properties, compact switches and level sliders with numeric readouts. Contact
pull sliders reuse their existing percentage readout for the filled track.
Native focus scrolling settles before a keyboard hint appears; ordinary scrolling,
wheel input and pointer departure still dismiss it.

Verification covers 26 focused browser scenarios across the component,
filter/information, hint, compact-layout, unified-style, custom-select and position
catalog suites, including Axe checks, Chinese/touch operation, enlarged text,
history, dialogs, filter reset/pagination and native slider keyboard changes.
Forced-color checks verify the search focus indicator, selected navigation and
native checkbox/slider fallback rather than invisible custom-painted controls.
The final eight-case regression batch passes without retries. The production
build and all 14 architecture/localization checks pass. Solver, storage, catalog
data, panel widths and full-window 3D layout are unchanged; this is not a new
geometry audit or a physical-device certification.
