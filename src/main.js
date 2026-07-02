import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadStarsPreset } from "@tsparticles/preset-stars";
import { loadLinksPreset } from "@tsparticles/preset-links";
import { loadSnowPreset } from "@tsparticles/preset-snow";
import { loadFireflyPreset } from "@tsparticles/preset-firefly";
import { loadBubblesPreset } from "@tsparticles/preset-bubbles";
import { loadFountainPreset } from "@tsparticles/preset-fountain";
import { loadHyperspacePreset } from "@tsparticles/preset-hyperspace";
import { loadFirePreset } from "@tsparticles/preset-fire";

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
      move: {
        enable: true,
        speed: 0.6,
        random: true,
        direction: "none",
        outModes: { default: "out" },
      },
    },
  },
};

// "Black hole" effect for the stars preset: stars within PULL_RADIUS drift
// toward the cursor, and stars pulled inside EVENT_HORIZON_RADIUS are
// consumed — a flash particle is spawned in their place and a fresh star
// respawns elsewhere, keeping the field populated. Distances are CSS px.
const PULL_RADIUS = 260;
const EVENT_HORIZON_RADIUS = 16;
const MAX_PULL_SPEED = 6;

const blackHole = {
  container: null,
  mouse: null,
  rafId: null,

  attach(container, wrapperEl) {
    this.detach();
    this.container = container;

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
      this.checkAbsorptions();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  detach() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._cleanup) this._cleanup();
    this.rafId = null;
    this._cleanup = null;
    this.container = null;
    this.mouse = null;
  },

  checkAbsorptions() {
    const { container, mouse } = this;
    if (!container || !mouse || container.destroyed) return;

    const ratio = container.retina.pixelRatio;
    const pullRadius = PULL_RADIUS * ratio;
    const horizonSq = (EVENT_HORIZON_RADIUS * ratio) ** 2;
    const maxPullSpeed = MAX_PULL_SPEED * ratio;
    // Safety net: a star can only be absorbed once per frame in practice.
    // Cap it hard so a future edge case degrades instead of hanging the tab.
    const MAX_ABSORPTIONS_PER_TICK = 10;
    let absorptions = 0;

    for (let i = container.particles.count - 1; i >= 0; i--) {
      const particle = container.particles.get(i);
      if (!particle || particle.destroyed || particle.isFlash) continue;

      const dx = mouse.x - particle.position.x;
      const dy = mouse.y - particle.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < horizonSq) {
        if (absorptions >= MAX_ABSORPTIONS_PER_TICK) continue;
        absorptions++;
        this.spawnFlash(container, particle.position);
        container.particles.remove(particle);
        // Replace the consumed star so the field stays populated. Position
        // must be explicit and random — addParticle() with no position can
        // default to the last interaction point, spawning the replacement
        // right back inside the event horizon and cascading forever.
        const { width, height } = container.canvas.size;
        container.particles.addParticle({ x: Math.random() * width, y: Math.random() * height });
        continue;
      }

      if (distSq >= pullRadius * pullRadius) continue;

      // Hand-rolled pull, not tsParticles' built-in "attract" mode — its
      // force calculation blows up as distance approaches 0. This version
      // is unconditionally stable: speed is clamped and capped to the
      // remaining distance, so a particle can never overshoot the cursor.
      const dist = Math.sqrt(distSq) || 1;
      const proximity = 1 - dist / pullRadius; // 0 at edge, 1 at cursor
      const speed = Math.min(dist, maxPullSpeed * (0.2 + proximity));
      particle.position.x += (dx / dist) * speed;
      particle.position.y += (dy / dist) * speed;
    }
  },

  spawnFlash(container, position) {
    const flash = container.particles.addParticle(
      { x: position.x, y: position.y },
      {
        shape: { type: "circle" },
        move: { enable: false },
        color: { value: "#ffffff" },
        opacity: {
          value: { min: 0, max: 1 },
          animation: { enable: true, speed: 5, startValue: "max", destroy: "min", sync: true },
        },
        size: {
          value: { min: 6, max: 16 },
          animation: { enable: true, speed: 30, startValue: "min", destroy: "max", sync: true },
        },
      },
    );
    // Exempt the flash itself from absorption — it's spawned inside the
    // event horizon by definition and would otherwise re-trigger endlessly.
    if (flash) flash.isFlash = true;
  },
};

const registered = new Set();

async function ensurePresetRegistered(preset) {
  if (registered.has(preset)) return;
  await PRESET_LOADERS[preset](tsParticles);
  registered.add(preset);
}

async function loadPreset(preset) {
  await ensurePresetRegistered(preset);

  blackHole.detach();

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

  if (preset === "stars") {
    blackHole.attach(container, fresh);
  }
}

const select = document.getElementById("preset");
select.addEventListener("change", () => loadPreset(select.value));

async function init() {
  await loadSlim(tsParticles);
  await loadPreset(select.value);
}

init();
