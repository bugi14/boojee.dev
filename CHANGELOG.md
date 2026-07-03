# Changelog

All changes in this project notable to the user will be documented in this file.
For detailed code changes, please refer to the pull requests.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
