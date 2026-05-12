function initKeyboardControls() {
  document.addEventListener("keydown", (event) => {
    const activeModal = document.querySelector(".work-modal.active");
    const activeConfirmBox = document.querySelector(".delete-confirm-box.active");
    if (activeModal && event.key === "Tab") {
      keepFocusInModal(event, activeConfirmBox || activeModal);
      return;
    }
    if (event.key !== "Escape") return;
    const activeMenu = document.querySelector(".dropdown-menu.active");
    if (activeConfirmBox) {
      activeConfirmBox.classList.remove("active");
      document.querySelector(".detail-delete-button")?.focus();
      return;
    }
    if (activeModal) {
      if (activeModal.classList.contains("detail-modal")) closeDetailModal();
      else closeWorkFormModal();
    }
    if (activeMenu) {
      activeMenu.classList.remove("active");
      setButtonExpanded(document.querySelector(".menu-button"), false);
    }
  });
}

function initStorageSync() {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    worksCache = null;
    if (typeof renderWorks === "function") renderWorks(state.currentFilter);
    if (typeof renderMainPreview === "function") renderMainPreview(state.currentType);
  });
}

function initSelectedWorkFromQuery() {
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!libraryGrid || !state.selectedWorkId) return;
  const selectedWork = getWorkById(state.selectedWorkId);
  if (!selectedWork) return;
  renderWorks(state.currentFilter);
  openDetailModal(selectedWork.id);
}

function initApp() {
  initStorageSync();
  if (typeof initMenu === "function") initMenu();
  if (typeof initLibraryPageMeta === "function") initLibraryPageMeta();
  if (typeof initSearch === "function") initSearch();
  if (typeof initLibraryFilters === "function") initLibraryFilters();
  if (typeof initLibraryTools === "function") initLibraryTools();
  if (typeof initLibraryCardClick === "function") initLibraryCardClick();
  if (typeof initAddWorkModal === "function") initAddWorkModal();
  if (typeof initBackupTools === "function") initBackupTools();
  if (typeof initMainPreview === "function") initMainPreview();
  if (typeof initMainSearchResultClick === "function") initMainSearchResultClick();
  initKeyboardControls();
  initSelectedWorkFromQuery();
}

initApp();
