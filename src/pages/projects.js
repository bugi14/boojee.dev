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
  const demo = project.demo
    ? `<img class="project-demo" src="${project.demo.src}" alt="${project.demo.alt}" loading="lazy" />`
    : "";

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
  const image = block.image
    ? `<img class="project-inline-image" src="${block.image.src}" alt="${block.image.alt}" loading="lazy" />`
    : "";
  const paragraphs = (block.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
  const list = block.list
    ? `<ul>${block.list.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "";

  return `${heading}${image}${paragraphs}${list}`;
}
