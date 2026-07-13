import "./projects.css";
import { PROJECTS } from "./projects-data.js";

// Builds the "Other Projects" page: one panel per project, following the
// same CV-panel visual treatment (see cv.css) for consistency across
// destination pages.
export function createProjectsPage() {
  const page = document.createElement("div");
  page.id = "projects-page";
  page.hidden = true;

  page.innerHTML = PROJECTS.map((project) => renderProject(project)).join("");

  return page;
}

function renderProject(project) {
  const demo = project.demo ? renderFigure(project.demo, "project-demo") : "";

  const body = project.body.map(renderBlock).join("");

  return `
    <article class="project-panel">
      <h2 class="project-title">${project.title}</h2>
      ${project.status ? `<p class="project-status">${project.status}</p>` : ""}
      ${demo}
      ${body}
    </article>
  `;
}

function renderBlock(block) {
  const heading = block.heading ? `<h3>${block.heading}</h3>` : "";
  const image = block.image ? renderFigure(block.image, "project-inline-image") : "";
  const paragraphs = (block.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
  const list = block.list
    ? `<ul>${block.list.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "";

  return `${heading}${image}${paragraphs}${list}`;
}

function renderFigure(media, imageClass) {
  const img = `<img class="${imageClass}" src="${media.src}" alt="${media.alt}" loading="lazy" />`;
  if (!media.caption) return img;
  return `<figure class="project-figure">${img}<figcaption>${media.caption}</figcaption></figure>`;
}
