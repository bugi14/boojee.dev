import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/destination.css";
import "./styles/placeholder.css";
import "./styles/badges.css";

import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadImageShape } from "@tsparticles/shape-image";
import { loadStarsPreset } from "@tsparticles/preset-stars";
import { loadLinksPreset } from "@tsparticles/preset-links";
import { loadSnowPreset } from "@tsparticles/preset-snow";
import { loadFireflyPreset } from "@tsparticles/preset-firefly";
import { loadBubblesPreset } from "@tsparticles/preset-bubbles";
import { loadFountainPreset } from "@tsparticles/preset-fountain";
import { loadHyperspacePreset } from "@tsparticles/preset-hyperspace";
import { loadFirePreset } from "@tsparticles/preset-fire";

import { createCvPage } from "./pages/cv.js";
import fireflyPlanetSvg from "./assets/particles/firefly-planet.svg";
import fireflySaturnSvg from "./assets/particles/firefly-saturn.svg";
import fireflyAstronautSvg from "./assets/particles/firefly-astronaut.svg";
import fireflyRocketSvg from "./assets/particles/firefly-rocket.svg";
import fireflyGalaxySvg from "./assets/particles/firefly-galaxy.svg";

// One entry per SVG type — cycled through on each edge-spawn so the steady-state
// set contains at most one of each kind (planet, saturn, astronaut, rocket, galaxy).
// sizeOverride (if set) is the radius in CSS px passed to addParticle() for
// that type — used to compensate for non-square SVGs. tsParticles renders image
// particles at width = 2*radius and height = 2*radius*(imgHeight/imgWidth), so
// a portrait astronaut (318×677) at the default radius 30 would render at
// 60×128px — much taller than the 60×60 of the square types. A radius of ~14
// makes its largest side (height) come out at 60px instead.
const PLANET_IMAGES = [
  { src: fireflyPlanetSvg,    width: 1024, height: 1024 },
  { src: fireflySaturnSvg,    width: 1024, height: 1024 },
  { src: fireflyAstronautSvg, width: 318,  height: 677, sizeOverride: 14 },
  { src: fireflyRocketSvg,    width: 1024, height: 1024 },
  { src: fireflyGalaxySvg,    width: 1024, height: 1024 },
];

const PRESET_LOADERS = {
  stars: loadStarsPreset,
  links: loadLinksPreset,
  snow: loadSnowPreset,
  firefly: loadFireflyPreset,
  bubbles: loadBubblesPreset,
  fountain: loadFountainPreset,
  hyperspace: loadHyperspacePreset,
  fire: loadFirePreset,
};

// Extra options merged on top of a preset's defaults (tsParticles deep-merges
// these with the named preset when both are passed in the same options object).
const PRESET_OVERRIDES = {
  stars: {
    particles: {
      number: {
        // Zero initial particles — all spawned via spawnAtEdge() so every
        // particle gets its per-type size override applied correctly.
        value: 0,
      },
      move: {
        enable: true,
        speed: 0.6,
        random: true,
        direction: "none",
        outModes: { default: "out" },
      },
      size: {
        value: 30,
        random: { enable: true, minimumValue: 15 },
      },
      opacity: {
        value: 1,
        animation: { enable: false },
      },
      shape: {
        type: "image",
        options: {
          // Provide all images so tsParticles can assign them on initial load;
          // subsequent spawns are cycled in order via spawnAtEdge() below.
          image: PLANET_IMAGES,
        },
      },
    },
  },
};

// "Black hole" effect for the stars preset: every star accelerates toward
// the cursor following an inverse-square law (like gravity) — there's no
// pull radius, distance alone determines strength, so distant stars barely
// move while close ones plunge in fast. Stars pulled inside
// EVENT_HORIZON_RADIUS are consumed — a flash particle is spawned in their
// place. Population is maintained at a constant density (stars per unit
// area, not a fixed count) every tick, topping up or trimming at the frame
// edges as needed — this covers absorption, stars slingshotted off-screen
// and destroyed by tsParticles' own out-of-bounds handling, and window
// resizes. New stars spawn with no initial velocity of their own, so they
// ease in under the same gravity as everything else, like a star just
// beyond the frame drifting into the cursor's pull. Distances are CSS px.
const EVENT_HORIZON_RADIUS = 16;
const MIN_SPAWN_DISTANCE = 200; // keep new stars from spawning right next to the cursor
const GRAVITY = 7500;
// Pure inverse-square falloff makes the pull vanish at any real distance —
// beyond this range the effective distance used in the 1/dist² calculation
// is capped, so a star clear across the screen still feels a small but
// steady pull toward the cursor instead of an imperceptible one that only
// becomes noticeable once it's already almost on top of the cursor.
const MAX_GRAVITY_DISTANCE = 500;
const EDGE_SPAWN_DRIFT_SPEED = 0.05; // barely-perceptible nudge inward, just enough for gravity to take over
const MAX_SPEED = 40;
const FRICTION = 0.98; // gentle decay so a slingshotted star doesn't accelerate forever
const MAX_SPAWNS_PER_TICK = 5; // safety net against a bad density reading flooding the screen
const EXPLOSION_DURATION_MS = 1000;
const EXPLOSION_MIN_RADIUS = 6;
const EXPLOSION_MAX_RADIUS = 45;
// Absorbed stars don't respawn immediately — the explosion gets a beat to
// play out on its own before a replacement drifts back in from the edge.
const RESPAWN_DELAY_MS = 5000;

const blackHole = {
  container: null,
  mouse: null,
  rafId: null,
  velocities: null,
  baseDensity: 0, // stars per retina px², so total count scales with actual canvas area
  imageIndex: 0,  // cycles through PLANET_IMAGES so each spawn gets the next type in order
  // Real (non-flash) particle count, tracked directly rather than derived from
  // container.particles.count each tick — see the comment above the density
  // top-up/trim block in update() for why derivation was unreliable.
  starCount: 0,
  explosions: null, // { particle, startTime }[] — absorption flashes mid-animation
  pendingSpawns: null, // timestamps (ms) at which a delayed replacement star is due

  attach(container, wrapperEl) {
    this.detach();
    this.container = container;
    this.velocities = new WeakMap();
    this.imageIndex = 0;
    this.starCount = container.particles.count;
    this.explosions = [];
    this.pendingSpawns = [];
    this.setBaseDensity(container);

    // Listen on the wrapper div, not the <canvas> — tsParticles can recreate
    // its internal canvas element (e.g. on retina/resize adjustments), which
    // would silently orphan a listener attached directly to it. The wrapper
    // is ours and stays put for the lifetime of this preset.
    const onMove = (e) => {
      const rect = wrapperEl.getBoundingClientRect();
      const ratio = container.retina.pixelRatio;
      this.mouse = {
        x: (e.clientX - rect.left) * ratio,
        y: (e.clientY - rect.top) * ratio,
      };
    };
    const onLeave = () => {
      this.mouse = null;
    };

    wrapperEl.addEventListener("mousemove", onMove);
    wrapperEl.addEventListener("mouseleave", onLeave);
    this._cleanup = () => {
      wrapperEl.removeEventListener("mousemove", onMove);
      wrapperEl.removeEventListener("mouseleave", onLeave);
    };

    const tick = () => {
      this.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  // The canvas can briefly report a zero-area size right after a fresh
  // container is attached (e.g. the wrapper div was just swapped into the
  // DOM and hasn't been through a layout pass yet), which would make
  // count/(width*height) evaluate to Infinity. Left unguarded, that flows
  // straight into update()'s target-star-count calculation and the density
  // top-up loop tries to spawn an unbounded number of stars every single
  // frame — visually a flood of stars piling up, and heavy enough to hang
  // the tab. Falls back to 0 (no top-up) until a real measurement lands.
  setBaseDensity(container) {
    const { width, height } = container.canvas.size;
    const area = width * height;
    if (!(area > 0)) {
      this.baseDensity = 0;
      requestAnimationFrame(() => {
        if (this.container === container) this.setBaseDensity(container);
      });
      return;
    }
    // Use a fixed target of one particle per image type regardless of how
    // many tsParticles happened to spawn initially (which is 0 — see number.value).
    this.baseDensity = PLANET_IMAGES.length / area;
  },

  detach() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._cleanup) this._cleanup();
    this.rafId = null;
    this._cleanup = null;
    this.container = null;
    this.mouse = null;
    this.velocities = null;
    this.explosions = null;
    this.pendingSpawns = null;
  },

  update() {
    const { container, mouse } = this;
    if (!container || container.destroyed) return;

    const ratio = container.retina.pixelRatio;
    const horizonSq = (EVENT_HORIZON_RADIUS * ratio) ** 2;
    // Clamp the minimum distance used in the 1/dist² falloff so acceleration
    // can't blow up to Infinity/NaN as a star nears the cursor — it's capped
    // at a large-but-finite value right at the event horizon boundary.
    const minDist = EVENT_HORIZON_RADIUS * ratio;
    const maxDist = MAX_GRAVITY_DISTANCE * ratio;
    const maxSpeed = MAX_SPEED * ratio;
    // Safety net: a star can only be absorbed once per frame in practice.
    // Cap it hard so a future edge case degrades instead of hanging the tab.
    const MAX_ABSORPTIONS_PER_TICK = 10;
    let absorptions = 0;

    for (let i = container.particles.count - 1; i >= 0; i--) {
      const particle = container.particles.get(i);
      if (!particle || particle.destroyed) continue;
      if (particle.isFlash) continue;

      // tsParticles rescales every particle's position on a canvas resize
      // by multiplying in a newSize/oldSize factor (see CanvasManager). If
      // the container is ever measured at 0×0 for a moment — e.g. its
      // ancestor is `hidden` (display:none) during a route transition and a
      // resize event fires while that's true — that factor becomes Infinity,
      // and any particle sitting at position 0 on either axis (like our
      // edge spawns) goes to 0 × Infinity = NaN. A NaN position poisons all
      // the arithmetic below forever (NaN comparisons are always false, so
      // it can never be absorbed or accelerated again) and silently no-ops
      // in the canvas draw call, leaving it visually frozen in place. Rather
      // than trying to prevent every way tsParticles' internal resize
      // handling could go wrong, just detect and remove corrupted particles
      // here — the density top-up spawns a fresh, healthy one next tick.
      if (!Number.isFinite(particle.position.x) || !Number.isFinite(particle.position.y)) {
        container.particles.remove(particle);
        this.starCount--;
        continue;
      }

      const vel = this.velocities.get(particle) ?? { x: 0, y: 0 };

      if (mouse) {
        const dx = mouse.x - particle.position.x;
        const dy = mouse.y - particle.position.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < horizonSq) {
          if (absorptions >= MAX_ABSORPTIONS_PER_TICK) continue;
          absorptions++;
          this.spawnExplosion(container, particle.position);
          container.particles.remove(particle);
          this.starCount--;
          this.pendingSpawns.push(performance.now() + RESPAWN_DELAY_MS);
          continue;
        }

        // Inverse-square "gravity", applied to every star regardless of
        // distance — acceleration falls off with the square of the
        // distance, so distant stars barely feel it while close ones get
        // pulled in hard and fast. The effective distance is clamped to
        // MAX_GRAVITY_DISTANCE so it never decays away to nothing — a star
        // clear across the screen still feels the same steady pull as one
        // right at that boundary, instead of an imperceptible fraction of it.
        const dist = Math.sqrt(distSq) || 1;
        const clampedDist = Math.min(Math.max(dist, minDist), maxDist);
        const accel = GRAVITY / (clampedDist * clampedDist);
        vel.x += (dx / dist) * accel;
        vel.y += (dy / dist) * accel;
      }

      // Friction applies whether or not the star is currently being pulled,
      // so a slingshotted star gradually settles instead of drifting at top
      // speed forever.
      vel.x *= FRICTION;
      vel.y *= FRICTION;

      const speed = Math.hypot(vel.x, vel.y);
      if (speed > maxSpeed) {
        vel.x = (vel.x / speed) * maxSpeed;
        vel.y = (vel.y / speed) * maxSpeed;
      }

      if (vel.x !== 0 || vel.y !== 0) {
        particle.position.x += vel.x;
        particle.position.y += vel.y;
        this.velocities.set(particle, vel);
      }
    }

    this.updateExplosions(container);

    // Fire any delayed replacement spawns whose wait is over. Each of these
    // was deliberately withheld from the immediate top-up below (see
    // "reserved" comment) so the absorption's explosion gets to play out
    // undisturbed before its replacement drifts back in.
    const now = performance.now();
    while (this.pendingSpawns.length && this.pendingSpawns[0] <= now) {
      this.pendingSpawns.shift();
      this.spawnAtEdge(container);
    }

    // Maintain a constant density (not a constant count) — target scales
    // with the current canvas area, recomputed every tick so it tracks
    // window resizes. Tops up stars lost to tsParticles' own out-of-bounds
    // handling or NaN cleanup, and trims the surplus if the window shrinks,
    // so density never drifts up on a smaller viewport.
    //
    // starCount is a manually maintained tally (incremented in spawnAtEdge,
    // decremented on every removal above) rather than being derived here from
    // container.particles.count - flashCount. That derivation used to
    // undercount on the very tick a flash was spawned — the new flash is
    // pushed to the end of the particles array, past the point this tick's
    // downward loop had already reached, so it went uncounted by flashCount
    // and briefly inflated the apparent star count by one. Combined with
    // tsParticles running its own render loop independently of this one
    // (destroying the flash on its own schedule once its animation finishes),
    // that made the top-up for a single absorption land off-by-one across two
    // ticks in a way that could spawn an extra star instead of just one
    // delayed by a tick — a slow population creep, one extra star per
    // absorption, some of which then sat at the edge alongside a healthy
    // replacement.
    //
    // Stars still waiting out RESPAWN_DELAY_MS count as already "reserved"
    // toward the target, so this top-up doesn't immediately refill a gap
    // that's intentionally being held open — only gaps from something other
    // than a pending delayed respawn (e.g. a resize) get filled right away.
    const { width, height } = container.canvas.size;
    const targetStarCount = Math.round(this.baseDensity * width * height);
    const reservedStarCount = this.starCount + this.pendingSpawns.length;

    if (reservedStarCount < targetStarCount) {
      // Safety net: if baseDensity or the canvas size is ever momentarily
      // bogus (e.g. a zero-area canvas produced a bad density reading before
      // this fix), cap how many stars can be created in a single frame so a
      // bad reading degrades gracefully instead of flooding the screen with
      // new stars every tick.
      const toSpawn = Math.min(targetStarCount - reservedStarCount, MAX_SPAWNS_PER_TICK);
      for (let i = 0; i < toSpawn; i++) {
        this.spawnAtEdge(container);
      }
    } else if (reservedStarCount > targetStarCount) {
      let excess = reservedStarCount - targetStarCount;
      for (let i = container.particles.count - 1; i >= 0 && excess > 0; i--) {
        const particle = container.particles.get(i);
        if (!particle || particle.destroyed || particle.isFlash) continue;
        container.particles.remove(particle);
        this.starCount--;
        excess--;
      }
    }
  },

  spawnAtEdge(container) {
    const { width, height } = container.canvas.size;
    const ratio = container.retina.pixelRatio;
    // A point picked anywhere along the edge can coincidentally land right
    // next to the cursor if it's currently near that edge — inverse-square
    // gravity then yanks the new star in instantly, reading as a sudden
    // burst of speed instead of the same gentle drift every other star
    // gets. Resample a few times to keep spawns a safe distance away.
    const minDistSq = (MIN_SPAWN_DISTANCE * ratio) ** 2;
    let x, y;
    for (let attempt = 0; attempt < 10; attempt++) {
      switch (Math.floor(Math.random() * 4)) {
        case 0: // top
          x = Math.random() * width;
          y = 0;
          break;
        case 1: // bottom
          x = Math.random() * width;
          y = height;
          break;
        case 2: // left
          x = 0;
          y = Math.random() * height;
          break;
        default: // right
          x = width;
          y = Math.random() * height;
          break;
      }
      if (!this.mouse) break;
      const dx = this.mouse.x - x;
      const dy = this.mouse.y - y;
      if (dx * dx + dy * dy >= minDistSq) break;
    }
    // tsParticles' own move plugin is disabled here — its default ambient
    // drift (from the stars preset's move.random setting) reads as an
    // unwanted burst of speed and direction right on spawn. A star with
    // literally zero velocity of its own would otherwise sit frozen right on
    // the edge it spawned on until the cursor's gravity happens to reach it,
    // which at this particle size reads as visibly "stuck". Instead we seed
    // blackHole's own velocity map with a barely-perceptible nudge straight
    // toward the canvas center — just enough that it's already moving away
    // from the edge, so gravity picks it up and takes over smoothly rather
    // than accelerating it from a dead stop.
    const dx = width / 2 - x;
    const dy = height / 2 - y;
    const dist = Math.hypot(dx, dy) || 1;
    const driftSpeed = EDGE_SPAWN_DRIFT_SPEED * ratio;
    // Cycle through images in order so the steady-state set contains one of each type.
    const img = PLANET_IMAGES[this.imageIndex % PLANET_IMAGES.length];
    this.imageIndex++;
    const particleOpts = {
      move: { enable: false },
      shape: { type: "image", options: { image: img } },
    };
    if (img.sizeOverride !== undefined) {
      particleOpts.size = { value: img.sizeOverride };
    }
    const particle = container.particles.addParticle({ x, y }, particleOpts);
    if (particle) {
      this.starCount++;
      this.velocities.set(particle, {
        x: (dx / dist) * driftSpeed,
        y: (dy / dist) * driftSpeed,
      });
    }
  },

  // Grow/fade driven manually every tick (see updateExplosions) rather than
  // through tsParticles' own animation system, which only eases linearly —
  // a hand-rolled curve gets the "grows quickly, then slows but keeps
  // creeping outward, fades gradually" shape the linear one can't produce.
  spawnExplosion(container, position) {
    const explosion = container.particles.addParticle(
      { x: position.x, y: position.y },
      {
        shape: { type: "circle" },
        move: { enable: false },
        color: { value: "#ffffff" },
        opacity: { value: 1, animation: { enable: false } },
        size: { value: EXPLOSION_MIN_RADIUS, animation: { enable: false } },
      },
    );
    if (!explosion) return;
    // Exempt the explosion itself from absorption — it's spawned inside the
    // event horizon by definition and would otherwise re-trigger endlessly.
    explosion.isFlash = true;
    this.explosions.push({ particle: explosion, startTime: performance.now() });
  },

  updateExplosions(container) {
    const now = performance.now();
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const t = (now - explosion.startTime) / EXPLOSION_DURATION_MS;

      if (t >= 1 || explosion.particle.destroyed) {
        container.particles.remove(explosion.particle);
        this.explosions.splice(i, 1);
        continue;
      }

      // Cubic ease-out: rises fast at first, then keeps inching outward at a
      // steadily slowing rate rather than snapping straight to full size.
      const growth = 1 - (1 - t) ** 3;
      explosion.particle.size.value =
        EXPLOSION_MIN_RADIUS + (EXPLOSION_MAX_RADIUS - EXPLOSION_MIN_RADIUS) * growth;
      // Stays bright a little longer than a linear fade before easing out.
      explosion.particle.opacity.value = (1 - t) ** 1.5;
    }
  },
};

// ClimateMapper is a separate, already-deployed application (its own
// codebase/backend/deploy pipeline) rather than content that lives in this
// SPA, so it gets `href` (a real navigation to its own subdomain) instead of
// `hash` (an in-app destination rendered by this app, like the CV).
const NAV_ITEMS = [
  { label: "CV", hash: "cv" },
  { label: "ClimateMapper", href: "https://climatemapper.boojee.dev" },
  { label: "Other Projects", hash: "other-projects" },
  { label: "About", hash: "about" },
];

// Floating nav buttons: plain DOM elements (not tsParticles particles) drifting
// around the nav layer under their own slow RAF loop, in the same spirit as
// the blackHole gravity loop above. DOM gives free :hover/:focus styling,
// native click handling and accessibility, which canvas-drawn particles don't.
const FLOAT_SPEED = 0.15; // CSS px per frame
const NAV_EDGE_MARGIN = 32; // keep floating text off the viewport edges

const navButtons = {
  layer: null,
  particles: null,
  rafId: null,

  attach(layerEl, onNavigate) {
    this.detach();
    this.layer = layerEl;

    this.particles = NAV_ITEMS.map((item) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "nav-particle";
      el.textContent = item.label;
      el.addEventListener("click", () => onNavigate(item));
      layerEl.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      return {
        el,
        width,
        height,
        x: NAV_EDGE_MARGIN + Math.random() * Math.max(window.innerWidth - width - NAV_EDGE_MARGIN * 2, 1),
        y: NAV_EDGE_MARGIN + Math.random() * Math.max(window.innerHeight - height - NAV_EDGE_MARGIN * 2, 1),
        vx: Math.cos(angle) * FLOAT_SPEED,
        vy: Math.sin(angle) * FLOAT_SPEED,
      };
    });

    const tick = () => {
      this.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  detach() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.particles) {
      for (const p of this.particles) p.el.remove();
    }
    this.particles = null;
    this.layer = null;
  },

  update() {
    if (!this.particles) return;
    const minX = NAV_EDGE_MARGIN;
    const minY = NAV_EDGE_MARGIN;
    const maxX = window.innerWidth - NAV_EDGE_MARGIN;
    const maxY = window.innerHeight - NAV_EDGE_MARGIN;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < minX) {
        p.x = minX;
        p.vx = Math.abs(p.vx);
      } else if (p.x + p.width > maxX) {
        p.x = maxX - p.width;
        p.vx = -Math.abs(p.vx);
      }

      if (p.y < minY) {
        p.y = minY;
        p.vy = Math.abs(p.vy);
      } else if (p.y + p.height > maxY) {
        p.y = maxY - p.height;
        p.vy = -Math.abs(p.vy);
      }

      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  },
};

// Small twinkling star dots layered behind the SVG particles — a separate
// container so we can give them completely different size/color/shape settings
// without fighting the SVG layer's image shape config.
let bgToken = 0;
const bgStars = {
  container: null,

  async load() {
    const token = ++bgToken;
    this.container?.destroy();
    const old = document.getElementById("tsparticles-bg");
    const fresh = document.createElement("div");
    fresh.id = "tsparticles-bg";
    old.replaceWith(fresh);

    const container = await tsParticles.load({
      id: "tsparticles-bg",
      options: {
        background: { color: "transparent" },
        fullScreen: { enable: false },
        particles: {
          number: { value: 160 },
          color: { value: ["#dfe7ff", "#78aaff", "#a8c4ff", "#ffffff", "#c8b8ff"] },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 5 } },
          opacity: {
            value: { min: 0.4, max: 0.95 },
            animation: { enable: true, speed: 0.4, sync: false },
          },
          move: {
            enable: true,
            speed: 0.15,
            random: true,
            direction: "none",
            outModes: { default: "out" },
          },
        },
      },
    });

    if (token !== bgToken) { container.destroy(); return; }
    this.container = container;
  },

  destroy() {
    bgToken++;
    this.container?.destroy();
    this.container = null;
  },
};

const registered = new Set();

async function ensurePresetRegistered(preset) {
  if (registered.has(preset)) return;
  await PRESET_LOADERS[preset](tsParticles);
  registered.add(preset);
}

// tsParticles locks its plugin manager on the first tsParticles.load() call —
// any preset not registered before that first call can never be registered
// later (PluginManager.register() throws "Register plugins can only be done
// before calling tsParticles.load()"). So every preset must be registered up
// front; loadPreset() itself only swaps which already-registered preset is
// displayed.
async function registerAllPresets() {
  await Promise.all(Object.keys(PRESET_LOADERS).map((preset) => ensurePresetRegistered(preset)));
}

let currentContainer = null;
// loadPreset() is async but every caller fires it without awaiting (showHome()
// and showPlaceholder() are synchronous, and route changes can happen in
// rapid succession — e.g. a hashchange landing right as a bfcache pageshow
// recovery is also in flight). Without a guard, an earlier call's
// tsParticles.load() can resolve after a later call has already swapped in
// its own div and container, wiring up a "ghost": a container attached to a
// wrapper element that's no longer the visible one, whose blackHole never
// receives real mouse coordinates and whose stars sit frozen forever. This
// token lets a stale resolution detect it's no longer the latest call and
// destroy itself instead of taking over.
let loadToken = 0;

async function loadPreset(preset) {
  const token = ++loadToken;
  blackHole.detach();
  bgStars.destroy();

  // tsParticles.load() doesn't replace an existing container at the same id —
  // it stacks a new one on top, leaving the old one's render loop running
  // forever in the background. Destroy it explicitly before swapping presets.
  currentContainer?.destroy();

  const old = document.getElementById("tsparticles");
  const fresh = document.createElement("div");
  fresh.id = "tsparticles";
  old.replaceWith(fresh);

  const container = await tsParticles.load({
    id: "tsparticles",
    options: {
      preset,
      background: { color: "transparent" },
      fullScreen: { enable: false },
      ...PRESET_OVERRIDES[preset],
    },
  });

  if (token !== loadToken) {
    // A newer loadPreset() call has already taken over while this one was
    // awaiting tsParticles.load() — this container is stale. Destroy it
    // immediately rather than wiring it up as a ghost.
    container.destroy();
    return;
  }

  currentContainer = container;

  if (preset === "stars") {
    blackHole.attach(container, fresh);
    bgStars.load();
  }
}

// Hash-based routing: "#/cv" lands on the real destination view; other hash
// routes with no content yet (see IMPLEMENTED_HASHES) get the shared
// placeholder instead. No hash is the home view with the background effect
// and floating nav buttons.
const HOME_DEFAULT_PRESET = "stars";
const HYPERSPACE_TRAVEL_MS = 2200;
const DESTINATIONS = new Map(
  NAV_ITEMS.filter((item) => item.hash).map((item) => [item.hash, item.label]),
);
// Hash routes with real content. Everything else in DESTINATIONS renders the
// shared "still under formation" placeholder instead of a blank label.
const IMPLEMENTED_HASHES = new Set(["cv"]);

const homeView = document.getElementById("home-view");
const homeHeading = document.getElementById("home-heading");
const destinationView = document.getElementById("destination-view");
const destinationContent = document.getElementById("destination-content");
const destinationLabel = document.getElementById("destination-label");
const destinationBack = document.getElementById("destination-back");
const placeholderView = document.getElementById("placeholder-view");
const placeholderBack = document.getElementById("placeholder-back");
const navLayer = document.getElementById("nav-layer");
const contactBadges = document.getElementById("contact-badges");
const cvPage = createCvPage();
destinationContent.appendChild(cvPage);

let traveling = false;

function showHome() {
  homeView.hidden = false;
  homeHeading.hidden = false;
  placeholderView.hidden = true;
  destinationView.hidden = true;
  contactBadges.hidden = false;
  navButtons.attach(navLayer, travelTo);
  // Mirrors showPlaceholder() reloading "stars" itself: landing on home
  // always resets the background regardless of which preset was showing
  // beforehand (e.g. hyperspace, left over from CV having never touched it).
  loadPreset(HOME_DEFAULT_PRESET);
}

// The "cv" destination renders the static CV markup already in the page
// (#cv-page); every other implemented destination would follow the same
// pattern here.
function showDestination(hash, label) {
  navButtons.detach();
  homeView.hidden = true;
  destinationView.hidden = false;
  contactBadges.hidden = false;

  const isCv = hash === "cv";
  destinationContent.classList.toggle("is-cv", isCv);
  destinationLabel.hidden = isCv;
  destinationLabel.textContent = isCv ? "" : label;
  cvPage.hidden = !isCv;
}

// Not-yet-implemented destinations keep the homepage's tsparticles/black-hole
// background running (loadPreset() re-attaches blackHole for "stars") rather
// than the destination view's usual blank background, so they still feel
// like part of the same site instead of a dead end.
function showPlaceholder() {
  navButtons.detach();
  destinationView.hidden = true;
  homeView.hidden = false;
  homeHeading.hidden = true;
  placeholderView.hidden = false;
  contactBadges.hidden = false;
  loadPreset(HOME_DEFAULT_PRESET);
}

function renderRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const label = DESTINATIONS.get(hash);
  if (!label) {
    showHome();
  } else if (IMPLEMENTED_HASHES.has(hash)) {
    showDestination(hash, label);
  } else {
    showPlaceholder();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Plays the hyperspace preset for the travel duration. The particle canvas
// only lives in the home view, so the caller must make sure home-view is
// visible before calling this — loading a preset while its container is
// display:none leaves tsParticles measuring a zero-size canvas, which is
// also why stars never reappeared after a plain (non-animated) "back".
async function playHyperspace() {
  homeHeading.hidden = true;
  contactBadges.hidden = true;
  await loadPreset("hyperspace");
  await wait(HYPERSPACE_TRAVEL_MS);
}

// Set right before we change the hash ourselves (as opposed to the user
// pressing the browser's back/forward buttons), so the hashchange listener
// below can tell the two apart — see handleHashChange().
let pendingHashChange = false;

function setHash(hash) {
  pendingHashChange = true;
  window.location.hash = hash;
}

// Nav items with an `href` (e.g. ClimateMapper) are separate applications
// living outside this SPA: after the hyperspace transition, navigate away
// for real instead of setting an in-app hash route.
async function travelTo(item) {
  if (traveling) return;
  traveling = true;
  navButtons.detach();

  await playHyperspace();

  if (item.href) {
    // Reset before the real navigation so that if the browser freezes this
    // page into its back-forward cache (bfcache) instead of discarding it,
    // the snapshot it restores on "back" isn't stuck mid-travel.
    traveling = false;
    window.location.href = item.href;
    return;
  }

  setHash(`/${item.hash}`);
  traveling = false;
}

async function travelHome() {
  if (traveling) return;
  traveling = true;

  destinationView.hidden = true;
  placeholderView.hidden = true;
  homeHeading.hidden = true;
  homeView.hidden = false;

  await playHyperspace();

  setHash("");
  traveling = false;
}

function goHome(e) {
  e.preventDefault();
  travelHome();
}

destinationBack.addEventListener("click", goHome);
placeholderBack.addEventListener("click", goHome);

// The browser's own back/forward buttons change the hash directly,
// bypassing travelTo()/travelHome() (and the hyperspace transition they
// play) entirely — landing straight on the new view. pendingHashChange
// distinguishes that from a hash change we triggered ourselves (which
// already played hyperspace before setting the hash, so only needs to
// render the new route) — see setHash().
async function handleHashChange() {
  if (pendingHashChange) {
    pendingHashChange = false;
    renderRoute();
    return;
  }

  if (traveling) return;
  traveling = true;
  navButtons.detach();

  // Reveal the home view before playing hyperspace: the particle canvas only
  // lives there, and loading a preset while its container is display:none
  // leaves tsParticles measuring a zero-size canvas (see playHyperspace()).
  destinationView.hidden = true;
  placeholderView.hidden = true;
  homeHeading.hidden = true;
  homeView.hidden = false;

  await playHyperspace();

  traveling = false;
  renderRoute();
}

window.addEventListener("hashchange", handleHashChange);

// Returning via the browser's back button after navigating to an external
// page (e.g. ClimateMapper) can restore this page from the back-forward
// cache (bfcache) instead of reloading it — resurrecting whatever in-memory
// state existed the instant it was left, including a frozen hyperspace
// preset and detached nav buttons. `pageshow`'s `persisted` flag is how a
// bfcache restore is detected. Replaying the hyperspace transition here
// mirrors travelHome()'s reveal, so "back" from ClimateMapper still plays
// out as a travel sequence rather than snapping straight to the homepage.
async function recoverFromBfcache() {
  traveling = true;
  await playHyperspace();
  traveling = false;
  renderRoute();
}

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  traveling = false;
  if (homeView.hidden) {
    renderRoute();
  } else {
    recoverFromBfcache();
  }
});

async function init() {
  await loadSlim(tsParticles);
  await loadImageShape(tsParticles);
  await registerAllPresets();
  renderRoute();
}

init();
