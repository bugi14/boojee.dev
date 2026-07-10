import "./cv.css";
import { cvNav } from "../particles/cv-nav.js";
import { cvBackground } from "../particles/cv-background.js";
import { SUBTITLE, ABOUT, SKILLS, EXPERIENCE, EDUCATION, TRIGGERS } from "./cv-data.js";

// Skills is pinned to its own sidebar column and never floats/collapses;
// these three are the ones that toggle between a floating pill and an open
// section, and also double as the render order for open sections.
const SECTION_ORDER = ["about", "experience", "education"];
const SECTION_LABELS = { about: "About", experience: "Experience", education: "Education" };
const CV_PDF_URL = "/assets/documents/darren-buttigieg-cv.pdf";
// Once the user scrolls the CV past this point, the header docks into the
// bottom-right corner (see DOCK_GAP below) instead of sitting full-width
// at the top.
const DOCK_SCROLL_THRESHOLD = 24;
// Vertical clearance kept between the docked header and the contact badges
// (#contact-badges, fixed bottom-right — see badges.css) it sits above.
const DOCK_GAP = 16;
// Gap kept between the floating nav-pill layer and whatever it's anchored
// to (the header, undocked or docked).
const NAV_LAYER_GAP = 16;
const NAV_LAYER_WIDTH = 300;

// Builds the CV page: header + About visible on landing, Experience/Education
// starting as floating nav pills (see cv-nav.js) that open inline when
// clicked, and Skills pinned as a permanent left-hand column. Content lives
// in cv-data.js as short (CV) / detailed (LinkedIn) variants per section,
// toggled by a "More/Less" button. A "links" tsParticles background
// (cv-background.js) runs behind everything while the page is visible.
export function createCvPage() {
  const page = document.createElement("div");
  page.id = "cv-page";
  page.hidden = true;
  page.innerHTML = `
    <header class="cv-header">
      <img class="cv-photo" src="/assets/images/darren.jpg" alt="Darren Buttigieg" width="96" height="96" />
      <div class="cv-header-text">
        <h1>Darren Buttigieg</h1>
        <p class="cv-title">${SUBTITLE.split(" | ")
          .map((part) => `<span class="cv-title-part">${part}</span>`)
          .join('<span class="cv-title-sep"> | </span>')}</p>
        <a class="cv-pdf-link" href="${CV_PDF_URL}" target="_blank" rel="noreferrer">View printable version</a>
      </div>
    </header>
    <div class="cv-header-spacer"></div>
    <div class="cv-body">
      <aside class="cv-sidebar">
        <section class="cv-section cv-section--pinned" data-section="skills">
          <div class="cv-section-head">
            <h2>Skills</h2>
            <button type="button" class="cv-toggle-mode" data-action="toggle-mode" data-section="skills">
              More
            </button>
          </div>
          <div class="cv-section-body"></div>
        </section>
      </aside>
      <main class="cv-main">
        <div class="cv-nav-layer"></div>
        <div class="cv-content"></div>
      </main>
    </div>
  `;

  const header = page.querySelector(".cv-header");
  const headerText = page.querySelector(".cv-header-text");
  const headerSpacer = page.querySelector(".cv-header-spacer");
  const navLayer = page.querySelector(".cv-nav-layer");
  const content = page.querySelector(".cv-content");
  const skillsBody = page.querySelector('[data-section="skills"] .cv-section-body');
  const skillsToggle = page.querySelector('[data-section="skills"] .cv-toggle-mode');

  // Which sections are currently expanded inline (vs. floating pills), which
  // variant (short/detailed) each section is showing (including the pinned
  // Skills column), and which trigger (if any) is currently driving a
  // highlight.
  const state = {
    open: new Set(["about"]),
    mode: { about: "short", skills: "short", experience: "short", education: "short" },
    highlight: null, // { sections: string[], flag: string }
  };

  function entryHighlighted(sectionId, entry) {
    if (!state.highlight) return false;
    if (!state.highlight.sections.includes(sectionId)) return false;
    return entry.python && state.highlight.flag === "python";
  }

  function renderSectionBody(id) {
    const mode = state.mode[id];
    if (id === "about") return ABOUT[mode];

    const data = id === "experience" ? EXPERIENCE : EDUCATION;
    return data.entries
      .map((entry) => {
        const highlighted = entryHighlighted(id, entry);
        return `
          <article class="cv-entry${highlighted ? " cv-entry--highlight" : ""}">
            <div class="cv-entry-head">
              <h3>${entry.title}</h3>
              <span class="cv-dates">${entry.dates}</span>
            </div>
            ${entry.sub ? `<p class="cv-entry-sub">${entry.sub}</p>` : ""}
            ${entry[mode]}
          </article>
        `;
      })
      .join("");
  }

  function render() {
    const closed = SECTION_ORDER.filter((id) => !state.open.has(id));
    if (cvNav.layer) {
      cvNav.setItems(closed.map((id) => ({ id, label: SECTION_LABELS[id] })));
      // The pill count (hence the nav layer's height) just changed, and the
      // docked header's own position reserves room for exactly that height
      // — see updateDockPosition().
      updateDockPosition();
    }

    skillsBody.innerHTML = SKILLS[state.mode.skills];
    skillsToggle.textContent = state.mode.skills === "short" ? "More" : "Less";

    content.innerHTML = SECTION_ORDER.filter((id) => state.open.has(id))
      .map((id) => {
        const mode = state.mode[id];
        return `
          <section class="cv-section cv-section--open" data-section="${id}">
            <div class="cv-section-head">
              <h2 data-action="collapse" data-section="${id}" tabindex="0" role="button"
                  aria-label="Collapse ${SECTION_LABELS[id]}">${SECTION_LABELS[id]}</h2>
              <button type="button" class="cv-toggle-mode" data-action="toggle-mode" data-section="${id}">
                ${mode === "short" ? "More" : "Less"}
              </button>
            </div>
            <div class="cv-section-body">${renderSectionBody(id)}</div>
          </section>
        `;
      })
      .join("");
  }

  function openOnly(ids, highlight) {
    state.open = new Set(ids);
    state.highlight = highlight || null;
    render();
  }

  function handleNavSelect(id) {
    openOnly([id]);
  }

  function handleClick(e) {
    const collapseEl = e.target.closest('[data-action="collapse"]');
    if (collapseEl) {
      state.open.delete(collapseEl.dataset.section);
      state.highlight = null;
      if (state.open.size === 0) state.open.add("about");
      render();
      return;
    }

    const toggleEl = e.target.closest('[data-action="toggle-mode"]');
    if (toggleEl) {
      const id = toggleEl.dataset.section;
      state.mode[id] = state.mode[id] === "short" ? "detailed" : "short";
      render();
      return;
    }

    const triggerEl = e.target.closest(".cv-trigger");
    if (triggerEl) {
      const trigger = TRIGGERS[triggerEl.dataset.trigger];
      if (trigger) openOnly(trigger.sections, { sections: trigger.sections, flag: trigger.highlight });
    }
  }

  page.addEventListener("click", handleClick);
  page.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const collapseEl = e.target.closest('[data-action="collapse"]');
    if (collapseEl) {
      e.preventDefault();
      collapseEl.click();
    }
  });

  // #destination-view (not window) is what actually scrolls — it's a
  // fixed, inset:0, overflow-y:auto wrapper (see destination.css) — so the
  // dock/undock listener has to live there.
  let scrollContainer = null;
  // The header's own (undocked) rendered height, including its margin —
  // kept in sync with reality by remeasureUndockedHeaderHeight() below —
  // used to size .cv-header-spacer once the header goes position: fixed.
  let undockedHeaderHeight = 0;

  // The nav-pill layer is fixed positioned (see cv.css) and its height is
  // just whatever its (static, non-animated) pill stack naturally needs.
  // Undocked, it's nested inside the header's own border, in the empty
  // space to the right of the name/subtitle text; once the header docks
  // into the bottom-right corner on scroll, it moves to sit just below
  // the docked header, above the contact badges.
  function updateNavLayerPosition() {
    const headerRect = header.getBoundingClientRect();
    const docked = header.classList.contains("cv-header--docked");

    if (docked) {
      navLayer.style.right = "20px";
      navLayer.style.width = `${Math.min(NAV_LAYER_WIDTH, window.innerWidth * 0.8)}px`;
      navLayer.style.top = `${headerRect.bottom + NAV_LAYER_GAP}px`;
      return;
    }

    const headerStyle = getComputedStyle(header);
    const textRect = headerText.getBoundingClientRect();
    const paddingRight = parseFloat(headerStyle.paddingRight) || 0;
    const paddingTop = parseFloat(headerStyle.paddingTop) || 0;
    // Available width is whatever's left between the name/subtitle block
    // and the header's own right padding — so the pills never overlap it
    // and never spill past the header's own border.
    const availableWidth = headerRect.right - paddingRight - textRect.right - NAV_LAYER_GAP;
    navLayer.style.width = `${Math.max(Math.min(NAV_LAYER_WIDTH, availableWidth), 80)}px`;
    navLayer.style.right = `${window.innerWidth - headerRect.right + paddingRight}px`;
    navLayer.style.top = `${headerRect.top + paddingTop}px`;
  }

  // The docked header is position: fixed, so its bottom offset has to clear
  // both the contact badges (also fixed, bottom-right) and — above those —
  // the nav-pill layer's own (content-driven, so re-measured live rather
  // than assumed) height.
  function updateDockPosition() {
    const badges = document.getElementById("contact-badges");
    if (!badges) return;
    updateNavLayerPosition(); // width + a provisional top, so the pill stack is laid out for measuring
    const navHeight = navLayer.offsetHeight;
    const rect = badges.getBoundingClientRect();
    const bottom = window.innerHeight - rect.top + DOCK_GAP + navHeight + NAV_LAYER_GAP;
    header.style.setProperty("--cv-header-dock-bottom", `${bottom}px`);
    updateNavLayerPosition(); // now settle its top against the header's real (post-dock-offset) rect
  }

  function handleScroll() {
    const shouldDock = scrollContainer.scrollTop > DOCK_SCROLL_THRESHOLD;

    // Capture the header's natural height (incl. margin) right before it
    // potentially goes fixed. Without a spacer reserving this same amount
    // of flow space, docking removes it from the page immediately —
    // shrinking scrollHeight out from under the user's current scrollTop,
    // which the browser then clamps down to fit. That clamp fires another
    // scroll event with a now-smaller scrollTop, which undocks the header
    // again (since it's back under DOCK_SCROLL_THRESHOLD), restoring the
    // height and letting the user scroll back down into the same wall —
    // i.e. exactly the "can't scroll past this point" bug this avoids.
    if (!header.classList.contains("cv-header--docked")) {
      const style = getComputedStyle(header);
      undockedHeaderHeight = header.offsetHeight + (parseFloat(style.marginBottom) || 0);
    }

    header.classList.toggle("cv-header--docked", shouldDock);
    // Below the 700px breakpoint the docked-state CSS keeps the header in
    // normal flow (position: static — see cv.css) instead of floating it,
    // since there's no room for a corner card there; the spacer must stay
    // collapsed in that case too, or it'd reserve space for a fixed header
    // that was never actually removed from flow.
    const isFixed = getComputedStyle(header).position === "fixed";
    headerSpacer.style.height = isFixed ? `${undockedHeaderHeight}px` : "0px";
    updateNavLayerPosition();
  }

  // The page starts `hidden`; the router (main.js) flips that attribute
  // without any other lifecycle hook, so this observer is what starts/stops
  // the floating-pill animation loop and the particle background as the CV
  // page becomes visible/hidden.
  const visibilityObserver = new MutationObserver(() => {
    if (page.hidden) {
      cvNav.detach();
      cvBackground.detach();
      scrollContainer?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDockPosition);
      header.removeEventListener("transitionend", updateNavLayerPosition);
      header.classList.remove("cv-header--docked");
      headerSpacer.style.height = "0px";
      scrollContainer = null;
    } else {
      cvNav.attach(navLayer, handleNavSelect);
      cvBackground.attach();
      render();
      scrollContainer = document.getElementById("destination-view");
      handleScroll();
      updateDockPosition();
      scrollContainer.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDockPosition);
      // Docking/undocking animates the header's position over 0.2s (see
      // cv.css); the nav layer's own position depends on the header's
      // rect, so it needs one more measurement once that settles rather
      // than only the (mid-transition) one taken when the scroll fires.
      header.addEventListener("transitionend", updateNavLayerPosition);
    }
  });
  visibilityObserver.observe(page, { attributes: true, attributeFilter: ["hidden"] });

  render();
  return page;
}
