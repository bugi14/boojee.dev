import "./cv.css";

// Builds the static CV DOM for the "#/cv" destination. Content is fully
// static today; kept as a template string here (rather than the actual
// resume data) so it's a straightforward next step to template from data
// later without touching index.html or the router.
export function createCvPage() {
  const page = document.createElement("div");
  page.id = "cv-page";
  page.hidden = true;
  page.innerHTML = `
    <header class="cv-header">
      <img class="cv-photo" src="/assets/images/darren.jpg" alt="Darren Buttigieg" width="96" height="96" />
      <div>
        <h1>Darren Buttigieg</h1>
        <p class="cv-title">Python Developer | Backend Systems | Data Engineering</p>
        <p class="cv-contact">
          <a href="mailto:dbuttigieg92@gmail.com">dbuttigieg92@gmail.com</a>
          <span>·</span>
          <a href="https://www.linkedin.com/in/darren-buttigieg" target="_blank" rel="noreferrer">LinkedIn</a>
          <span>·</span>
          <a href="https://github.com/bugi14" target="_blank" rel="noreferrer">GitHub</a>
        </p>
      </div>
    </header>

    <div class="cv-body">
      <aside class="cv-sidebar">
        <section class="cv-section">
          <h2>About</h2>
          <p class="cv-summary">
            Astrophysics-trained Python engineer with 5+ years of experience building production-grade
            data systems across freelance and industry roles. Specialised in large-scale data pipelines,
            numerical processing, and transforming complex datasets into reliable, high-performance systems.
          </p>
        </section>

        <section class="cv-section">
          <h2>Skills</h2>
          <dl class="cv-skills">
            <dt>Programming Languages</dt>
            <dd>Python, JavaScript, C++, MATLAB, Fortran, Wolfram Mathematica</dd>

            <dt>Backend &amp; Data</dt>
            <dd>REST APIs, Flask, Asyncio, SQLAlchemy, ETL pipelines, Data processing, NumPy, Pandas, Typed Python</dd>

            <dt>DevOps &amp; Infrastructure</dt>
            <dd>Docker, Kubernetes, CI/CD (GitHub Actions), Linux, Redis, RabbitMQ, Observability</dd>

            <dt>Monitoring &amp; Quality</dt>
            <dd>Grafana, Prometheus, Pytest, TDD, Ruff, Poetry, Testing, Refactoring</dd>

            <dt>Languages</dt>
            <dd>Maltese (native), English (fluent), Spanish &amp; Italian (very good), French (basic)</dd>
          </dl>
        </section>
      </aside>

      <main class="cv-main">
        <section class="cv-section">
          <h2>Experience</h2>

          <article class="cv-entry">
            <div class="cv-entry-head">
              <h3>Freelance Python Developer</h3>
              <span class="cv-dates">Nov 2018 – May 2019, May 2022 – Present</span>
            </div>
            <ul>
              <li>End-to-end delivery: architecture, implementation, client alignment, and deployment</li>
              <li>Designed and built scalable backend (Python 3.x) services</li>
              <li>Developed ETL pipelines and data processing systems for real-world applications</li>
              <li>Translated mathematical models and research into production-grade systems</li>
              <li>Built geospatial model for mapping, coverage algorithms, and layered visual encoding</li>
              <li>Ensured reliability through testing, typing, and observability (Pytest, TDD, Ruff, Poetry)</li>
            </ul>
          </article>

          <article class="cv-entry">
            <div class="cv-entry-head">
              <h3>Software Engineer, Connectors Team — <a href="https://onna.com/" target="_blank" rel="noreferrer">Onna</a></h3>
              <span class="cv-dates">Jun 2020 – Feb 2022</span>
            </div>
            <p class="cv-entry-sub">Barcelona &amp; Remote</p>
            <ul>
              <li>Contributed to 20+ third-party API connectors for large-scale backend systems (billion-file / multi-petabyte scale)</li>
              <li>Designed data synchronisation logic improving efficiency and system performance</li>
              <li>Relational databases (SQLAlchemy), asynchronous processing and messaging systems (Redis, RabbitMQ)</li>
              <li>Containerised services using Docker and contributed to Kubernetes-based deployments</li>
              <li>Implemented monitoring and observability using Grafana and Prometheus</li>
              <li>Contributed to CI/CD pipelines, testing, and system modularisation</li>
            </ul>
          </article>

          <article class="cv-entry">
            <div class="cv-entry-head">
              <h3>Junior Software Developer and Mathematician — <a href="https://meetsherpa.com/" target="_blank" rel="noreferrer">Sherpa</a></h3>
              <span class="cv-dates">Oct 2016 – Oct 2017</span>
            </div>
            <p class="cv-entry-sub">Malta</p>
            <ul>
              <li>Backend services and REST APIs (Python, Flask)</li>
              <li>Mathematical models for insurance and financial risk</li>
              <li>Model implementation with focus on correctness and stability</li>
              <li>Integration with relational databases</li>
              <li>Contributed to research paper underpinning system</li>
            </ul>
          </article>
        </section>

        <section class="cv-section">
          <h2>Education</h2>

          <article class="cv-entry">
            <div class="cv-entry-head">
              <h3>MSc in Astronomy, Cosmology — Leiden University, Netherlands</h3>
              <span class="cv-dates">2014 – 2016</span>
            </div>
            <ul>
              <li>Thesis: Dark Energy / Modified Gravity models</li>
              <li>Numerical simulations and data analysis pipelines</li>
            </ul>
          </article>

          <article class="cv-entry">
            <div class="cv-entry-head">
              <h3>BSc (Hons) Mathematics and Physics, Summa Cum Laude — University of Malta</h3>
              <span class="cv-dates">2010 – 2014</span>
            </div>
          </article>
        </section>
      </main>
    </div>
  `;
  return page;
}
