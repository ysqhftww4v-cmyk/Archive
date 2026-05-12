function initMenu() {
  const menuButton = document.querySelector(".menu-button");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  if (!menuButton || !dropdownMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.addEventListener("click", () => {
    const isActive = dropdownMenu.classList.toggle("active");
    setButtonExpanded(menuButton, isActive);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-wrap")) {
      dropdownMenu.classList.remove("active");
      setButtonExpanded(menuButton, false);
    }
  });
}

function initLibraryPageMeta() {
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!libraryGrid) return;
  if (!pageInfo[state.currentPage]) state.currentPage = "library";
  const info = pageInfo[state.currentPage];
  document.title = info.documentTitle;
  const eyebrow = document.querySelector("#libraryEyebrow");
  const title = document.querySelector("#libraryPageTitle");
  const description = document.querySelector("#libraryDescription");
  const searchInput = document.querySelector("#librarySearchInput");
  if (eyebrow) eyebrow.textContent = info.eyebrow;
  if (title) title.textContent = info.title;
  if (description) description.textContent = info.description;
  if (searchInput) searchInput.placeholder = info.placeholder;
}
