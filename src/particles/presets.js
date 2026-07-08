import { tsParticles } from "@tsparticles/engine";
import { loadStarsPreset } from "@tsparticles/preset-stars";
import { loadLinksPreset } from "@tsparticles/preset-links";
import { loadSnowPreset } from "@tsparticles/preset-snow";
import { loadFireflyPreset } from "@tsparticles/preset-firefly";
import { loadBubblesPreset } from "@tsparticles/preset-bubbles";
import { loadFountainPreset } from "@tsparticles/preset-fountain";
import { loadHyperspacePreset } from "@tsparticles/preset-hyperspace";
import { loadFirePreset } from "@tsparticles/preset-fire";

import { blackHole, PLANET_IMAGES } from "./blackhole.js";
import { bgStars, BG_STAR_COLORS } from "./bg-stars.js";

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
export async function registerAllPresets() {
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

export async function loadPreset(preset) {
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

  // The hyperspace preset doesn't clear each frame via background.color —
  // its trail plugin repaints the canvas with trail.fill.color at low
  // opacity every tick, and that overlay colour (not background.color) is
  // what actually reads as the "background" once streaks are moving. Its
  // particles are also painted via particles.paint.fill.color, not the
  // legacy particles.color, so overriding the wrong keys (as before) had no
  // visible effect at all. Override both real keys to match the scheme.
  const theme = document.documentElement.getAttribute("data-theme") ?? "dark";
  const hyperspaceBg = theme === "light" ? "#FAF7F2" : "#170F26";
  const hyperspaceOverrides = preset === "hyperspace" ? {
    background: { color: hyperspaceBg },
    trail: { fill: { color: hyperspaceBg } },
    particles: {
      paint: { fill: { color: { value: BG_STAR_COLORS[theme] } } },
    },
  } : {};

  const container = await tsParticles.load({
    id: "tsparticles",
    options: {
      preset,
      background: { color: "transparent" },
      fullScreen: { enable: false },
      ...PRESET_OVERRIDES[preset],
      ...hyperspaceOverrides,
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
