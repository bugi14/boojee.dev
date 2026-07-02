# Changelog

All changes in this project notable to the user will be documented in this file.
For detailed code changes, please refer to the pull requests.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
