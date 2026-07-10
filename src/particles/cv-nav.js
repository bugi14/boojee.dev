// Nav pills for collapsed CV sections. Visually consistent with the home
// page's floating nav (`nav-buttons.js` / `.nav-particle`), but laid out
// as a plain static stack (see .cv-nav-layer in cv.css) rather than
// drifting/bouncing — the layer itself moves (it's fixed-positioned and
// repositioned by cv.js as the header docks/undocks), so animating the
// pills within it too just made them harder to click mid-transition.
export const cvNav = {
  layer: null,
  onSelect: null,

  attach(layerEl, onSelect) {
    this.detach();
    this.layer = layerEl;
    this.onSelect = onSelect;
  },

  detach() {
    if (this.layer) this.layer.innerHTML = "";
    this.layer = null;
    this.onSelect = null;
  },

  // items: [{ id, label }]. Re-renders the full pill list — cheap enough
  // given there are at most a handful of items, and simpler than diffing
  // now that pills don't carry any animated state to preserve.
  setItems(items) {
    if (!this.layer) return;
    this.layer.innerHTML = "";
    for (const item of items) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "cv-nav-particle";
      el.textContent = item.label;
      el.addEventListener("click", () => this.onSelect?.(item.id));
      this.layer.appendChild(el);
    }
  },
};
