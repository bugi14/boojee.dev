import "./cv.css";
import { cvNav } from "../particles/cv-nav.js";
import { SUBTITLE, ABOUT, SKILLS, EXPERIENCE, EDUCATION, TRIGGERS } from "./cv-data.js";

// Order also doubles as render order for open sections.
const SECTION_ORDER = ["about", "skills", "experience", "education"];
const SECTION_LABELS = { about: "About", skills: "Skills", experience: "Experience", education: "Education" };

// Builds the CV page: header + About visible on landing, Skills/Experience/
// Education starting as floating nav pills (see cv-nav.js) that open inline
// when clicked. Content lives in cv-data.js as short (CV) / detailed
// (LinkedIn) variants per section, toggled by a "Read more/less" button.
export function createCvPage() {
  const page = document.createElement("div");
  page.id = "cv-page";
  page.hidden = true;
  page.innerHTML = `
    <header class="cv-header">
      <img class="cv-photo" src="/assets/images/darren.jpg" alt="Darren Buttigieg" width="96" height="96" />
      <div>
        <h1>Darren Buttigieg</h1>
        <p class="cv-title">${SUBTITLE}</p>
        <p class="cv-contact">
          <a href="mailto:dbuttigieg92@gmail.com">dbuttigieg92@gmail.com</a>
          <span>·</span>
          <a href="https://www.linkedin.com/in/darren-buttigieg" target="_blank" rel="noreferrer">LinkedIn</a>
          <span>·</span>
          <a href="https://github.com/bugi14" target="_blank" rel="noreferrer">GitHub</a>
        </p>
      </div>
    </header>
    <div class="cv-nav-layer"></div>
    <div class="cv-content"></div>
  `;

  const navLayer = page.querySelector(".cv-nav-layer");
  const content = page.querySelector(".cv-content");

  // Which sections are currently expanded inline (vs. floating pills), which
  // variant (short/detailed) each expanded section is showing, and which
  // trigger (if any) is currently driving a highlight.
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
    if (id === "skills") return SKILLS[mode];

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
    }

    content.innerHTML = SECTION_ORDER.filter((id) => state.open.has(id))
      .map((id) => {
        const mode = state.mode[id];
        return `
          <section class="cv-section cv-section--open" data-section="${id}">
            <div class="cv-section-head">
              <h2 data-action="collapse" data-section="${id}" tabindex="0" role="button"
                  aria-label="Collapse ${SECTION_LABELS[id]}">${SECTION_LABELS[id]}</h2>
              <button type="button" class="cv-toggle-mode" data-action="toggle-mode" data-section="${id}">
                ${mode === "short" ? "Read more" : "Read less"}
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

  content.addEventListener("click", (e) => {
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
  });

  content.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const collapseEl = e.target.closest('[data-action="collapse"]');
    if (collapseEl) {
      e.preventDefault();
      collapseEl.click();
    }
  });

  // The page starts `hidden`; the router (main.js) flips that attribute
  // without any other lifecycle hook, so this observer is what starts/stops
  // the floating-pill animation loop as the CV page becomes visible/hidden.
  const visibilityObserver = new MutationObserver(() => {
    if (page.hidden) {
      cvNav.detach();
    } else {
      cvNav.attach(navLayer, handleNavSelect);
      render();
    }
  });
  visibilityObserver.observe(page, { attributes: true, attributeFilter: ["hidden"] });

  render();
  return page;
}
