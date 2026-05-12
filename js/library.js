function createWorkCard(work) {
  const description = String(work.description || "").trim();
  const progressTag = createProgressTag(work.progress);
  const ratingTag = createRatingTag(work.rating);
  const tags = createWorkTagItems(work.tags);
  const author = work.author || "작가 미입력";
  const titleClass = getTextFitClass(work.title, "library-item-title");
  const authorClass = getTextFitClass(author, "library-item-author");
  const titleHTML = createLibraryTitleHTML(work.title, `<span class="${authorClass}">${escapeHTML(author)}</span>`);

  return `
    <button class="library-item" type="button" data-id="${escapeHTML(work.id)}">
      <div class="library-item-head">
        <h2 class="${titleClass}">${titleHTML}</h2>
      </div>
      <p><span>${description ? escapeHTML(description) : ""}</span></p>
      <div class="library-item-tag-stack">
        <div class="library-item-tags library-item-default-tags">
          <span class="tag">${escapeHTML(typeText[work.type])}</span>
          <span class="tag">${escapeHTML(work.genre)}</span>
          <span class="tag">${escapeHTML(statusText[work.status])}</span>
          ${progressTag}
          ${ratingTag}
        </div>
        ${tags ? `<div class="library-item-tags library-item-custom-tags">${tags}</div>` : ""}
      </div>
    </button>
  `;
}

function createLibraryTitleHTML(title, authorHTML = "") {
  const words = String(title || "").trim().split(/\s+/).filter(Boolean);
  const compactLength = words.join("").length;

  if (words.length < 4 || compactLength < 12) {
    return `${escapeHTML(title)} ${authorHTML}`;
  }

  const targetLength = Math.ceil(compactLength / 2);
  let firstLineLength = 0;
  let splitIndex = 1;

  for (let index = 0; index < words.length - 1; index += 1) {
    firstLineLength += words[index].length;
    splitIndex = index + 1;
    if (firstLineLength >= targetLength) break;
  }

  return `${escapeHTML(words.slice(0, splitIndex).join(" "))} ${authorHTML}<br>${escapeHTML(words.slice(splitIndex).join(" "))}`;
}

function createWorkTagItems(tags) {
  return parseTags(tags)
    .map((tag) => `<span class="tag library-item-user-tag">#${escapeHTML(tag)}</span>`)
    .join("");
}

function createProgressTag(progress) {
  if (!progress) {
    return "";
  }

  return `
    <span class="tag library-item-progress">
      ${escapeHTML(formatProgress(progress))}
    </span>
  `;
}

function createRatingTag(rating) {
  if (!rating) {
    return "";
  }

  return `<span class="library-item-rating">★ ${escapeHTML(rating)}</span>`;
}

function renderWorks(filter = "all") {
  const libraryGrid = document.querySelector("#libraryGrid");

  if (!libraryGrid) {
    return;
  }

  state.currentFilter = filter;

  const works = getVisibleWorks();
  updateLibraryWorkCount(works.length);

  if (works.length === 0) {
    libraryGrid.innerHTML = `
      <div class="empty-message">
        ${escapeHTML(getEmptyMessage())}
      </div>
    `;
    return;
  }

  libraryGrid.innerHTML = works.map(createWorkCard).join("");
  scheduleCustomTagFit(libraryGrid);
}

function updateLibraryWorkCount(count) {
  const libraryWorkCount = document.querySelector("#libraryWorkCount");
  if (!libraryWorkCount) return;

  const filterText = state.currentFilter === "all" ? "전체" : statusText[state.currentFilter];
  libraryWorkCount.textContent = `| ${filterText} ${count}`;
}

function updateLibraryURL() {
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!libraryGrid) return;

  const params = new URLSearchParams();
  params.set("page", state.currentPage);

  if (state.currentFilter !== "all") params.set("filter", state.currentFilter);
  if ((state.currentPage === "library" || state.currentPage === "recent") && state.currentTypeFilter !== "all") {
    params.set("type", state.currentTypeFilter);
  }
  if (state.currentGenreFilter !== "all") params.set("genre", state.currentGenreFilter);
  if (state.currentRatingFilter !== "all") params.set("rating", state.currentRatingFilter);
  if (state.currentSort !== "title") params.set("sort", state.currentSort);

  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}

function scheduleCustomTagFit(scope = document) {
  requestAnimationFrame(() => fitCustomTagsToLine(scope));
}

function fitCustomTagsToLine(scope = document) {
  scope.querySelectorAll(".library-item-custom-tags").forEach((tagRow) => {
    tagRow.querySelectorAll(".library-item-user-tag").forEach((tag) => {
      tag.hidden = false;
    });

    const rowRight = tagRow.getBoundingClientRect().right;
    let hasOverflow = false;

    tagRow.querySelectorAll(".library-item-user-tag").forEach((tag) => {
      const tagRight = tag.getBoundingClientRect().right;

      if (hasOverflow || tagRight > rowRight + 0.5) {
        tag.hidden = true;
        hasOverflow = true;
      }
    });
  });
}

function initLibraryFilters() {
  const libraryGrid = document.querySelector("#libraryGrid");
  const filterButtons = document.querySelectorAll(".filter-button");

  if (!libraryGrid || filterButtons.length === 0) {
    return;
  }

  const initialFilter = state.currentFilter;
  state.currentFilter = initialFilter;

  filterButtons.forEach((button) => {
    const selectedFilter = button.dataset.filter;

    button.classList.toggle("active", selectedFilter === initialFilter);

    button.addEventListener("click", () => {
      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      state.currentFilter = selectedFilter;
      renderWorks(state.currentFilter);
      updateLibraryURL();
    });
  });

  renderWorks(initialFilter);
  window.addEventListener("resize", () => scheduleCustomTagFit(libraryGrid));
}

function syncGenreFilterOptions() {
  const genreFilter = document.querySelector("#genreFilter");

  if (!genreFilter) {
    return;
  }

  const availableGenres = getAvailableGenres();
  const selectedGenre = availableGenres.includes(state.currentGenreFilter)
    ? state.currentGenreFilter
    : "all";

  genreFilter.innerHTML = `
    <option value="all">전체 장르</option>
    ${availableGenres.map((genre) => `<option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>`).join("")}
  `;
  genreFilter.value = selectedGenre;
  state.currentGenreFilter = selectedGenre;
}

function initLibraryTools() {
  const libraryGrid = document.querySelector("#libraryGrid");
  const toolControls = [
    { element: document.querySelector("#typeFilter"), stateKey: "currentTypeFilter" },
    { element: document.querySelector("#genreFilter"), stateKey: "currentGenreFilter" },
    { element: document.querySelector("#ratingFilter"), stateKey: "currentRatingFilter" },
    { element: document.querySelector("#sortSelect"), stateKey: "currentSort" }
  ];
  const typeFilterGroup = document.querySelector(".type-filter-group");

  if (!libraryGrid) {
    return;
  }

  if (typeFilterGroup) {
    typeFilterGroup.hidden = !(state.currentPage === "library" || state.currentPage === "recent");
  }

  syncGenreFilterOptions();

  toolControls.forEach(({ element, stateKey }) => {
    if (!element) return;
    element.value = state[stateKey];
    element.addEventListener("change", () => {
      state[stateKey] = element.value;
      renderWorks(state.currentFilter);
      updateLibraryURL();
    });
  });
}

function createGenreOptions(selectedGenre = "") {
  return sortTextNaturally(genres)
    .map((genre) => {
      const selected = genre === selectedGenre ? " selected" : "";
      return `<option value="${escapeHTML(genre)}"${selected}>${escapeHTML(genre)}</option>`;
    })
    .join("") + `<option value="custom"${selectedGenre === "custom" ? " selected" : ""}>직접입력</option>`;
}

function createRatingOptions(selectedRating = "") {
  return Array.from({ length: 5 }, (_, index) => String(5 - index))
    .map((rating) => {
      const selected = rating === String(selectedRating) ? " selected" : "";
      return `<option value="${rating}"${selected}>${rating}점</option>`;
    })
    .join("");
}
