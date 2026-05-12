const state = {
  currentPage: getValidQueryParam("page", validPages, "library"),
  currentSearchKeyword: "",
  currentSearchScope: getValidSearchScopeQueryParam(),
  currentFilter: getValidQueryParam("filter", validStatuses, "all"),
  currentTypeFilter: getValidQueryParam("type", validTypes, "all"),
  currentGenreFilter: getValidGenreQueryParam(),
  currentRatingFilter: getValidRatingQueryParam(),
  currentSort: getValidQueryParam("sort", validSorts, "title"),
  currentType: "webtoon",
  currentWorkIndex: 0,
  selectedWorkId: Number(getQueryParam("work")) || null,
  lastFocusedElement: null,
  detailModal: null,
  workFormModal: null,
  workFormMode: "create",
  editingWorkId: null,
  returnDetailWorkId: null
};
