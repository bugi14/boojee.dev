import { tsParticles } from "@tsparticles/engine";

// Small twinkling star dots layered behind the SVG particles — a separate
// container so we can give them completely different size/color/shape settings
// without fighting the SVG layer's image shape config. Colors adapt to the
// active colour scheme: light colours on dark bg, dark colours on light bg.
export const BG_STAR_COLORS = {
  dark:  ["#E8E3F0", "#D6549C", "#6C4AB6", "#F2A65A", "#F7E9C6"],
  light: ["#1C2541", "#A8D8EA", "#F6B8C4", "#FDE9A0", "#2D2D34"],
};

let bgToken = 0;
export const bgStars = {
  container: null,

  async load() {
    const token = ++bgToken;
    this.container?.destroy();
    const old = document.getElementById("tsparticles-bg");
    const fresh = document.createElement("div");
    fresh.id = "tsparticles-bg";
    old.replaceWith(fresh);

    const theme = document.documentElement.getAttribute("data-theme") ?? "dark";
    const starColors = BG_STAR_COLORS[theme] ?? BG_STAR_COLORS.dark;

    const container = await tsParticles.load({
      id: "tsparticles-bg",
      options: {
        background: { color: "transparent" },
        fullScreen: { enable: false },
        particles: {
          number: { value: 160 },
          // This engine version has no back-compat for the legacy root
          // particles.color key (ParticlesOptions.load() only reads
          // data.paint) — it silently falls back to white if used. The real
          // key is particles.paint.fill.color.
          paint: { fill: { color: { value: starColors } } },
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
