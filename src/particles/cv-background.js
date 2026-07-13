// Decorative interactive background for the CV page, using the same "links"
// tsParticles preset already registered by presets.js at startup (see
// registerAllPresets() in main.js). Uses tsParticles' own `fullScreen` mode
// so it manages its own fixed-position, window-sized canvas rather than us
// hand-rolling a container element for it.
import { tsParticles } from "@tsparticles/engine";

const CONTAINER_ID = "cv-tsparticles";

let container = null;

function themeColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
}

export const cvBackground = {
  async attach() {
    this.detach();
    const color = themeColor();
    container = await tsParticles.load({
      id: CONTAINER_ID,
      options: {
        preset: "links",
        fullScreen: { enable: true, zIndex: 0 },
        background: { color: "transparent" },
        interactivity: {
          detectsOn: "window",
          events: {
            onHover: { enable: true, mode: "grab" },
          },
          modes: {
            grab: { distance: 220, links: { opacity: 0.7 } },
          },
        },
        particles: {
          color: { value: color },
          links: { color },
        },
      },
    });
  },

  detach() {
    container?.destroy();
    container = null;
  },
};
