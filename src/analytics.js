const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

let initialized = false;
let sectionName = null;
let sectionPath = null;
let activeSince = null;
let activeTimeMs = 0;

function gtag() {
  window.dataLayer.push(arguments);
}

function recordActiveTime() {
  if (activeSince === null) return;

  activeTimeMs += Math.max(0, performance.now() - activeSince);
  activeSince = null;
}

function flushSectionEngagement(trigger) {
  if (!sectionName) return;

  recordActiveTime();
  const engagementTimeMs = Math.round(activeTimeMs);
  activeTimeMs = 0;

  if (engagementTimeMs === 0) return;

  gtag("event", "section_engagement", {
    section_name: sectionName,
    page_path: sectionPath,
    engagement_time_msec: engagementTimeMs,
    engagement_trigger: trigger,
    transport_type: "beacon",
  });
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    flushSectionEngagement("visibility_hidden");
  } else if (sectionName) {
    activeSince = performance.now();
  }
}

export function initAnalytics() {
  if (!measurementId || initialized) return Boolean(measurementId);

  initialized = true;
  window.dataLayer = window.dataLayer || [];

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", () => flushSectionEngagement("page_exit"));

  return true;
}

export function trackSectionView(name, title) {
  if (!initialized) return;

  const path = `${window.location.pathname}${window.location.hash}`;
  if (sectionName === name && sectionPath === path) return;

  flushSectionEngagement("route_change");
  sectionName = name;
  sectionPath = path;
  activeTimeMs = 0;
  activeSince = document.visibilityState === "visible" ? performance.now() : null;

  gtag("event", "page_view", {
    page_title: title,
    page_location: window.location.href,
    page_path: path,
    section_name: name,
  });
}
