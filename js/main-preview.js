function renderMainPreview(type) {
  const previewTypeSelect = document.querySelector("#previewTypeSelect");
  const readingCount = document.querySelector("#readingCount");
  const completedCount = document.querySelector("#completedCount");
  const pausedCount = document.querySelector("#pausedCount");
  const contentTag = document.querySelector("#contentTag");
  const contentRating = document.querySelector("#contentRating");
  const contentTitle = document.querySelector("#contentTitle");
  const contentAuthor = document.querySelector("#contentAuthor");
  const contentDescription = document.querySelector("#contentDescription");
  const prevWorkButton = document.querySelector(".prev-work-button");
  const nextWorkButton = document.querySelector(".next-work-button");

  if (!previewTypeSelect || !readingCount || !completedCount || !pausedCount || !contentTag || !contentRating || !contentTitle || !contentAuthor || !contentDescription) return;

  const works = getTypeWorks(type);
  const counts = getStatusCounts(works);
  previewTypeSelect.value = type;
  syncPreviewTypeWidth(previewTypeSelect);
  readingCount.textContent = counts.reading;
  completedCount.textContent = counts.completed;
  pausedCount.textContent = counts.paused;
  readingCount.closest(".stat-item").dataset.status = "reading";
  completedCount.closest(".stat-item").dataset.status = "completed";
  pausedCount.closest(".stat-item").dataset.status = "paused";

  if (state.currentWorkIndex >= works.length) state.currentWorkIndex = 0;
  if (state.currentWorkIndex < 0) state.currentWorkIndex = works.length - 1;

  if (works.length === 0) {
    contentTag.textContent = "";
    contentRating.textContent = "";
    contentTitle.textContent = "등록된 작품이 없습니다.";
    contentAuthor.textContent = "";
    contentDescription.textContent = "작품을 추가하면 이곳에 표시됩니다.";
    setTextFitClass(contentTitle, contentTitle.textContent, "preview-work-title");
    contentAuthor.className = "novel-card-author";
    if (prevWorkButton) prevWorkButton.disabled = true;
    if (nextWorkButton) nextWorkButton.disabled = true;
    return;
  }

  const currentWork = works[state.currentWorkIndex];
  contentTag.textContent = "";
  contentRating.textContent = currentWork.rating ? `★ ${currentWork.rating}` : "";
  contentTitle.textContent = currentWork.title;
  contentAuthor.textContent = currentWork.author || "작가 미입력";
  contentDescription.textContent = currentWork.description || "";
  setTextFitClass(contentTitle, currentWork.title, "preview-work-title");
  setTextFitClass(contentAuthor, currentWork.author || "작가 미입력", "novel-card-author");
  if (prevWorkButton) prevWorkButton.disabled = works.length <= 1;
  if (nextWorkButton) nextWorkButton.disabled = works.length <= 1;
}

function syncPreviewTypeWidth(previewTypeSelect) {
  const typeWidths = {
    webtoon: "92px",
    webnovel: "120px",
    manga: "78px",
    anime: "78px"
  };
  previewTypeSelect.style.setProperty("--preview-type-width", typeWidths[previewTypeSelect.value] || "92px");
}

function movePreviewWork(direction) {
  const works = getTypeWorks(state.currentType);
  if (works.length <= 1) return;

  const lastIndex = works.length - 1;
  state.currentWorkIndex = direction === "prev"
    ? (state.currentWorkIndex === 0 ? lastIndex : state.currentWorkIndex - 1)
    : (state.currentWorkIndex === lastIndex ? 0 : state.currentWorkIndex + 1);
  renderMainPreview(state.currentType);
}

function initMainPreview() {
  const previewTypeSelect = document.querySelector("#previewTypeSelect");
  const prevWorkButton = document.querySelector(".prev-work-button");
  const nextWorkButton = document.querySelector(".next-work-button");
  const previewWorkCard = document.querySelector(".novel-card");
  const statItems = document.querySelectorAll(".stat-item");
  renderMainPreview(state.currentType);

  if (previewTypeSelect) {
    previewTypeSelect.value = state.currentType;
    syncPreviewTypeWidth(previewTypeSelect);
    previewTypeSelect.addEventListener("change", () => {
      state.currentType = previewTypeSelect.value;
      syncPreviewTypeWidth(previewTypeSelect);
      state.currentWorkIndex = 0;
      renderMainPreview(state.currentType);
    });
  }

  if (prevWorkButton) {
    prevWorkButton.addEventListener("click", () => movePreviewWork("prev"));
  }

  if (nextWorkButton) {
    nextWorkButton.addEventListener("click", () => movePreviewWork("next"));
  }

  if (previewWorkCard) {
    previewWorkCard.addEventListener("click", () => {
      const works = getTypeWorks(state.currentType);
      const currentWork = works[state.currentWorkIndex];
      if (currentWork) location.href = `library.html?page=${currentWork.type}&work=${currentWork.id}`;
    });
  }

  statItems.forEach((item) => {
    item.addEventListener("click", () => {
      const status = item.dataset.status;
      if (status) location.href = `library.html?page=${state.currentType}&filter=${status}`;
    });
  });
}
