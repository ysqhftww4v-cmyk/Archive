function renderMainPreview(type) {
  const previewTypeSelect = document.querySelector("#previewTypeSelect");
  const readingCount = document.querySelector("#readingCount");
  const completedCount = document.querySelector("#completedCount");
  const pausedCount = document.querySelector("#pausedCount");
  const contentRating = document.querySelector("#contentRating");
  const contentTitle = document.querySelector("#contentTitle");
  const contentAuthor = document.querySelector("#contentAuthor");
  const contentDescription = document.querySelector("#contentDescription");
  const prevWorkButton = document.querySelector(".prev-work-button");
  const nextWorkButton = document.querySelector(".next-work-button");

  if (!previewTypeSelect || !readingCount || !completedCount || !pausedCount || !contentRating || !contentTitle || !contentAuthor || !contentDescription) return;

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
  initMainBanner();
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

const mainBannerState = {
  currentIndex: 0,
  timerId: null,
  interval: 5000
};

function getMainBannerSlides() {
  return Array.from(document.querySelectorAll(".main-banner-slide"));
}

function renderMainBanner(index) {
  const slides = getMainBannerSlides();
  const dots = Array.from(document.querySelectorAll(".main-banner-dot"));

  if (slides.length === 0) {
    return;
  }

  mainBannerState.currentIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === mainBannerState.currentIndex;

    slide.classList.toggle("active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === mainBannerState.currentIndex;
    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function stopMainBannerAutoPlay() {
  if (!mainBannerState.timerId) {
    return;
  }

  clearInterval(mainBannerState.timerId);
  mainBannerState.timerId = null;
}

function startMainBannerAutoPlay() {
  const slides = getMainBannerSlides();

  stopMainBannerAutoPlay();
  if (slides.length <= 1) {
    return;
  }

  mainBannerState.timerId = setInterval(() => {
    renderMainBanner(mainBannerState.currentIndex + 1);
  }, mainBannerState.interval);
}

function initMainBanner() {
  const banner = document.querySelector(".main-banner");
  const slides = getMainBannerSlides();
  const dotsContainer = document.querySelector(".main-banner-dots");

  if (!banner || slides.length === 0 || !dotsContainer) {
    return;
  }

  dotsContainer.innerHTML = slides.map((_, index) => `
    <button class="main-banner-dot" type="button" aria-label="${index + 1}번째 배너 보기"></button>
  `).join("");

  dotsContainer.querySelectorAll(".main-banner-dot").forEach((dot, index) => {
    dot.addEventListener("click", () => {
      renderMainBanner(index);
      startMainBannerAutoPlay();
    });
  });

  banner.addEventListener("mouseenter", stopMainBannerAutoPlay);
  banner.addEventListener("mouseleave", startMainBannerAutoPlay);
  banner.addEventListener("focusin", stopMainBannerAutoPlay);
  banner.addEventListener("focusout", startMainBannerAutoPlay);

  renderMainBanner(0);
  startMainBannerAutoPlay();
}
