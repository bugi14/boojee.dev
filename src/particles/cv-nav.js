// Lightweight floating-pill nav for collapsed CV sections. Visually consistent
// with the home page's floating nav (`nav-buttons.js` / `.nav-particle`), but
// deliberately simpler: it lives inside a small fixed-size layer under the CV
// header (not the full viewport), only ever has a handful of items, and those
// items change at runtime as sections open/close — so it exposes `setItems()`
// rather than a one-shot `attach()`.

const FLOAT_SPEED = 0.1;
const COLLISION_ITERATIONS = 6;
const COLLISION_BUFFER = 2;

export const cvNav = {
  layer: null,
  particles: [],
  rafId: null,
  onSelect: null,

  attach(layerEl, onSelect) {
    this.detach();
    this.layer = layerEl;
    this.onSelect = onSelect;
    const tick = () => {
      this.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  detach() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    for (const p of this.particles) p.el.remove();
    this.particles = [];
    this.layer = null;
    this.onSelect = null;
  },

  // items: [{ id, label }]. Pills for ids no longer present are removed;
  // pills for new ids are seeded at a random position inside the layer;
  // existing pills keep their current position/velocity untouched.
  setItems(items) {
    if (!this.layer) return;
    const ids = new Set(items.map((i) => i.id));
    this.particles = this.particles.filter((p) => {
      if (ids.has(p.id)) return true;
      p.el.remove();
      return false;
    });

    const existingIds = new Set(this.particles.map((p) => p.id));
    const rect = this.layer.getBoundingClientRect();
    for (const item of items) {
      if (existingIds.has(item.id)) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "cv-nav-particle";
      el.textContent = item.label;
      el.addEventListener("click", () => this.onSelect?.(item.id));
      this.layer.appendChild(el);

      const width = el.offsetWidth || 80;
      const height = el.offsetHeight || 32;
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        id: item.id,
        el,
        width,
        height,
        x: Math.random() * Math.max(rect.width - width, 1),
        y: Math.random() * Math.max(rect.height - height, 1),
        vx: Math.cos(angle) * FLOAT_SPEED,
        vy: Math.sin(angle) * FLOAT_SPEED,
      });
    }
  },

  update() {
    if (!this.layer || this.particles.length === 0) return;
    const rect = this.layer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      if (p.x + p.width > width) { p.x = Math.max(width - p.width, 0); p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
      if (p.y + p.height > height) { p.y = Math.max(height - p.height, 0); p.vy = -Math.abs(p.vy); }
    }

    for (let iter = 0; iter < COLLISION_ITERATIONS; iter++) {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const a = this.particles[i];
          const b = this.particles[j];
          const ax2 = a.x + a.width, ay2 = a.y + a.height;
          const bx2 = b.x + b.width, by2 = b.y + b.height;
          if (ax2 <= b.x || a.x >= bx2 || ay2 <= b.y || a.y >= by2) continue;

          const overlapLeft = ax2 - b.x;
          const overlapRight = bx2 - a.x;
          const overlapTop = ay2 - b.y;
          const overlapBottom = by2 - a.y;
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          const push = minOverlap / 2 + COLLISION_BUFFER;

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            if (minOverlap === overlapLeft) { a.x -= push; b.x += push; a.vx = -Math.abs(a.vx); b.vx = Math.abs(b.vx); }
            else { a.x += push; b.x -= push; a.vx = Math.abs(a.vx); b.vx = -Math.abs(b.vx); }
          } else if (minOverlap === overlapTop) { a.y -= push; b.y += push; a.vy = -Math.abs(a.vy); b.vy = Math.abs(b.vy); }
          else { a.y += push; b.y -= push; a.vy = Math.abs(a.vy); b.vy = -Math.abs(b.vy); }
        }
      }
    }

    for (const p of this.particles) {
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  },
};
