// Content for the CV page, split per section into a concise "short" variant
// (matches the print CV) and a longer "detailed" variant (matches LinkedIn).
// Kept as data — rather than baked into cv.js's DOM-building code — so the
// read more/less toggle and the About-text triggers can treat every section
// uniformly instead of special-casing markup per section.

export const SUBTITLE = "Python Developer | Scientific Computing | Backend Systems";

// A "trigger" is a clickable phrase inside the About text. Clicking it opens
// the listed sections in full (same as clicking their nav pill — every
// entry shown, nothing filtered out) and highlights the relevant entries
// and/or specific bullets/blocks within them (see the `data-block` markers
// on EXPERIENCE entries below). Hovering (without clicking) instead shows a
// small preview popup with just the relevant bullet — see cv.js's
// showPreview().
//
// - `sections`: which sections open on click.
// - `highlightEntries`: entry ids to mark as a whole (adds a highlight
//   style to the whole entry card).
// - `highlightBlocks`: { entryId: [blockKey, ...] } for finer-grained
//   highlighting of specific bullets/paragraphs within an entry, using the
//   `data-block` markers baked into that entry's HTML. A given bullet's
//   marker (and its wording) can differ between the short (CV) and
//   detailed (LinkedIn) copy, so the value can instead be
//   `{ short: [...], detailed: [...] }` when the two modes need different
//   block keys — resolved against whatever Read-more state that entry's
//   section is actually in (see resolveBlockKeys() in cv.js). A plain
//   array is used where the same key exists in both.
function triggerButton(id, label) {
  return `<button type="button" class="cv-trigger" data-trigger="${id}">${label}</button>`;
}

export const TRIGGERS = {
  "python-experience": {
    sections: ["experience", "education"],
    highlightEntries: ["freelance", "onna", "sherpa", "msc"],
  },
  astrophysics: {
    sections: ["education"],
    highlightEntries: ["msc"],
  },
  mathematics: {
    sections: ["education"],
    highlightEntries: ["bsc"],
  },
  "research-papers": {
    sections: ["experience", "education"],
    highlightEntries: ["msc", "bsc"],
    highlightBlocks: {
      freelance: { short: ["scientificModels"], detailed: ["hodgkinHuxley", "odePde"] },
    },
  },
  "mathematical-models": {
    sections: ["experience", "education"],
    highlightEntries: ["msc", "bsc"],
    highlightBlocks: {
      freelance: {
        short: ["economicIndex", "scientificModels"],
        detailed: ["coreProjectConfig", "coreProjectPipelines", "coreProjectBackfills"],
      },
      sherpa: ["mathModels"],
    },
  },
  onna: {
    sections: ["experience"],
    highlightEntries: ["onna"],
  },
  climatemapper: {
    sections: ["experience"],
    highlightBlocks: { freelance: ["climateMapper"] },
  },
};

export const ABOUT = {
  short: `
    <p>Engineer with ${triggerButton("python-experience", "8+ years of Python experience")}. My
    background in ${triggerButton("astrophysics", "astrophysics")} and
    ${triggerButton("mathematics", "mathematics")} shaped how I approach complex problems, be they
    ${triggerButton("research-papers", "research papers")},
    ${triggerButton("mathematical-models", "mathematical models")}, or ambiguous product ideas.
    Modern AI tooling lets me move fast across stacks, backed by engineering judgment built over
    nearly a decade to know what correct, maintainable code actually looks like.</p>
    <p>My core strength is reasoning from first principles, learning a new domain quickly, and
    shipping something real — from petabyte-scale data ingestion at
    ${triggerButton("onna", "Onna")}, to a multi-year economic
    index platform built independently, to recent product work like
    ${triggerButton("climatemapper", "ClimateMapper")}
    and my own <a href="https://boojee.dev" target="_blank" rel="noreferrer">portfolio site</a>, both
    built solo using AI-assisted workflows.</p>
  `,
  detailed: `
    <p>Engineer with ${triggerButton("python-experience", "8+ years of Python experience")}. My
    background in ${triggerButton("astrophysics", "astrophysics")} and
    ${triggerButton("mathematics", "mathematics")} shaped how I approach complex problems, be they
    ${triggerButton("research-papers", "research papers")},
    ${triggerButton("mathematical-models", "mathematical models")}, or ambiguous product ideas.
    Modern AI tooling lets me move fast across stacks, backed by engineering judgement built over
    nearly a decade to know what correct, maintainable code actually looks like.</p>
    <p>My core strength is reasoning from first principles, learning a new domain quickly, and
    shipping something real — from petabyte-scale data ingestion at
    ${triggerButton("onna", "Onna")}, to a multi-year economic
    index platform built independently, to recent product work like
    ${triggerButton("climatemapper", "ClimateMapper")}
    and my own <a href="https://boojee.dev" target="_blank" rel="noreferrer">portfolio site</a>, both
    built solo using AI-assisted workflows.</p>
    <p>I take full ownership of architecture, implementation, and delivery, whether working
    independently or as part of a larger team — including a 15–20 person engineering team at Onna,
    building large-scale data ingestion systems used by companies including Electronic Arts, Dropbox,
    and Slack.</p>
    <ul>
      <li>Translating research, mathematical models, and complex specifications into working systems</li>
      <li>Scientific computing, simulation, and numerical modelling (ODE/PDE systems)</li>
      <li>ETL pipelines and large-scale data processing</li>
      <li>Third-party API integration and large-scale data ingestion</li>
      <li>Backend systems and data infrastructure (Python, Docker, async patterns, observability)</li>
      <li>Testing, typing, and code quality (Pytest, TDD, Ruff, Poetry, GitHub Copilot, Claude Code)</li>
    </ul>
    <p>I'm most effective in technically demanding environments where requirements are non-standard,
    the problem space is genuinely novel, and clarity needs to be built into the system — not handed
    to you upfront.</p>
    <p>Outside of engineering: long-term traveller across Europe and Asia, often hitchhiking; designed
    and built a fully self-contained campervan.</p>
    <p>Currently open to remote Python roles (EU timezone), contract or permanent.</p>
  `,
};

// Each category renders as a heading plus one skill per line (rather than a
// comma-separated run-on), so [term, [skills...]] pairs are the natural shape.
function renderSkillGroups(groups) {
  return `
    <dl class="cv-skills">
      ${groups
        .map(
          ([term, skills]) => `
            <dt>${term}</dt>
            <dd><ul class="cv-skills-list">${skills.map((skill) => `<li>${skill}</li>`).join("")}</ul></dd>
          `,
        )
        .join("")}
    </dl>
  `;
}

const LANGUAGES = ["Maltese (native)", "English (native)", "Spanish (very good)", "Italian (very good)", "French (basic)"];

export const SKILLS = {
  short: renderSkillGroups([
    ["Core Skills", ["Python 3", "Backend Systems / REST APIs", "Data Engineering / ETL", "Scientific Computing", "Docker", "GitHub"]],
    ["Languages", LANGUAGES],
  ]),
  detailed: renderSkillGroups([
    ["Top Skills", ["Python (Programming Language)", "Software Development", "Data Engineering", "Data Pipelines", "Scientific Computing"]],
    ["Programming Languages", ["Python", "JavaScript", "C++", "MATLAB", "Fortran", "Wolfram Mathematica"]],
    ["Backend &amp; Data", ["REST APIs", "Flask", "Asyncio", "SQLAlchemy", "ETL pipelines", "data processing", "NumPy", "Pandas", "typed Python"]],
    ["DevOps &amp; Infrastructure", ["Docker", "Kubernetes", "CI/CD (GitHub Actions)", "Linux", "Redis", "RabbitMQ", "observability"]],
    ["Monitoring &amp; Quality", ["Grafana", "Prometheus", "Pytest", "TDD", "Ruff", "Poetry", "testing", "refactoring"]],
    ["Languages", LANGUAGES],
  ]),
};

// Named fragments of the Freelance/Sherpa "detailed" copy, broken out so
// the About-text triggers (see TRIGGERS above) can surface just the
// relevant bullet(s) instead of the whole entry — the full `detailed`
// strings below are composed from these same fragments, so there's one
// source of truth for each piece of text.
// `data-block="key"` markers are baked directly into the markup (rather
// than kept separate) so a highlight/preview target can be found by a
// plain querySelector against the already-rendered "detailed" HTML — see
// applyHighlights()/renderPreview() in cv.js.
const FREELANCE_BLOCKS = {
  intro: `<p>End-to-end delivery of production Python systems for 50+ clients across research-driven
    and data-intensive projects — architecture, implementation, client alignment, and deployment.</p>`,
  coreProject: `
    <div class="cv-block" data-block="coreProject">
      <p><strong>Core Project: Economic Index Platform — Global News Data Pipeline</strong> (Apr 2022 – Present)</p>
      <p>Independently evolved from prototype a platform constructing economic indices from
      large-scale global news datasets, implementing Baker-Bloom-Davis-style academic methodology
      across tens of thousands of articles spanning multiple decades and news sources.</p>
      <ul>
        <li data-block="coreProjectConfig">Configuration-driven framework enabling non-developers to
        define new indices across sources, languages, regions, and time resolutions without
        modifying code</li>
        <li data-block="coreProjectPipelines">Resilient ingestion pipelines with structured logging,
        retries, fault recovery, and validation</li>
        <li data-block="coreProjectBackfills">Automation workflows for historical backfills across
        thousands of news sources</li>
      </ul>
    </div>
  `,
  climateMapper: `<li data-block="climateMapper">Built
    <a href="https://climatemapper.boojee.dev/" target="_blank" rel="noreferrer">ClimateMapper</a>,
    a geospatial visualisation tool for exploring climate variables derived from ERA5 reanalysis data</li>`,
  couchSearch: `<li data-block="couchSearch">Built CouchSearch, a geospatial discovery tool mapping
    hosts by region with a layered visual encoding system</li>`,
  hodgkinHuxley: `<li data-block="hodgkinHuxley">Multi-compartment Hodgkin-Huxley neuron model from
    literature, including ion channel dynamics and multiple solver modes</li>`,
  odePde: `<li data-block="odePde">ODE/PDE solvers for SIR/SIRV epidemiological models, predator-prey
    dynamics, and arterial blood flow (FEniCS)</li>`,
  otherClientWorkRest: `
    <li>Numerical linear algebra from first principles — Cholesky, LU decomposition, Gauss-Newton,
    Broyden</li>
    <li>Bitcoin wallet from cryptographic primitives without 3rd-party libraries</li>
    <li>Scientific visualisation pipelines producing publication-quality figures</li>
    <li class="cv-tech">Python 3 · Claude Code · GitHub Copilot · GitHub Actions · Docker · Git ·
    Selenium · Matplotlib · NumPy · Pandas · Wolfram Mathematica · LaTeX</li>
    <li>Accepted into the Toptal Talent Network (Nov 2022) following rigorous technical screening</li>
  `,
};
FREELANCE_BLOCKS.personalProjects = `
  <div class="cv-block" data-block="personalProjects">
    <p><strong>Personal Projects</strong></p>
    <ul>
      ${FREELANCE_BLOCKS.climateMapper}
      ${FREELANCE_BLOCKS.couchSearch}
    </ul>
  </div>
`;

const SHERPA_BLOCKS = {
  mathModels: `<li data-block="mathModels">Implemented mathematical models in production code,
    processing 100+ data points per assessment with careful attention to numerical stability and
    model validity</li>`,
};

export const EXPERIENCE = {
  entries: [
    {
      id: "freelance",
      python: true,
      title: `<a href="https://boojee.dev" target="_blank" rel="noreferrer">Freelance Software Developer</a>`,
      dates: "Nov 2017 – May 2020, Mar 2022 – Present",
      sub: "Remote",
      blocks: FREELANCE_BLOCKS,
      short: `
        <ul>
          <li data-block="economicIndex">Independently evolved from prototype a platform constructing
          economic indices from large-scale global news datasets, implementing Baker-Bloom-Davis-style
          academic methodology across tens of thousands of articles spanning multiple decades and news
          sources</li>
          <li data-block="climateMapper">Built
          <a href="https://climatemapper.boojee.dev/" target="_blank" rel="noreferrer">ClimateMapper</a>,
          a geospatial visualisation tool for exploring climate variables derived from ERA5 reanalysis
          data, with an interactive map interface for regional and temporal comparison</li>
          <li>Built CouchSearch, a geospatial discovery tool mapping hosts by region with a layered
          visual encoding system representing availability, references, and activity recency</li>
          <li data-block="scientificModels">Implemented scientific models from academic literature
          across multiple domains: computational neuroscience (Hodgkin-Huxley neuron dynamics),
          epidemiology (SIR/SIRV compartmental ODE models), structural and continuum mechanics (FEniCS
          / FEM — arterial blood flow, PDE-based physical simulations), and predator-prey population
          dynamics</li>
          <li>End-to-end delivery for 50+ clients: architecture, implementation, client alignment, and
          deployment</li>
          <li>Accepted into <a href="https://www.toptal.com/developers/resume/darren-buttigieg" target="_blank" rel="noreferrer">Toptal network</a>
          of top 3% talent (November 2022)</li>
          <li class="cv-tech">Python 3 · Claude Code · GitHub Copilot · GitHub Actions · Docker · Git ·
          Selenium · Matplotlib · NumPy · Pandas · Wolfram Mathematica · LaTeX</li>
        </ul>
      `,
      detailed: `
        ${FREELANCE_BLOCKS.intro}
        ${FREELANCE_BLOCKS.coreProject}
        ${FREELANCE_BLOCKS.personalProjects}
        <p><strong>Other Client Work</strong></p>
        <ul>
          ${FREELANCE_BLOCKS.hodgkinHuxley}
          ${FREELANCE_BLOCKS.odePde}
          ${FREELANCE_BLOCKS.otherClientWorkRest}
        </ul>
      `,
    },
    {
      id: "onna",
      python: true,
      title: `Software Engineer, Connectors Team — <a href="https://onna.com/" target="_blank" rel="noreferrer">Onna</a>`,
      dates: "Jun 2020 – Feb 2022",
      sub: "Barcelona & Remote — 15–20 person engineering team",
      short: `
        <ul>
          <li>Contributed to 20+ third-party API connectors for large-scale backend systems
          (billion-file / multi-petabyte scale), used by companies including Electronic Arts, Dropbox,
          and Slack</li>
          <li>Designed data synchronisation logic reducing API calls by 40%, rate limiting by 90%, and
          improving sync time by 1.5x+</li>
          <li>Implemented monitoring and observability (Grafana, Prometheus), identifying all instances
          and causes of rate limiting and leading to 30+ bugs being caught before production</li>
          <li class="cv-tech">Python 3 · SQLAlchemy · Asyncio · Redis · RabbitMQ · Docker · Git ·
          Kubernetes · Jenkins · Grafana · Prometheus</li>
        </ul>
      `,
      detailed: `
        <p>Member of a 15–20 person engineering team building large-scale data ingestion and backend
        systems for eDiscovery and compliance use cases.</p>
        <ul>
          <li>Contributed to 20+ third-party API connectors for large-scale backend systems
          (billion-file / multi-petabyte scale), used by companies including Electronic Arts, Dropbox,
          and Slack</li>
          <li>Designed data synchronisation logic reducing API calls by 40%, rate limiting by 90%, and
          improving sync time by 1.5x+</li>
          <li>Implemented monitoring and observability (Grafana, Prometheus), identifying all instances
          and causes of rate limiting and leading to 30+ bugs being caught before production</li>
          <li class="cv-tech">Python 3 · SQLAlchemy · Asyncio · Redis · RabbitMQ · Docker · Git ·
          Kubernetes · Jenkins · Grafana · Prometheus</li>
        </ul>
      `,
    },
    {
      id: "sherpa",
      python: true,
      title: `Software Developer — <a href="https://meetsherpa.com/" target="_blank" rel="noreferrer">Sherpa</a>`,
      dates: "Oct 2016 – Oct 2017",
      sub: "Malta",
      blocks: SHERPA_BLOCKS,
      short: `
        <ul>
          <li>Co-authored a research paper proposing a novel mathematical approach to quantifying and
          scoring risk across 5+ categories</li>
          ${SHERPA_BLOCKS.mathModels}
          <li>Contributed to backend systems exposing scoring and risk models as a client-facing
          platform</li>
          <li class="cv-tech">Python 3 · Flask · Swagger · SQLAlchemy · Git</li>
        </ul>
      `,
      detailed: `
        <p>Built a mathematical modelling and scoring platform, translating analytical specifications
        into production Python systems.</p>
        <ul>
          <li>Co-authored a research paper proposing a novel mathematical approach to quantifying and
          scoring risk across 5+ categories</li>
          ${SHERPA_BLOCKS.mathModels}
          <li>Contributed to backend systems exposing scoring and risk models as a client-facing
          platform</li>
          <li class="cv-tech">Python 3 · Flask · Swagger · SQLAlchemy · Git</li>
        </ul>
      `,
    },
  ],
};

export const EDUCATION = {
  entries: [
    {
      id: "msc",
      python: true,
      title: "MSc Astronomy, Cosmology",
      dates: "2014 – 2016",
      sub: "Leiden University, Netherlands",
      short: `
        <p class="cv-entry-thesis">Thesis: Exploring the Phenomenology of Dark Energy / Modified
        Gravity on Cosmological Scales</p>
        <p class="cv-tech">Python · Matplotlib · NumPy · AstroPy · Pandas · Wolfram Mathematica · LaTeX</p>
      `,
      detailed: `
        <p class="cv-entry-thesis">Thesis: Exploring the Phenomenology of Dark Energy / Modified
        Gravity on Cosmological Scales</p>
        <ul>
          <li>Conducted two research projects involving extensive scientific programming (Python, C++,
          Mathematica) and numerical modelling of cosmological and galactic systems</li>
          <li>Built custom pipelines for analysing large astronomical datasets, implementing algorithms
          directly from scientific literature</li>
          <li>Completed advanced modules across cosmology, general relativity, computational
          astrophysics, quantum mechanics, and field theory</li>
        </ul>
        <p class="cv-tech">Python · Matplotlib · NumPy · AstroPy · Pandas · Wolfram Mathematica · LaTeX</p>
      `,
    },
    {
      id: "bsc",
      python: false,
      title: "BSc (Hons) Mathematics & Physics",
      dates: "2010 – 2014",
      sub: "University of Malta — Summa Cum Laude",
      short: `
        <p class="cv-tech">Java · C++ · Fortran · Wolfram Mathematica · MATLAB</p>
      `,
      detailed: `
        <p class="cv-entry-thesis">Dissertation: The Midplane Symmetry of Peanut/Boxy-Shaped Bulges</p>
        <ul>
          <li>Research thesis built on custom numerical models written in C++ and MATLAB</li>
          <li>Broad mathematical foundations across analysis, differential equations, group theory,
          measure theory, and computational mathematics</li>
        </ul>
        <p class="cv-tech">Java · C++ · Fortran · Wolfram Mathematica · MATLAB</p>
      `,
    },
  ],
};
