import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/destination.css";
import "./styles/placeholder.css";
import "./styles/badges.css";
import "./styles/theme-toggle.css";
import "./styles/logo.css";

import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadImageShape } from "@tsparticles/shape-image";

import { createCvPage } from "./pages/cv.js";
import { bgStars } from "./particles/bg-stars.js";
import { registerAllPresets, loadPreset } from "./particles/presets.js";
import { NAV_ITEMS, navButtons } from "./particles/nav-buttons.js";

// Hash-based routing: "#/cv" lands on the real destination view; other hash
// routes with no content yet (see IMPLEMENTED_HASHES) get the shared
// placeholder instead. No hash is the home view with the background effect
// and floating nav buttons.
const HOME_DEFAULT_PRESET = "stars";
const HYPERSPACE_TRAVEL_MS = 2200;
const DESTINATIONS = new Map(
  NAV_ITEMS.filter((item) => item.hash).map((item) => [item.hash, item.label]),
);
// Hash routes with real content. Everything else in DESTINATIONS renders the
// shared "still under formation" placeholder instead of a blank label.
const IMPLEMENTED_HASHES = new Set(["cv"]);

const homeView = document.getElementById("home-view");
const homeHeading = document.getElementById("home-heading");
const destinationView = document.getElementById("destination-view");
const destinationContent = document.getElementById("destination-content");
const destinationLabel = document.getElementById("destination-label");
const destinationBack = document.getElementById("destination-back");
const placeholderView = document.getElementById("placeholder-view");
const placeholderBack = document.getElementById("placeholder-back");
const navLayer = document.getElementById("nav-layer");
const contactBadges = document.getElementById("contact-badges");
const themeToggleEl = document.getElementById("theme-toggle");
const themeToggleBtn = themeToggleEl.querySelector(".toggle-track");
const siteLogo = document.getElementById("site-logo");
const cvPage = createCvPage();
destinationContent.appendChild(cvPage);

let traveling = false;

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  // Always reload background stars — bgToken cancels any stale in-flight load,
  // so it's safe even if a load is already in progress (fixes the race where
  // the user toggles before the initial bgStars.load() from loadPreset completes,
  // leaving white stars visible on the light background).
  bgStars.load();
}

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "light" ? "dark" : "light");
});

// Follow OS changes when the user hasn't set a manual preference.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    if (bgStars.container) bgStars.load();
  }
});

function showHome() {
  homeView.hidden = false;
  homeHeading.hidden = false;
  placeholderView.hidden = true;
  destinationView.hidden = true;
  contactBadges.hidden = false;
  themeToggleEl.hidden = false;
  siteLogo.hidden = false;
  navButtons.attach(navLayer, travelTo);
  // Mirrors showPlaceholder() reloading "stars" itself: landing on home
  // always resets the background regardless of which preset was showing
  // beforehand (e.g. hyperspace, left over from CV having never touched it).
  loadPreset(HOME_DEFAULT_PRESET);
}

// The "cv" destination renders the static CV markup already in the page
// (#cv-page); every other implemented destination would follow the same
// pattern here.
function showDestination(hash, label) {
  navButtons.detach();
  homeView.hidden = true;
  destinationView.hidden = false;
  contactBadges.hidden = false;
  themeToggleEl.hidden = false;
  siteLogo.hidden = false;

  const isCv = hash === "cv";
  destinationContent.classList.toggle("is-cv", isCv);
  destinationLabel.hidden = isCv;
  destinationLabel.textContent = isCv ? "" : label;
  cvPage.hidden = !isCv;
}

// Not-yet-implemented destinations keep the homepage's tsparticles/black-hole
// background running (loadPreset() re-attaches blackHole for "stars") rather
// than the destination view's usual blank background, so they still feel
// like part of the same site instead of a dead end.
function showPlaceholder() {
  navButtons.detach();
  destinationView.hidden = true;
  homeView.hidden = false;
  homeHeading.hidden = true;
  placeholderView.hidden = false;
  contactBadges.hidden = false;
  themeToggleEl.hidden = false;
  siteLogo.hidden = false;
  loadPreset(HOME_DEFAULT_PRESET);
}

function renderRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const label = DESTINATIONS.get(hash);
  if (!label) {
    showHome();
  } else if (IMPLEMENTED_HASHES.has(hash)) {
    showDestination(hash, label);
  } else {
    showPlaceholder();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Plays the hyperspace preset for the travel duration. The particle canvas
// only lives in the home view, so the caller must make sure home-view is
// visible before calling this — loading a preset while its container is
// display:none leaves tsParticles measuring a zero-size canvas, which is
// also why stars never reappeared after a plain (non-animated) "back".
async function playHyperspace() {
  homeHeading.hidden = true;
  contactBadges.hidden = true;
  themeToggleEl.hidden = true;
  siteLogo.hidden = true;
  await loadPreset("hyperspace");
  await wait(HYPERSPACE_TRAVEL_MS);
}

// Set right before we change the hash ourselves (as opposed to the user
// pressing the browser's back/forward buttons), so the hashchange listener
// below can tell the two apart — see handleHashChange().
let pendingHashChange = false;

function setHash(hash) {
  pendingHashChange = true;
  window.location.hash = hash;
}

// Nav items with an `href` (e.g. ClimateMapper) are separate applications
// living outside this SPA: after the hyperspace transition, navigate away
// for real instead of setting an in-app hash route.
async function travelTo(item) {
  if (traveling) return;
  traveling = true;
  navButtons.detach();

  await playHyperspace();

  if (item.href) {
    // Reset before the real navigation so that if the browser freezes this
    // page into its back-forward cache (bfcache) instead of discarding it,
    // the snapshot it restores on "back" isn't stuck mid-travel.
    traveling = false;
    window.location.href = item.href;
    return;
  }

  setHash(`/${item.hash}`);
  traveling = false;
}

async function travelHome() {
  if (traveling) return;
  traveling = true;

  destinationView.hidden = true;
  placeholderView.hidden = true;
  homeHeading.hidden = true;
  homeView.hidden = false;

  await playHyperspace();

  setHash("");
  traveling = false;
}

function goHome(e) {
  e.preventDefault();
  travelHome();
}

destinationBack.addEventListener("click", goHome);
placeholderBack.addEventListener("click", goHome);

// The browser's own back/forward buttons change the hash directly,
// bypassing travelTo()/travelHome() (and the hyperspace transition they
// play) entirely — landing straight on the new view. pendingHashChange
// distinguishes that from a hash change we triggered ourselves (which
// already played hyperspace before setting the hash, so only needs to
// render the new route) — see setHash().
async function handleHashChange() {
  if (pendingHashChange) {
    pendingHashChange = false;
    renderRoute();
    return;
  }

  if (traveling) return;
  traveling = true;
  navButtons.detach();

  // Reveal the home view before playing hyperspace: the particle canvas only
  // lives there, and loading a preset while its container is display:none
  // leaves tsParticles measuring a zero-size canvas (see playHyperspace()).
  destinationView.hidden = true;
  placeholderView.hidden = true;
  homeHeading.hidden = true;
  homeView.hidden = false;

  await playHyperspace();

  traveling = false;
  renderRoute();
}

window.addEventListener("hashchange", handleHashChange);

// Returning via the browser's back button after navigating to an external
// page (e.g. ClimateMapper) can restore this page from the back-forward
// cache (bfcache) instead of reloading it — resurrecting whatever in-memory
// state existed the instant it was left, including a frozen hyperspace
// preset and detached nav buttons. `pageshow`'s `persisted` flag is how a
// bfcache restore is detected. Replaying the hyperspace transition here
// mirrors travelHome()'s reveal, so "back" from ClimateMapper still plays
// out as a travel sequence rather than snapping straight to the homepage.
async function recoverFromBfcache() {
  traveling = true;
  await playHyperspace();
  traveling = false;
  renderRoute();
}

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  traveling = false;
  if (homeView.hidden) {
    renderRoute();
  } else {
    recoverFromBfcache();
  }
});

async function init() {
  await loadSlim(tsParticles);
  await loadImageShape(tsParticles);
  await registerAllPresets();
  renderRoute();
}

init();
