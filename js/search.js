function createSearchResultBox() {
  const searchBox = document.querySelector(".search-box");
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!searchBox || libraryGrid) return null;
  const resultBox = document.createElement("div");
  resultBox.className = "search-result-box";
  searchBox.appendChild(resultBox);
  return resultBox;
}

const searchResultBox = createSearchResultBox();
const searchPlaceholderText = {
  title: "제목을 검색하세요.",
  author: "작가를 검색하세요.",
  tags: "태그를 검색하세요.",
  memo: "메모를 검색하세요.",
  description: "작품소개를 검색하세요."
};
const searchScopeWidths = {
  page: "106px",
  all: "64px",
  title: "64px",
  author: "64px",
  tags: "64px",
  memo: "64px",
  description: "64px"
};

function renderMainSearchResults(keyword) {
  if (!searchResultBox) return;
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    searchResultBox.classList.remove("active", "empty");
    searchResultBox.innerHTML = "";
    return;
  }
  const matchedWorks = filterWorksByKeyword(getWorks(), trimmedKeyword, state.currentSearchScope);
  searchResultBox.classList.add("active");
  searchResultBox.classList.toggle("empty", matchedWorks.length === 0);
  if (matchedWorks.length === 0) {
    searchResultBox.innerHTML = `<div class="search-empty-message">'${escapeHTML(trimmedKeyword)}'에 대한 검색 결과가 없습니다.</div>`;
    return;
  }
  searchResultBox.innerHTML = `
    <div class="search-result-list">
      ${matchedWorks.map((work) => `
        <button class="search-result-item" type="button" data-id="${escapeHTML(work.id)}">
          <strong>${highlightSearchField(work.title, trimmedKeyword, "title")}</strong>
          <span>${highlightSearchField(work.author || "작가 미입력", trimmedKeyword, "author", { allowShortcutHighlight: false })} · ${escapeHTML(typeText[work.type])} · ${escapeHTML(work.genre)} · ${escapeHTML(statusText[work.status])}</span>
        </button>
      `).join("")}
    </div>
    <div class="custom-search-scrollbar" aria-hidden="true"><div class="custom-search-scrollbar-thumb"></div></div>
  `;
  bindSearchResultScrollbar();
}

function highlightSearchField(value, keyword, field, options = {}) {
  const scope = state.currentSearchScope;
  const shouldHighlight = scope === "all" || scope === "page" || scope === field;
  return shouldHighlight ? highlightKeyword(value, keyword, options) : escapeHTML(value);
}

function getSearchPlaceholder(scope, isLibraryPage) {
  if (searchPlaceholderText[scope]) return searchPlaceholderText[scope];
  if (isLibraryPage) return `${pageInfo[state.currentPage]?.title || "현재 페이지"}에서 검색하세요.`;
  return "검색어를 입력하세요";
}

function syncSearchPlaceholder(searchInput, isLibraryPage) {
  searchInput.placeholder = getSearchPlaceholder(state.currentSearchScope, isLibraryPage);
}

function syncSearchScopeWidth(searchScopeSelect) {
  searchScopeSelect.style.setProperty("--search-scope-width", searchScopeWidths[state.currentSearchScope] || searchScopeWidths.all);
}

function syncSearchScopeControl(searchInput, searchScopeSelect, isLibraryPage) {
  searchScopeSelect.value = state.currentSearchScope;
  syncSearchPlaceholder(searchInput, isLibraryPage);
  syncSearchScopeWidth(searchScopeSelect);
}

function bindSearchResultScrollbar() {
  if (!searchResultBox) return;
  const resultList = searchResultBox.querySelector(".search-result-list");
  if (!resultList) return;
  resultList.addEventListener("scroll", () => updateSearchResultScrollbar({ show: true }));
  requestAnimationFrame(updateSearchResultScrollbar);
}

function updateSearchResultScrollbar(options = {}) {
  if (!searchResultBox?.classList.contains("active")) return;
  const resultList = searchResultBox.querySelector(".search-result-list");
  const scrollbar = searchResultBox.querySelector(".custom-search-scrollbar");
  const thumb = searchResultBox.querySelector(".custom-search-scrollbar-thumb");
  if (!resultList || !scrollbar || !thumb) return;
  syncCustomScrollbar(resultList, scrollbar, thumb, { show: options.show === true });
}

function initSearch() {
  const searchBox = document.querySelector(".search-box");
  const searchInput = document.querySelector(".search-box input");
  const searchScopeSelect = document.querySelector("#searchScopeSelect");
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!searchBox || !searchInput) return;
  function handleSearch() {
    state.currentSearchKeyword = normalizeKeyword(searchInput.value);
    if (libraryGrid) {
      renderWorks(state.currentFilter);
      return;
    }
    renderMainSearchResults(searchInput.value);
  }
  searchBox.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSearch();
  });
  if (searchScopeSelect) {
    const isLibraryPage = Boolean(libraryGrid);
    syncSearchScopeControl(searchInput, searchScopeSelect, isLibraryPage);
    searchScopeSelect.addEventListener("change", () => {
      state.currentSearchScope = searchScopeSelect.value;
      syncSearchScopeControl(searchInput, searchScopeSelect, isLibraryPage);
      handleSearch();
    });
  }
  searchInput.addEventListener("input", handleSearch);
}

function initMainSearchResultClick() {
  if (!searchResultBox) return;
  searchResultBox.addEventListener("click", (event) => {
    const selectedItem = event.target.closest(".search-result-item");
    if (!selectedItem) return;
    const selectedWork = getWorkById(selectedItem.dataset.id);
    if (selectedWork) location.href = `library.html?page=${selectedWork.type}&work=${selectedWork.id}`;
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-box")) searchResultBox.classList.remove("active", "empty");
  });
}
