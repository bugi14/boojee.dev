// Content for the "Other Projects" page. One entry per project; the page
// renders them in array order.
export const PROJECTS = [
  {
    id: "couchsearch",
    title: "Beyond the City: A Discovery Map for Couchsurfing Hosts",
    status:
      "Note: This project is currently paused. Couchsurfing overhauled their website in 2026, breaking the scraping layer this tool relied on. All references to Couchsurfing below describe how the platform worked prior to that overhaul. The project is presented here as a portfolio piece for the architecture and the problems it solved.",
    demo: {
      src: "/assets/images/couchsearch-demo.gif",
      alt: "CouchSearch demo — panning and filtering the interactive host map",
    },
    body: [
      {
        heading: "Problem",
        paragraphs: [
          "Couchsurfing's search only works one city at a time, with a fixed radius. Finding hosts across a rural region, where some of the more interesting stays tend to be, meant manually repeating the same search across dozens of villages and towns. On top of that, the platform surfaces dormant profiles alongside active ones with no way to distinguish them at a glance, so evaluating options meant opening host after host just to rule most of them out.",
        ],
      },
      {
        heading: "Approach",
        paragraphs: [
          "CouchSearch automates both problems away. Given a bounding box for a region, it:",
        ],
        list: [
          "Computes a minimal set of search locations and radii that together cover the entire area, without any single radius growing so large it pulls in hosts from unrelated places.",
          "Scrapes Couchsurfing at each location using Selenium (the site is heavily JS-rendered, so plain HTTP requests don't work), applying adaptive filters that tighten in dense cities and loosen in remote areas where every host is worth surfacing.",
          "Visits each host's profile to pull richer detail (home setup, references, sleeping arrangements).",
          "Renders everything on an interactive Folium map, with each host represented by a custom SVG marker that encodes gender, hosting status, login recency, and reference count simultaneously, so filtering happens visually instead of profile-by-profile.",
        ],
      },
      {
        heading: "The interesting engineering problem: covering a region with the fewest, best-placed searches",
        paragraphs: [
          "The core algorithmic challenge wasn't the scraping, it was deciding where to search. A naive grid over the bounding box either misses low-density areas or wastes requests oversampling them. The solution processes places top-down by population first (major cities get a fixed 35km radius, big cities 20km, and so on), skipping any place already covered by a larger neighbour. It then works bottom-up through remaining small towns, sizing each radius to fill the gap to the next covered boundary. A final expansion pass and gap-filling pass mop up anything still missed, and everything is clamped between a configurable min and max radius so no single circle balloons out of proportion.",
        ],
      },
      {
        image: {
          src: "/assets/images/couchsearch-map-cover.png",
          alt: "Map showing the computed region cover for CouchSearch",
        },
        paragraphs: [
          "The list is sorted so major cities scrape first, giving a useful partial map even if a long-running scrape is interrupted.",
        ],
      },
      {
        heading: "A second, less obvious problem",
        paragraphs: [
          "Couchsurfing's search field autocompletes against Mapbox internally, but Mapbox has no API for enumerating all places in a region. Geoapify does that enumeration, but its results can't be fed directly to Couchsurfing's search. So the pipeline uses Geoapify to find what exists in the region, then resolves each result through Mapbox to get an address string Couchsurfing will actually accept, two geocoding providers used for what one provider can't do alone.",
        ],
      },
      {
        heading: "Engineering discipline",
        paragraphs: [
          "The project is fully typed (Pydantic models, strict mypy), covered by a pytest suite, linted with Ruff, and has pre-commit hooks enforcing all of it. Every computed region cover and every scrape run is cached and keyed by a hash of the active config, so interrupted runs resume automatically and experimenting with different radius parameters never throws away prior scraped data.",
        ],
      },
      {
        heading: "Status",
        paragraphs: [
          "Couchsurfing rebuilt its site mid-development, breaking the scraping layer before several areas reached a finished state. Popup styling, profile pictures, and reference date parsing were all works in progress at the point development stopped. The architecture and the coverage algorithm stand on their own as solved problems, and the map itself is fully functional for the data that was successfully scraped.",
        ],
      },
    ],
  },
];
