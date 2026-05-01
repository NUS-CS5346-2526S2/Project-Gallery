const grid = document.querySelector("#project-grid");
const resultCount = document.querySelector("#result-count");
const projectCount = document.querySelector("#project-count");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isExternal(url) {
  return /^https?:\/\//i.test(url);
}

function linkTarget(url) {
  return isExternal(url) ? ' target="_blank" rel="noopener"' : "";
}

function formatGroupLabel(group) {
  const match = String(group).match(/\d+/);
  return match ? `GROUP ${match[0].padStart(2, "0")}` : group;
}

function renderProjectCard(project) {
  const members = project.members
    ? `<p class="project-members">${escapeHtml(project.members)}</p>`
    : "";

  return `
    <article class="project-card" data-project="${escapeHtml(project.id)}">
      <a class="project-image-link" href="${escapeHtml(project.primaryUrl)}"${linkTarget(project.primaryUrl)} aria-label="Open ${escapeHtml(project.title)}">
        <img class="project-image" src="${escapeHtml(project.thumbnail)}" alt="${escapeHtml(project.title)} preview" loading="lazy" />
      </a>
      <div class="project-body">
        <div class="group-label">${escapeHtml(formatGroupLabel(project.group))}</div>
        ${members}
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.summary)}</p>
      </div>
      <div class="project-actions">
        <a class="primary-link" href="${escapeHtml(project.primaryUrl)}"${linkTarget(project.primaryUrl)}>
          Open project
        </a>
      </div>
    </article>
  `;
}

fetch("projects.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Could not load projects.json: ${response.status}`);
    }
    return response.json();
  })
  .then((projects) => {
    projectCount.textContent = projects.length;
    resultCount.textContent = `${projects.length} student projects`;
    grid.innerHTML = projects.map(renderProjectCard).join("");
  })
  .catch((error) => {
    console.error(error);
    resultCount.textContent = "Could not load project data.";
    grid.innerHTML = '<div class="empty-state">Project metadata failed to load.</div>';
  });
