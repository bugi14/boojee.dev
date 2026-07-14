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
// at the top. Undocking uses a separate, lower threshold (hysteresis)
// rather than the same value, so that if the dock/undock transition itself
// causes a momentary few-pixel change in scrollTop, that change can't land
// exactly back on the other side of a single shared threshold and flip
// straight back — which otherwise reads as the header (and the page)
// bouncing in place instead of settling.
const DOCK_SCROLL_THRESHOLD = 24;
const UNDOCK_SCROLL_THRESHOLD = 4;
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
  const sidebar = page.querySelector(".cv-sidebar");
  const skillsBody = page.querySelector('[data-section="skills"] .cv-section-body');
  const skillsToggle = page.querySelector('[data-section="skills"] .cv-toggle-mode');

  // Below this width, two fixed-positioned elements start to overlap
  // .cv-main's content instead of sitting beside/above the header: the
  // contact badges (Toptal card + icons — #contact-badges, see badges.css)
  // and the nav-pill layer (Experience/Education — .cv-nav-layer, see
  // updateNavLayerPosition() below). reparentSidebarOverlays() moves both
  // into .cv-sidebar instead — the nav layer above Skills, the badges below
  // it — so everything's in normal flow and nothing overlaps.
  const SIDEBAR_OVERLAY_QUERY = window.matchMedia("(max-width: 900px)");
  // Below this width the header is reparented into the sidebar so the full
  // left column (header + nav pills + skills + badge) stays visible while
  // the user scrolls the right-column content.
  const MOBILE_FIXED_SIDEBAR_QUERY = window.matchMedia("(max-width: 520px)");
  const badgesHomeParent = document.getElementById("contact-badges")?.parentElement || null;
  const navLayerHomeParent = navLayer.parentElement;
  const navLayerHomeNextSibling = navLayer.nextSibling;
  const headerHomeParent = header.parentElement;
  const headerHomeNextSibling = header.nextSibling;

  function reparentHeader() {
    // When the viewport grows above the mobile threshold, restore the header
    // to its home above the grid immediately — scroll events manage the
    // transition in the opposite direction via handleScroll().
    if (!MOBILE_FIXED_SIDEBAR_QUERY.matches && header.classList.contains("cv-header--in-sidebar")) {
      header.classList.remove("cv-header--in-sidebar");
      headerHomeParent.insertBefore(header, headerHomeNextSibling);
      headerSpacer.style.height = "0px";
    }
    // Re-evaluate the scroll-driven sidebar state for the new viewport width.
    if (scrollContainer) handleScroll();
  }

  function reparentSidebarOverlays() {
    const badges = document.getElementById("contact-badges");
    if (SIDEBAR_OVERLAY_QUERY.matches) {
      navLayer.classList.add("cv-nav-layer--inline");
      // Clear whatever fixed-position inline styles updateNavLayerPosition()
      // left behind (width/right/top) — .cv-nav-layer--inline's static,
      // full-width row layout has to win, not a handful of stale pixel
      // values sized for the old fixed placement.
      navLayer.style.removeProperty("width");
      navLayer.style.removeProperty("right");
      navLayer.style.removeProperty("top");
      // If the header is already in the sidebar (MOBILE_FIXED_SIDEBAR_QUERY),
      // insert the nav layer after it so the order stays
      // [header | nav | skills | badges].
      const navInsertPoint = header.classList.contains("cv-header--in-sidebar")
        ? header.nextSibling
        : sidebar.firstChild;
      sidebar.insertBefore(navLayer, navInsertPoint);
      if (badges) {
        badges.classList.add("contact-badges--inline");
        sidebar.appendChild(badges);
      }
    } else {
      navLayer.classList.remove("cv-nav-layer--inline");
      navLayerHomeParent.insertBefore(navLayer, navLayerHomeNextSibling);
      if (badges) {
        badges.classList.remove("contact-badges--inline");
        badgesHomeParent?.appendChild(badges);
      }
    }
  }

  // Which sections are currently expanded inline (vs. floating pills), which
  // variant (short/detailed) each section is showing (including the pinned
  // Skills column), which entries/blocks are currently highlighted (see
  // TRIGGERS in cv-data.js and applyHighlights() below) when a trigger
  // phrase in About has been clicked, and which highlighted entries the
  // user has expanded past their default windowed view back to their full
  // content (see renderWindow()/"Show all" below).
  const state = {
    open: new Set(["about"]),
    mode: { about: "short", skills: "short", experience: "short", education: "short" },
    highlight: null, // { entries: string[], blocks: { entryId: string[] } }
    expandedEntries: new Set(),
  };

  function findEntry(entryId) {
    return EXPERIENCE.entries.find((entry) => entry.id === entryId) || EDUCATION.entries.find((entry) => entry.id === entryId);
  }

  function entrySection(entryId) {
    return EXPERIENCE.entries.some((entry) => entry.id === entryId) ? "experience" : "education";
  }

  // A highlightBlocks entry is either a flat array of block keys (same
  // wording/markers in both Read-more states) or `{ short, detailed }`
  // when the two states need different keys — resolved against whichever
  // state that entry's own section is actually showing, unless `mode` is
  // given explicitly (the hover preview always previews one fixed mode
  // per trigger — see TRIGGERS' `previewMode` in cv-data.js — regardless
  // of what the real section is currently showing).
  function resolveBlockKeys(entryId, blocksSpec, mode) {
    if (Array.isArray(blocksSpec)) return blocksSpec;
    const resolvedMode = mode || state.mode[entrySection(entryId)];
    return blocksSpec[resolvedMode] || blocksSpec.short || [];
  }

  // Prunes an entry's rendered HTML down to just its highlighted block(s)
  // plus one immediate sibling before/after at every nesting level between
  // the highlight and the content root — e.g. for a bullet inside a <ul>
  // inside a <div> block among the entry's other top-level paragraphs/
  // blocks, both the <ul>'s sibling bullets *and* the <div>'s sibling
  // blocks get this treatment. Those two neighbors get a directional fade
  // (cv-block--fade-before/-after in cv.css clamp them to ~2 lines and
  // mask them toward transparent on the far side) — just enough to read
  // as "there's more text here" without it actually being readable or
  // scrollable into view, since — unlike the "Show all" toggle — that
  // context isn't the point. Recurses only into the ancestor chain
  // actually containing a highlight; unrelated subtrees are dropped
  // outright rather than faded, since "Other Client Work" three sections
  // away isn't really "surrounding" content the way the bullet right next
  // to the highlight is.
  function pruneToWindow(el) {
    const children = [...el.children];
    if (!children.length) return;
    const relevant = children.map((child) => child.classList.contains("cv-block--highlight") || !!child.querySelector(".cv-block--highlight"));
    if (!relevant.some(Boolean)) return;
    const relevantIndexes = relevant.map((isRelevant, i) => (isRelevant ? i : -1)).filter((i) => i !== -1);
    const minIndex = Math.min(...relevantIndexes);
    const maxIndex = Math.max(...relevantIndexes);
    children.forEach((child, i) => {
      if (i >= minIndex && i <= maxIndex) {
        if (!child.classList.contains("cv-block--highlight")) pruneToWindow(child);
        return;
      }
      const distance = i < minIndex ? minIndex - i : i - maxIndex;
      if (distance === 1) child.classList.add(i < minIndex ? "cv-block--fade-before" : "cv-block--fade-after");
      else child.remove();
    });
  }

  // Renders `html` with only `blockKeys` (and their immediate context)
  // kept — used for both the main content's default "windowed" view of a
  // block-highlighted entry and the hover preview popup, so the two always
  // agree on what "just the relevant part" means.
  function renderWindow(html, blockKeys) {
    const scratch = document.createElement("div");
    scratch.innerHTML = html;
    const targets = blockKeys.flatMap((key) => [...scratch.querySelectorAll(`[data-block="${key}"]`)]);
    if (!targets.length) return html;
    targets.forEach((el) => el.classList.add("cv-block--highlight"));
    pruneToWindow(scratch);
    return scratch.innerHTML;
  }

  function renderSectionBody(id) {
    const mode = state.mode[id];
    if (id === "about") return ABOUT[mode];

    const data = id === "experience" ? EXPERIENCE : EDUCATION;
    const entries = data.entries;
    // Entries this section's active highlight (if any) actually targets,
    // whole or partial — everything else in the section fades away the
    // same way a non-highlighted bullet does within an entry (see
    // pruneToWindow()), just without the "distance > 1 gets removed"
    // rule: with only two or three entries per section there's no
    // unrelated middle distance to drop, so every non-targeted entry
    // fades rather than only the nearest one.
    const targetedIndexes = state.highlight
      ? entries.map((entry, i) => (state.highlight.entries.includes(entry.id) || entry.id in state.highlight.blocks ? i : -1)).filter((i) => i !== -1)
      : [];
    const minTargeted = targetedIndexes.length ? Math.min(...targetedIndexes) : -1;

    return entries
      .map((entry, i) => {
        const highlighted = state.highlight?.entries.includes(entry.id);
        const blocksSpec = state.highlight?.blocks?.[entry.id];
        const isTargeted = highlighted || !!blocksSpec;

        if (state.highlight && !isTargeted) {
          return `
            <article class="cv-entry ${i < minTargeted ? "cv-block--fade-before" : "cv-block--fade-after"}" data-entry-id="${entry.id}">
              <div class="cv-entry-head">
                <h3>${entry.title}</h3>
                <span class="cv-dates">${entry.dates}</span>
              </div>
              ${entry.sub ? `<p class="cv-entry-sub">${entry.sub}</p>` : ""}
              ${entry[mode]}
            </article>
          `;
        }

        const blockKeys = blocksSpec ? resolveBlockKeys(entry.id, blocksSpec) : null;
        const windowed = !!blockKeys?.length && !state.expandedEntries.has(entry.id);
        const body = windowed ? renderWindow(entry[mode], blockKeys) : entry[mode];
        const windowToggle = blockKeys?.length
          ? `<button type="button" class="cv-window-toggle" data-action="toggle-window" data-entry-id="${entry.id}">
              ${windowed ? "Show all" : "Show less"}
            </button>`
          : "";
        return `
          <article class="cv-entry${highlighted ? " cv-entry--highlight" : ""}" data-entry-id="${entry.id}">
            <div class="cv-entry-head">
              <h3>${entry.title}</h3>
              <span class="cv-dates">${entry.dates}</span>
            </div>
            ${entry.sub ? `<p class="cv-entry-sub">${entry.sub}</p>` : ""}
            ${body}
            ${windowToggle}
          </article>
        `;
      })
      .join("");
  }

  // Whole-entry highlights are just a CSS class baked into renderSectionBody
  // above; block-level highlights on an *expanded* (non-windowed) entry
  // can't be — the windowed path already bakes the highlight class in via
  // renderWindow() — so this walks the already-rendered DOM to find the
  // `data-block` markers baked into cv-data.js's HTML for that case.
  function applyBlockHighlights() {
    if (!state.highlight?.blocks) return;
    for (const [entryId, blocksSpec] of Object.entries(state.highlight.blocks)) {
      if (!state.expandedEntries.has(entryId)) continue; // already highlighted by renderWindow()
      const entryEl = content.querySelector(`[data-entry-id="${entryId}"]`);
      if (!entryEl) continue;
      for (const key of resolveBlockKeys(entryId, blocksSpec)) {
        entryEl.querySelectorAll(`[data-block="${key}"]`).forEach((el) => el.classList.add("cv-block--highlight"));
      }
    }
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

    const sections = SECTION_ORDER.filter((id) => state.open.has(id))
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

    // The Back button is a shortcut back to About specifically for
    // trigger-driven opens — normal pill navigation already has an
    // equivalent (the About pill itself), so it only shows up alongside
    // an active highlight.
    const backButton = state.highlight
      ? `<button type="button" class="cv-back" data-action="back-to-about">← Back to About</button>`
      : "";
    content.innerHTML = backButton + sections;

    applyBlockHighlights();
  }

  function openOnly(ids) {
    state.open = new Set(ids);
    state.highlight = null;
    state.expandedEntries.clear();
    render();
  }

  function handleNavSelect(id) {
    openOnly([id]);
  }

  // Shared by clicking a trigger phrase in About and clicking its hover
  // preview popup: opens the relevant section(s) in full and highlights
  // the relevant entries/blocks, then scrolls so the first highlighted
  // thing is actually in view (a trigger can open a section long enough
  // that its highlighted target starts off-screen — e.g. "research
  // papers" highlights bullets well down the Experience section).
  function activateTrigger(triggerId) {
    const trigger = TRIGGERS[triggerId];
    if (!trigger) return;
    state.open = new Set(trigger.sections);
    state.highlight = { entries: trigger.highlightEntries || [], blocks: trigger.highlightBlocks || {} };
    state.expandedEntries.clear();
    // Matches whatever Read-more state the hover preview showed for this
    // trigger (see `previewMode` in cv-data.js) — so what you saw in the
    // popup is exactly what you land on, rather than whatever the section
    // happened to be showing before.
    const mode = trigger.previewMode || "short";
    for (const section of trigger.sections) state.mode[section] = mode;
    render();
    hidePreview();
    const target = content.querySelector(".cv-block--highlight, .cv-entry--highlight");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleClick(e) {
    const backEl = e.target.closest('[data-action="back-to-about"]');
    if (backEl) {
      openOnly(["about"]);
      return;
    }

    const collapseEl = e.target.closest('[data-action="collapse"]');
    if (collapseEl) {
      state.open.delete(collapseEl.dataset.section);
      state.highlight = null;
      state.expandedEntries.clear();
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

    const windowToggleEl = e.target.closest('[data-action="toggle-window"]');
    if (windowToggleEl) {
      const id = windowToggleEl.dataset.entryId;
      if (state.expandedEntries.has(id)) state.expandedEntries.delete(id);
      else state.expandedEntries.add(id);
      render();
      return;
    }

    const triggerEl = e.target.closest(".cv-trigger");
    if (triggerEl) {
      activateTrigger(triggerEl.dataset.trigger);
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

  // ── Hover preview popup ──────────────────────────────────────────────
  // Hovering a trigger (without clicking it) shows a small floating popup
  // with one mini-card per highlighted entry (not just the first one —
  // e.g. "8+ years of Python experience" highlights four entries, and the
  // popup should reflect all four), each windowed down to just its
  // relevant bullet(s) the same way the main content is (see renderWindow()
  // above). Clicking it jumps straight to activateTrigger()'s full-section
  // view. It stays open while the pointer is over either the trigger or
  // the popup itself (there's a gap between them the mouse has to cross),
  // and only actually closes a beat after leaving both — see
  // scheduleHidePreview()/cancelHidePreview().
  const preview = document.createElement("div");
  preview.className = "cv-preview";
  preview.hidden = true;
  preview.tabIndex = -1;
  preview.innerHTML = `
    <div class="cv-preview-scroll"><div class="cv-preview-entries"></div></div>
    <p class="cv-preview-hint">View full section →</p>
  `;
  page.appendChild(preview);
  const previewScroll = preview.querySelector(".cv-preview-scroll");
  const previewEntries = preview.querySelector(".cv-preview-entries");

  let activePreviewTriggerId = null;
  let hidePreviewTimer = null;

  // Every entry a trigger highlights, whole-entry or block-level, in CV
  // display order (Experience entries, then Education) — the popup shows
  // one mini-card per entry here, in the same order they'd appear in the
  // real sections once opened.
  function collectHighlightedEntryIds(trigger) {
    const ids = new Set([...(trigger.highlightEntries || []), ...Object.keys(trigger.highlightBlocks || {})]);
    return [...EXPERIENCE.entries, ...EDUCATION.entries].map((entry) => entry.id).filter((id) => ids.has(id));
  }

  function cancelHidePreview() {
    clearTimeout(hidePreviewTimer);
  }

  function hidePreview() {
    cancelHidePreview();
    preview.hidden = true;
    activePreviewTriggerId = null;
  }

  // Small delay rather than hiding immediately on mouseout: the popup can
  // sit far enough from its trigger (positioned to whichever side has
  // room) that moving the pointer toward it in a straight line briefly
  // crosses "neither" element.
  function scheduleHidePreview() {
    cancelHidePreview();
    hidePreviewTimer = setTimeout(hidePreview, 200);
  }

  function showPreview(triggerEl, triggerId) {
    const trigger = TRIGGERS[triggerId];
    if (!trigger) return;
    const entryIds = collectHighlightedEntryIds(trigger);
    if (!entryIds.length) return;
    cancelHidePreview();
    activePreviewTriggerId = triggerId;

    previewEntries.innerHTML = entryIds
      .map((entryId) => {
        const entry = findEntry(entryId);
        if (!entry) return "";
        const mode = trigger.previewMode || "short";
        const blocksSpec = trigger.highlightBlocks?.[entryId];
        const blockKeys = blocksSpec ? resolveBlockKeys(entryId, blocksSpec, mode) : null;
        const windowed = !!blockKeys?.length;
        const body = windowed ? renderWindow(entry[mode], blockKeys) : entry[mode];
        // A block-level highlight already gets its own (stronger) treatment
        // via renderWindow(); a whole-entry highlight (no specific blocks —
        // e.g. Onna, or MSc/BSc from "research papers") otherwise rendered
        // completely plain here, so it needs the same cv-entry--highlight
        // class the main content gives it, for visual conformity between
        // the two highlight kinds.
        const highlightClass = !windowed && trigger.highlightEntries?.includes(entryId) ? " cv-entry--highlight" : "";
        return `
          <div class="cv-preview-entry${highlightClass}">
            <div class="cv-preview-head">
              <h3>${entry.title}</h3>
              <span class="cv-dates">${entry.dates}</span>
            </div>
            ${body}
          </div>
        `;
      })
      .join("");
    previewScroll.scrollTop = 0;

    preview.hidden = false;
    // To the right of the trigger by default; a trigger on the right half
    // of the page flips it to the left instead, since "to the right" there
    // tends to run straight into the fixed contact badges / Toptal badge.
    const rect = triggerEl.getBoundingClientRect();
    const previewWidth = preview.offsetWidth;
    const onRightHalf = rect.left > window.innerWidth / 2;
    const left = onRightHalf ? rect.left - 12 - previewWidth : rect.right + 12;
    preview.style.left = `${Math.min(Math.max(left, 8), window.innerWidth - previewWidth - 8)}px`;
    preview.style.top = `${Math.min(Math.max(rect.top, 8), window.innerHeight - preview.offsetHeight - 8)}px`;
  }

  page.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const triggerEl = e.target.closest(".cv-trigger");
    if (triggerEl) {
      showPreview(triggerEl, triggerEl.dataset.trigger);
      return;
    }
    if (preview.contains(e.target)) cancelHidePreview();
  });
  page.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const leavingTrigger = e.target.closest(".cv-trigger");
    const leavingPreview = preview.contains(e.target);
    if (!leavingTrigger && !leavingPreview) return;
    const to = e.relatedTarget;
    if (to && (to.closest?.(".cv-trigger") || preview.contains(to))) return;
    scheduleHidePreview();
  });
  preview.addEventListener("click", (e) => {
    if (e.target.closest("a")) return; // real links (e.g. the ClimateMapper href) still work as links
    if (activePreviewTriggerId) activateTrigger(activePreviewTriggerId);
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
    // Once reparentSidebarOverlays() has moved the nav layer into the
    // sidebar (see SIDEBAR_OVERLAY_QUERY above), .cv-nav-layer--inline puts
    // it in normal flow above Skills — leave its layout to that CSS rather
    // than fighting it with the fixed-position inline styles below.
    if (navLayer.classList.contains("cv-nav-layer--inline")) return;

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
    // Once inline (in the sidebar), the nav layer isn't stacked above the
    // fixed badges anymore, so it shouldn't factor into the docked header's
    // clearance.
    const navHeight = navLayer.classList.contains("cv-nav-layer--inline") ? 0 : navLayer.offsetHeight;
    // Once reparentSidebarOverlays() has moved the badges into the sidebar
    // (see SIDEBAR_OVERLAY_QUERY above), they're no longer fixed
    // bottom-right, so their rect can't be used to clear them — just clear
    // the viewport edge.
    const badgesTop = badges.classList.contains("contact-badges--inline") ? window.innerHeight : badges.getBoundingClientRect().top;
    const bottom = window.innerHeight - badgesTop + DOCK_GAP + navHeight + NAV_LAYER_GAP;
    header.style.setProperty("--cv-header-dock-bottom", `${bottom}px`);
    updateNavLayerPosition(); // now settle its top against the header's real (post-dock-offset) rect
  }

  function handleScroll() {
    // On narrow mobile, slide the header into the sidebar once the user has
    // scrolled past it — so the full left column (header + nav + skills +
    // badge) stays visible while the right column scrolls — and restore it
    // when scrolling back to the top. Same hysteresis thresholds as the
    // desktop docking to prevent bouncing at the threshold.
    if (MOBILE_FIXED_SIDEBAR_QUERY.matches) {
      const currentlyInSidebar = header.classList.contains("cv-header--in-sidebar");
      const shouldBeInSidebar = currentlyInSidebar
        ? scrollContainer.scrollTop > UNDOCK_SCROLL_THRESHOLD
        : scrollContainer.scrollTop > DOCK_SCROLL_THRESHOLD;

      if (shouldBeInSidebar && !currentlyInSidebar) {
        const style = getComputedStyle(header);
        undockedHeaderHeight = header.offsetHeight + (parseFloat(style.marginBottom) || 0);
        header.classList.add("cv-header--in-sidebar");
        headerSpacer.style.height = `${undockedHeaderHeight}px`;
        sidebar.insertBefore(header, sidebar.firstChild);
      } else if (!shouldBeInSidebar && currentlyInSidebar) {
        header.classList.remove("cv-header--in-sidebar");
        headerHomeParent.insertBefore(header, headerHomeNextSibling);
        headerSpacer.style.height = "0px";
      }
      return;
    }

    // Desktop / wider viewport: dock the header as a floating corner card
    // once scrolled, restore it to the top of the page when scrolling back.
    const currentlyDocked = header.classList.contains("cv-header--docked");
    const shouldDock = currentlyDocked
      ? scrollContainer.scrollTop > UNDOCK_SCROLL_THRESHOLD
      : scrollContainer.scrollTop > DOCK_SCROLL_THRESHOLD;

    // Capture the header's natural height (incl. margin) right before it
    // potentially goes fixed. Without a spacer reserving this same amount
    // of flow space, docking removes it from the page immediately —
    // shrinking scrollHeight out from under the user's current scrollTop,
    // which the browser then clamps down to fit. That clamp fires another
    // scroll event with a now-smaller scrollTop, which undocks the header
    // again, restoring the height and letting the user scroll back down
    // into the same wall — i.e. exactly the "can't scroll past this point"
    // bug this (and the hysteresis above) avoids.
    if (!currentlyDocked) {
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
      SIDEBAR_OVERLAY_QUERY.removeEventListener("change", reparentSidebarOverlays);
      MOBILE_FIXED_SIDEBAR_QUERY.removeEventListener("change", reparentHeader);
      header.classList.remove("cv-header--docked");
      headerSpacer.style.height = "0px";
      scrollContainer = null;
      // Restore the header, badges and nav layer to their normal homes so
      // they're not left stranded in the CV sidebar on other pages, or the
      // next time the CV page shows.
      header.classList.remove("cv-header--in-sidebar");
      headerHomeParent.insertBefore(header, headerHomeNextSibling);
      navLayer.classList.remove("cv-nav-layer--inline");
      navLayer.style.removeProperty("width");
      navLayer.style.removeProperty("right");
      navLayer.style.removeProperty("top");
      navLayerHomeParent.insertBefore(navLayer, navLayerHomeNextSibling);
      const badges = document.getElementById("contact-badges");
      badges?.classList.remove("contact-badges--inline");
      if (badges && badgesHomeParent) badgesHomeParent.appendChild(badges);
    } else {
      cvNav.attach(navLayer, handleNavSelect);
      cvBackground.attach();
      render();
      scrollContainer = document.getElementById("destination-view");
      reparentSidebarOverlays();
      handleScroll();
      updateDockPosition();
      scrollContainer.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDockPosition);
      SIDEBAR_OVERLAY_QUERY.addEventListener("change", reparentSidebarOverlays);
      MOBILE_FIXED_SIDEBAR_QUERY.addEventListener("change", reparentHeader);
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
