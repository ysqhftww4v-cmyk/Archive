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
    const previousIndex = (mainBannerState.currentIndex - 1 + slides.length) % slides.length;
    const nextIndex = (mainBannerState.currentIndex + 1) % slides.length;

    slide.classList.remove("prev", "active", "next");
    slide.classList.toggle("active", isActive);
    slide.classList.toggle("prev", slides.length > 1 && slideIndex === previousIndex);
    slide.classList.toggle("next", slides.length > 1 && slideIndex === nextIndex);
    slide.setAttribute("aria-hidden", String(!isActive));
    slide.querySelectorAll("a, button").forEach((element) => {
      element.tabIndex = isActive ? 0 : -1;
    });
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

function moveMainBanner(direction) {
  const nextIndex = direction === "prev"
    ? mainBannerState.currentIndex - 1
    : mainBannerState.currentIndex + 1;

  renderMainBanner(nextIndex);
  startMainBannerAutoPlay();
}

function initMainBanner() {
  const banner = document.querySelector(".main-banner");
  const slides = getMainBannerSlides();
  const dotsContainer = document.querySelector(".main-banner-dots");
  const prevButton = document.querySelector(".prev-banner-button");
  const nextButton = document.querySelector(".next-banner-button");

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

  if (prevButton) {
    prevButton.addEventListener("click", () => moveMainBanner("prev"));
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => moveMainBanner("next"));
  }

  banner.addEventListener("mouseenter", stopMainBannerAutoPlay);
  banner.addEventListener("mouseleave", startMainBannerAutoPlay);
  banner.addEventListener("focusin", stopMainBannerAutoPlay);
  banner.addEventListener("focusout", startMainBannerAutoPlay);

  renderMainBanner(0);
  startMainBannerAutoPlay();
}
