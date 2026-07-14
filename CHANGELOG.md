# Changelog

All changes in this project notable to the user will be documented in this file.
For detailed code changes, please refer to the pull requests.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-07-14

Mobile layout overhaul for narrow phone viewports (tested on Vivo X200 5G, 357 px CSS width). See [#31](https://github.com/bugi14/boojee.dev/pull/31).

### Fixed
- **Missing viewport meta tag**: `<meta name="viewport" content="width=device-width, initial-scale=1">` was absent, causing mobile browsers to use a ~980 px layout viewport and scale everything down. Adding it was the root cause of most subsequent sizing work.
- **Two-column layout preserved down to 320 px**: the grid previously collapsed at 380 px. Three breakpoints now progressively narrow the sidebar track (700 px → 560 px → 420 px) before the single-column fallback at 320 px. `min-width: 0` added to `.cv-main` to prevent long words from blowing out the grid track.
- **Scroll-triggered header on mobile** (≤ 520 px): the header now starts at the top of the page in its normal flow position. After scrolling 24 px it slides into the sticky left sidebar (hysteresis undock at 4 px scroll-back). Previously it was permanently in the sidebar from page load.
- **Toptal badge overlap at wide desktop widths**: the badge's fixed position overlapped the CV content below ~1556 px. `SIDEBAR_OVERLAY_QUERY` raised from 900 px to 1450 px in both `cv.js` and `main.js`, so the badge moves into the sidebar well before the overlap zone.
- **Toptal badge in single-column mode** (≤ 320 px): previously restored to `position: fixed`, overlapping the main content. `cv.js` now places it after `.cv-main` so it sits at the bottom of the page flow.
- **Toptal badge internal scaling at ≤ 420 px**: the card was 67 px wide but the inline SVGs had hardcoded `width="38"` (stars) and `width="61"` (Toptal wordmark) — wider than the hex clip area. Added CSS overrides: stars → 16 px, wordmark → 28 px; hex wrapper padding 6 px → 3 px; divider 40 px → 32 px. Media-query cascade bug also fixed: the `≤ 420 px` block was listed before `≤ 600 px` in `badges.css`, so the wider rule silently won — reordered so 420 px comes last.
- **Hover popup on touch**: the trigger-phrase popup (e.g. for "astrophysics") was appearing on mobile tap because `mouseover` is synthesised from touch events. Replaced `mouseover`/`mouseout` with `pointerover`/`pointerout` guarded by `e.pointerType === "mouse"`.
- **About-section link flow**: trigger-phrase `<button>` elements set to `display: inline` so they flow continuously with surrounding text rather than being isolated `inline-block` atoms that break onto their own lines. `overflow-wrap: break-word` added to `.cv-section-body p` to handle long inline runs in the narrow main column.
- **Skills list indentation**: browser UA stylesheets apply `margin-inline-start` / `padding-inline-start` via logical properties; the existing physical `margin: 0` / `padding: 0` shorthands did not clear them. Added explicit resets on `.cv-skills dd` and `.cv-skills-list`.
- **Skills gap within groups**: the `gap: 14px` on the flex `<dl>` applied between every `<dt>`/`<dd>` pair, including between a category header and its own list. At ≤ 420 px: replaced with `gap: 0`, `dt { margin-top: 8px }` (skipped on `:first-child`) and `dt { margin-bottom: 1px }`, so spacing appears only between groups.
- **Icon colour in sidebar**: `#cv-page a { color: var(--color-cv-link) }` outranked `.contact-icon { color: #fff }` once the badge was reparented inside `#cv-page`. Fixed with `#contact-badges .contact-icon { color: #fff }`.

### Changed
- **Font scaling across three mobile breakpoints** (≤ 700 / 560 / 420 px): body text, entry headings (`h3`), entry subtitle/location, dates, tech-stack text, skills category labels (`dt`) and skill values (`dd`), subtitle (`.cv-title`), PDF link, more/less toggle, and section heading (`h2`) all now have explicit overrides at each breakpoint. Previously most elements used hardcoded `rem` values that ignored the page-level `font-size` reduction.
- **Sidebar column widened ~10%** at ≤ 420 px: `minmax(75 px, 91 px)` → `minmax(83 px, 100 px)`, giving the main column ~⅔ of available width at 357 px.
- **Section borders thinned** to 1 px at ≤ 420 px (was 2 px).
- **Section padding tightened**: all sides 10 px at ≤ 420 px; destination content padding 88 px / 24 px / 64 px → 16 px / 8 px / 72 px on mobile (≤ 600 px) now that fixed top-chrome is hidden.
- **Logo and back button hidden** on mobile (≤ 600 px) to reclaim screen space.
- **Light/dark toggle moved to bottom-right** on mobile (≤ 600 px).
- **Subtitle (`.cv-title`) and PDF link hidden** when the header is in the mobile sidebar — only the name and photo are shown in the compact sidebar header.
- **Contact icons** reduced to 75% at ≤ 420 px: circle 30 px → 22 px, SVG 15 px → 11 px.
- **Nav pill vertical spacing** reduced ~30% at ≤ 420 px: row gap 4 px → 3 px, pill padding 4 px → 2 px top/bottom.
- **Sidebar height** uses `100dvh` (with `100vh` fallback) so the sticky column stays within the visible viewport on mobile browsers with a retractable address bar.

## [1.2.0] - 2026-07-13

Other Projects page, starting with a CouchSearch write-up. See [#30](https://github.com/bugi14/boojee.dev/pull/30).

### Added
- **Other Projects page** (`src/pages/projects.js`, `projects-data.js`, `projects.css`): the "Other Projects" destination now renders real content instead of the placeholder, following the CV page's panel styling for visual consistency. `other-projects` is marked implemented in `IMPLEMENTED_HASHES`.
- **CouchSearch project entry**: a write-up covering the problem, approach, the region-cover algorithm, the two-geocoder pipeline, and engineering discipline, plus a captioned demo GIF and region-cover screenshot, and a Status note explaining the project is paused after Couchsurfing's 2026 site overhaul broke the scraping layer mid-development.

## [1.1.0] - 2026-07-13

Progressive-disclosure CV page with floating nav, contextual highlighting, and hover previews. See [#28](https://github.com/bugi14/boojee.dev/pull/28).

### Added
- **Interactive CV page** (`src/pages/cv.js`, `cv-data.js`, `cv.css`): the CV page now uses progressive disclosure — only the header and About section are visible on landing. Skills, Experience, and Education are opened via floating nav pills.
- **Floating nav pills**: fixed-position section nav that lives inside the header border when at the top of the page, then docks to a compact card in the bottom-right corner (above the Toptal badge) once the user scrolls down. Hysteresis (dock at 24 px scroll, undock at 4 px) prevents the bounce loop that would otherwise occur when docking shrinks the page height.
- **Read more / less toggle**: each section has a short CV-style view (default) and a detailed LinkedIn-style view toggled with a More/Less button.
- **Trigger phrases in About**: phrases like "8+ years of Python", "mathematical models", "ClimateMapper", and "multi-year economic index platform" are clickable. Clicking opens the relevant sections with the matched entries and bullets highlighted; hovering shows a hover popup with just the highlighted content windowed.
- **Content windowing**: highlighted bullets are shown with one faded neighbour above and below, and a "Show all / Show less" toggle to expand the full section.
- **Section-level fading**: non-targeted entries within an opened section are faded out (directional fade before/after) so the highlighted entry stands out.
- **Hover previews**: hovering a trigger phrase shows a popup to the right listing all highlighted entries in CV order, each windowed to the relevant content. Clicking the popup activates the same trigger in the main frame.
- **tsParticles links background** (`src/particles/cv-background.js`): an interactive particle-links canvas fills the CV page background, with mouse-grab interactivity.
- **Printable CV link**: a "View printable version" link in the header opens the PDF CV (`public/assets/documents/darren-buttigieg-cv.pdf`) in a new tab.

## [1.0.0] - 2026-07-08

Visual polish pass: colour themes, SVG particles, and site chrome. See [#22](https://github.com/bugi14/boojee.dev/issues/22).

### Added
- **Light/dark colour theme** (`src/styles/base.css`, `index.html`): every page now follows a CSS-variable palette, with a manual toggle pinned top-right. The chosen theme is written to `localStorage` and read back before first paint (falling back to dark if nothing is stored yet), so it persists across visits without a flash of the wrong theme.
- **Themed background stars and hyperspace** (`src/main.js`): the star field and the hyperspace jump now recolour to match the active theme instead of staying a fixed white/default.
- **Bigger absorption explosion**: particles pulled into the cursor now flash a larger burst on contact.
- **Site logo + favicon**: the boojee logo sits fixed top-left on every page (`public/assets/images/logo.svg`), with an opaque variant as the favicon.
- **Elliptical nav movement** (`src/main.js`): floating nav items are now confined to an ellipse (85% of the viewport half-dimensions), start seeded at equidistant sector positions, bounce off the ellipse boundary, bounce off each other, and stay clear of the heading, Toptal badge, contact icons, theme toggle, and logo.
- **Toptal / GitHub / LinkedIn / email badges** (`src/styles/badges.css`): a persistent hire-me badge cluster, bottom-right, restyled to match the site's colour scheme in both themes.

### Fixed
- Theme toggle and contact badges were still visible during the hyperspace transition; they now hide alongside the rest of the UI.
- Background stars stayed white in light mode, and hyperspace colours ignored the active theme — both were caused by tsParticles v4 silently ignoring `particles.color` (fixed by using `particles.paint.fill.color`) and the hyperspace preset's visible background actually being driven by `trail.fill.color`, not `background.color`.
- Some particles could get permanently stuck at the frame edge, never responding to the cursor's gravity again. Root cause was two-fold: (1) the star count used to decide how many replacements to spawn after an absorption was derived by re-scanning particles each tick, which under-counted by one on the exact tick a flash was spawned — so a second, untracked particle would sometimes get spawned alongside the real replacement; (2) tsParticles rescales every particle's position on a canvas resize, and edge spawns start at position 0 on one axis, so a resize firing while the home view was momentarily hidden (e.g. mid route-transition) could turn that `0` into `NaN` — a NaN position poisons all the gravity math permanently, so the particle silently stops responding to the cursor and never moves again. Fixed by tracking the real star count directly instead of re-deriving it, and by detecting and removing any particle with a non-finite position so a healthy replacement spawns in its place.

## [0.3.2] - 2026-07-06

### Changed
- **ClimateMapper nav item now links out to `climatemapper.boojee.dev`** (`src/main.js`): ClimateMapper is a separate, already-deployed application, so clicking it plays the hyperspace transition and then navigates to its own subdomain instead of landing on an in-app `#/climatemapper` placeholder. Other placeholder destinations (Other Projects, About) are unchanged. See [#12](https://github.com/bugi14/boojee.dev/issues/12).

## [0.3.1] - 2026-07-03

### Changed
- **Split `index.html` into modules** (`src/styles/`, `src/pages/cv.js`): the inline `<style>` block is now four CSS files (`base`, `home`, `destination`, and CV-specific) imported directly from `src/main.js`, and the CV markup now lives in `src/pages/cv.js`, which builds the `#cv-page` DOM instead of it being hardcoded in `index.html`. `index.html` is now just the document skeleton (~40 lines, down from ~425). No behavior or visual changes; routing, hyperspace transitions, and nav buttons are unchanged. See [#8](https://github.com/bugi14/boojee.dev/issues/8).

## [0.3.0] - 2026-07-03

Static CV page at `#/cv`, styled after [cv.diogotc.com](https://cv.diogotc.com/). See [#5](https://github.com/bugi14/boojee.dev/issues/5).

### Added
- **CV page content** (`index.html`, `src/main.js`): the `#/cv` destination, previously a bare placeholder, now renders the full resume — header with photo, title, and contact links (email, LinkedIn, GitHub), an About/Skills sidebar, and Experience/Education in the main column. Other destinations (ClimateMapper, Other Projects, About) remain placeholders.
- **Two-column layout**: About and Skills sit in a left sidebar under the full-width header, matching cv.diogotc.com's layout; Experience and Education fill the main column. Columns stack on narrow viewports. Skills are listed as plain text, with no rating indicators.
- **Profile photo**: served from `public/assets/images/darren.jpg`, shown next to the name in the CV header.

### Dev
- Preview/dev launch config (`.claude/launch.json`) now defaults to a fixed alternate port so it doesn't collide with a manually-run `vite` dev server on 5173.

## [0.2.0] - 2026-07-02

Floating text nav buttons that travel through hyperspace to a destination page. See [#3](https://github.com/bugi14/boojee.dev/issues/3).

### Added
- **Floating text nav buttons** (`src/main.js`): CV, ClimateMapper, Other Projects, and About render as real DOM buttons that drift slowly around the screen (like the existing particle effects, but hand-rolled so they get native hover styling, click handling, and accessibility), bouncing off a margin inset from the viewport edges rather than the raw edge.
- **Hyperspace travel transition**: clicking a nav button — or the "← Back" link on a destination page — plays the `hyperspace` preset for the travel duration in both directions before landing.
- **Hash-based routing**: each destination gets its own URL (`#/cv`, `#/climatemapper`, `#/other-projects`, `#/about`). Destination pages are intentionally blank placeholders for now — per-destination content is out of scope for this change.
- **Local development docs**: `npm run dev` / `build` / `preview` scripts and setup instructions in the README.

### Fixed
- Switching to any preset other than the one loaded first previously failed silently — tsParticles' plugin manager only accepts preset registration before the very first `tsParticles.load()` call. All presets are now registered up front at startup.
- Switching presets left the previous preset's render loop running in the background indefinitely (a growing resource leak); the previous container is now explicitly destroyed before loading the next one.
- Returning from a destination page previously left the star field blank, because the preset reload was happening while the home view was still hidden (`display:none`), so tsParticles measured a zero-size canvas. The home view is now revealed before any preset loads.

## [0.1.0] - 2026-07-02

Interactive tsParticles playground with a mouse-driven "black hole" effect on the stars preset.

### Added
- **tsParticles playground** (`index.html`, `src/main.js`): Vite + npm setup with `@tsparticles/engine`, `@tsparticles/slim`, and all preset packages (stars, links, snow, firefly, bubbles, fountain, hyperspace, fire), switchable via a dropdown.
- **Black-hole stars effect**: on the `stars` preset, every star accelerates toward the cursor following an inverse-square gravity law — distant stars barely move, close ones plunge in fast. Stars that reach the cursor are consumed with a brief flash and replaced.
- **Density-based population**: star count scales with canvas area instead of staying fixed, so the field density stays visually consistent across screen sizes and window resizes.

### Fixed
- Replaced an initial CDN-script tsParticles setup with npm/Vite after finding the published `@tsparticles/slim@4.3.1` CDN bundle silently fails to register the interactivity plugin, breaking all mouse/hover interactions.
- Mouse-tracking listener moved from tsParticles' internal `<canvas>` element (which the library can recreate, silently orphaning the listener) to the stable wrapper `<div>`.
- Newly spawned edge stars no longer inherit a random ambient velocity/direction from tsParticles' particle defaults, and no longer spawn close enough to the cursor to get an unrealistic instant "rocket" from gravity.

### Known issues
- Stars occasionally re-enter the frame at high, uncontrolled velocity from a source unrelated to spawning — tracked in [#1](https://github.com/bugi14/boojee.dev/issues/1).
