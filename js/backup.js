function initBackupTools() {
  const exportButton = document.querySelector(".export-works-button");
  const importButton = document.querySelector(".import-works-button");
  const importInput = document.querySelector("#importWorksInput");
  if (!exportButton || !importButton || !importInput) return;
  initResponsiveBackupTools();

  exportButton.addEventListener("click", () => {
    const payload = { app: "Little Library", exportedAt: new Date().toISOString(), works: getWorks() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `도서관-${formatExportDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  importButton.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const importedWorks = Array.isArray(parsed) ? parsed : parsed.works;
        if (!Array.isArray(importedWorks)) throw new Error("Invalid works data");
        const mergedWorks = mergeWorks(getWorks(), importedWorks);
        saveWorks(mergedWorks);
        refreshVisibleViews({ syncGenres: true });
      } catch {
        alert("가져올 수 없는 JSON 파일입니다.");
      } finally {
        importInput.value = "";
      }
    });
    reader.readAsText(file);
  });
}

function initResponsiveBackupTools() {
  const backupTools = document.querySelector(".backup-tools");
  const libraryTools = document.querySelector(".library-tools");
  const libraryFilter = document.querySelector(".library-filter");

  if (!backupTools || !libraryTools || !libraryFilter) {
    return;
  }

  const backupPlaceholder = document.createComment("backup-tools");
  libraryTools.insertBefore(backupPlaceholder, backupTools);
  const mobileBackupQuery = window.matchMedia("(max-width: 520px)");

  function syncBackupToolsPosition() {
    if (mobileBackupQuery.matches) {
      libraryFilter.appendChild(backupTools);
      return;
    }

    libraryTools.insertBefore(backupTools, backupPlaceholder.nextSibling);
  }

  syncBackupToolsPosition();
  window.addEventListener("resize", syncBackupToolsPosition);
}

function formatExportDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function mergeWorks(currentWorks, importedWorks) {
  const workMap = new Map();
  currentWorks.forEach((work) => workMap.set(Number(work.id), work));
  importedWorks.forEach((work) => {
    const normalizedWork = normalizeImportedWork(work);
    if (normalizedWork) workMap.set(Number(normalizedWork.id), normalizedWork);
  });
  return Array.from(workMap.values());
}

function normalizeDateValue(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeImportedWork(work) {
  if (!work || typeof work !== "object") return null;
  const now = new Date().toISOString();
  const title = String(work.title || "").trim();
  const importedRating = String(work.rating || "").trim();
  const importedGenre = String(work.genre || "").trim();
  const normalizedGenre = importedGenre || defaultGenre;
  const createdAt = normalizeDateValue(work.createdAt, now);
  const updatedAt = normalizeDateValue(work.updatedAt, createdAt);
  if (!title) return null;
  return {
    id: Number(work.id) || Date.now() + Math.floor(Math.random() * 100000),
    title,
    type: validTypes.includes(work.type) && work.type !== "all" ? work.type : "webtoon",
    status: statusText[work.status] ? work.status : "reading",
    genre: normalizedGenre,
    author: String(work.author || "").trim(),
    rating: isValidRating(importedRating) ? importedRating : "",
    progress: String(work.progress || "").trim(),
    tags: normalizeTags(work.tags || ""),
    description: String(work.description || "").trim(),
    memo: String(work.memo || "").trim(),
    createdAt,
    updatedAt,
    lastViewedAt: normalizeDateValue(work.lastViewedAt, createdAt)
  };
}
