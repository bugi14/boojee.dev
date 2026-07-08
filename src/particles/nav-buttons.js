// ClimateMapper is a separate, already-deployed application (its own
// codebase/backend/deploy pipeline) rather than content that lives in this
// SPA, so it gets `href` (a real navigation to its own subdomain) instead of
// `hash` (an in-app destination rendered by this app, like the CV).
export const NAV_ITEMS = [
  { label: "CV", hash: "cv" },
  { label: "ClimateMapper", href: "https://climatemapper.boojee.dev" },
  { label: "Other Projects", hash: "other-projects" },
  { label: "About", hash: "about" },
];

// Floating nav buttons: plain DOM elements (not tsParticles particles) drifting
// around the nav layer under their own slow RAF loop, in the same spirit as
// the blackHole gravity loop. DOM gives free :hover/:focus styling, native
// click handling and accessibility, which canvas-drawn particles don't.
const FLOAT_SPEED = 0.15; // CSS px per frame
// Nav items are confined to an ellipse centred on the viewport, its semi-axes
// reaching 85% of the way to the edge on both axes — keeps them clear of the
// very edges of the frame without a hard rectangular margin.
const NAV_ELLIPSE_FRACTION = 0.85;

function getNavEllipse() {
  return {
    cx: window.innerWidth / 2,
    cy: window.innerHeight / 2,
    rx: (window.innerWidth / 2) * NAV_ELLIPSE_FRACTION,
    ry: (window.innerHeight / 2) * NAV_ELLIPSE_FRACTION,
  };
}

export const navButtons = {
  layer: null,
  particles: null,
  rafId: null,

  attach(layerEl, onNavigate) {
    this.detach();
    this.layer = layerEl;

    // Seed positions at equidistant points inside the ellipse: split it into
    // one angular sector per nav item and place each item at the middle of
    // its own sector, at a fixed radius fraction — so on load they start
    // evenly spread around the centre rather than randomly clustered.
    const ellipse = getNavEllipse();
    const sectorAngle = (Math.PI * 2) / NAV_ITEMS.length;
    const SPAWN_RADIUS_FRACTION = 0.55;

    this.particles = NAV_ITEMS.map((item, index) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "nav-particle";
      el.textContent = item.label;
      el.addEventListener("click", () => onNavigate(item));
      layerEl.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      const sectorMidAngle = sectorAngle * index + sectorAngle / 2;
      const ex = Math.max(ellipse.rx - width / 2, 1);
      const ey = Math.max(ellipse.ry - height / 2, 1);
      const cx = ellipse.cx + Math.cos(sectorMidAngle) * ex * SPAWN_RADIUS_FRACTION;
      const cy = ellipse.cy + Math.sin(sectorMidAngle) * ey * SPAWN_RADIUS_FRACTION;

      return {
        el,
        width,
        height,
        x: cx - width / 2,
        y: cy - height / 2,
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
    const ellipse = getNavEllipse();

    // Collect exclusion zones once per frame — nav items bounce off these just
    // as they bounce off the ellipse boundary, so they never overlap the
    // heading, the contact-badges cluster (which contains both the Toptal
    // badge and the icon row above it, so one zone covers both), the theme
    // toggle, or the logo. getBoundingClientRect is cheap for fixed-position
    // elements (no layout reflow triggered).
    const ZONE_PAD = 20;
    const zones = [];
    const headingEl = document.getElementById("home-heading");
    if (headingEl && !headingEl.hidden) zones.push(headingEl.getBoundingClientRect());
    const badgesEl = document.getElementById("contact-badges");
    if (badgesEl && !badgesEl.hidden) zones.push(badgesEl.getBoundingClientRect());
    const toggleEl = document.getElementById("theme-toggle");
    if (toggleEl && !toggleEl.hidden) zones.push(toggleEl.getBoundingClientRect());
    const logoEl = document.getElementById("site-logo");
    if (logoEl && !logoEl.hidden) zones.push(logoEl.getBoundingClientRect());

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Ellipse boundary bounce: the particle's own half-size insets the
      // ellipse radii so the full box (not just its centre) stays inside.
      // The centre's position is tested against that inset ellipse via its
      // implicit equation (nx² + ny² <= 1); once outside, the centre is
      // snapped back to the boundary and the velocity is reflected across
      // the ellipse's normal at that point (gradient of the implicit
      // function), which for an ellipse is proportional to (nx/ex, ny/ey).
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const ex = Math.max(ellipse.rx - p.width / 2, 1);
      const ey = Math.max(ellipse.ry - p.height / 2, 1);
      const dx = cx - ellipse.cx;
      const dy = cy - ellipse.cy;
      let nx = dx / ex;
      let ny = dy / ey;
      const dist = Math.hypot(nx, ny);
      if (dist > 1) {
        nx /= dist;
        ny /= dist;
        const newCx = ellipse.cx + nx * ex;
        const newCy = ellipse.cy + ny * ey;
        p.x = newCx - p.width / 2;
        p.y = newCy - p.height / 2;

        let normalX = nx / ex;
        let normalY = ny / ey;
        const normalLen = Math.hypot(normalX, normalY) || 1;
        normalX /= normalLen;
        normalY /= normalLen;
        const dot = p.vx * normalX + p.vy * normalY;
        p.vx -= 2 * dot * normalX;
        p.vy -= 2 * dot * normalY;
      }

      // Exclusion zone AABB resolution: snap to the nearest exit edge and
      // reverse the velocity component that pushed the particle in.
      for (const zone of zones) {
        const zx1 = zone.left - ZONE_PAD, zy1 = zone.top - ZONE_PAD;
        const zx2 = zone.right + ZONE_PAD, zy2 = zone.bottom + ZONE_PAD;
        const px2 = p.x + p.width, py2 = p.y + p.height;
        if (px2 <= zx1 || p.x >= zx2 || py2 <= zy1 || p.y >= zy2) continue;

        const dLeft   = px2 - zx1;
        const dRight  = zx2 - p.x;
        const dTop    = py2 - zy1;
        const dBottom = zy2 - p.y;
        const min = Math.min(dLeft, dRight, dTop, dBottom);
        if      (min === dLeft)   { p.x = zx1 - p.width; p.vx = -Math.abs(p.vx); }
        else if (min === dRight)  { p.x = zx2;            p.vx =  Math.abs(p.vx); }
        else if (min === dTop)    { p.y = zy1 - p.height; p.vy = -Math.abs(p.vy); }
        else                      { p.y = zy2;             p.vy =  Math.abs(p.vy); }
      }
    }

    // Pairwise collision between nav items themselves, so their floating
    // labels never overlap one another. Rectangle-overlap test (same style
    // as the exclusion-zone resolution above), but symmetric: both particles
    // are pushed apart along the axis of least penetration, and each has its
    // velocity component along that axis set (not swapped) to point away
    // from the other — swapping velocities instead can leave both moving in
    // the same net direction after a graze, which with only 4 items causes
    // visible re-collisions; forcing "away" every time guarantees they
    // separate. O(n²) but n is the nav item count (a handful), negligible.
    // A few iterations per frame let chain overlaps (resolving one pair can
    // reintroduce overlap with a third item) settle before the frame renders.
    const COLLISION_ITERATIONS = 8;
    // Small extra clearance on top of the exact overlap so items separate
    // to a visible gap instead of ending up exactly touching (which, at
    // these slow drift speeds, tends to immediately re-trigger next frame).
    const COLLISION_BUFFER = 2;
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
            if (minOverlap === overlapLeft) {
              a.x -= push; b.x += push;
              a.vx = -Math.abs(a.vx); b.vx = Math.abs(b.vx);
            } else {
              a.x += push; b.x -= push;
              a.vx = Math.abs(a.vx); b.vx = -Math.abs(b.vx);
            }
          } else {
            if (minOverlap === overlapTop) {
              a.y -= push; b.y += push;
              a.vy = -Math.abs(a.vy); b.vy = Math.abs(b.vy);
            } else {
              a.y += push; b.y -= push;
              a.vy = Math.abs(a.vy); b.vy = -Math.abs(b.vy);
            }
          }
        }
      }
    }

    for (const p of this.particles) {
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  },
};
