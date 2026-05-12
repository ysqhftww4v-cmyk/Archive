function createDetailModal() {
  const modal = document.createElement("div");
  modal.className = "work-modal detail-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "detailModalTitle");
  modal.innerHTML = `
    <div class="work-modal-box detail-modal-box">
      <div class="work-modal-head">
        <h2 id="detailModalTitle"></h2>
        <button class="modal-close-button" type="button" aria-label="닫기">
          <img src="../image/close.svg" alt="" aria-hidden="true" />
        </button>
      </div>
      <div class="detail-body"></div>
      <div class="detail-nav">
        <button class="detail-prev-button" type="button">이전 작품</button>
        <button class="detail-next-button" type="button">다음 작품</button>
      </div>
      <div class="detail-actions">
        <button class="detail-delete-button" type="button">삭제하기</button>
        <button class="button-primary detail-edit-button" type="button">수정하기</button>
      </div>
      <div class="delete-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="deleteConfirmTitle">
        <div class="delete-confirm-panel">
          <h3 id="deleteConfirmTitle">작품 삭제</h3>
          <p>이 작품을 삭제할까요?</p>
          <div>
            <button class="delete-cancel-button" type="button">취소</button>
            <button class="delete-confirm-button" type="button">삭제하기</button>
          </div>
        </div>
      </div>
    </div>
    <div class="custom-modal-scrollbar" aria-hidden="true">
      <div class="custom-modal-scrollbar-thumb"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function closeDetailModal() {
  if (!state.detailModal) return;
  state.detailModal.classList.remove("active");
  if (state.lastFocusedElement) state.lastFocusedElement.focus();
}

function renderDetailModal(work) {
  const title = state.detailModal.querySelector("#detailModalTitle");
  const body = state.detailModal.querySelector(".detail-body");
  const confirmBox = state.detailModal.querySelector(".delete-confirm-box");
  const prevButton = state.detailModal.querySelector(".detail-prev-button");
  const nextButton = state.detailModal.querySelector(".detail-next-button");
  title.innerHTML = `<span>${escapeHTML(work.title)}</span><small>${escapeHTML(work.author || "작가 미입력")}</small>`;
  if (confirmBox) confirmBox.classList.remove("active");
  body.innerHTML = `
    <div class="detail-meta">
      <span>${escapeHTML(typeText[work.type])}</span>
      <span>${escapeHTML(work.genre)}</span>
      <span>${escapeHTML(statusText[work.status])}</span>
      ${parseTags(work.tags).map((tag) => `<span>#${escapeHTML(tag)}</span>`).join("")}
      ${work.rating ? `<span>★ ${escapeHTML(work.rating)}</span>` : ""}
    </div>
    <dl class="detail-list">
      <div><dt>최근 수정</dt><dd>${escapeHTML(formatDate(getWorkActivityDate(work)))}</dd></div>
      <div><dt>현재 회차</dt><dd>${escapeHTML(formatProgress(work.progress) || "미입력")}</dd></div>
      <div class="full"><dt>태그</dt><dd>${escapeHTML(parseTags(work.tags).map((tag) => `#${tag}`).join(" ") || "태그 없음")}</dd></div>
      <div class="full"><dt>작품소개</dt><dd>${escapeHTML(work.description || "작품소개 없음")}</dd></div>
      <div class="full"><dt>개인 메모</dt><dd>${escapeHTML(work.memo || "메모 없음")}</dd></div>
    </dl>
  `;
  const visibleWorks = getVisibleWorks();
  const currentIndex = visibleWorks.findIndex((item) => Number(item.id) === Number(work.id));
  const canMove = visibleWorks.length > 1 && currentIndex !== -1;
  if (prevButton) prevButton.disabled = !canMove;
  if (nextButton) nextButton.disabled = !canMove;
  requestAnimationFrame(updateDetailScrollbar);
}

function moveDetailWork(direction) {
  const currentId = Number(state.detailModal?.dataset.id);
  const visibleWorks = getVisibleWorks();
  const currentIndex = visibleWorks.findIndex((work) => Number(work.id) === currentId);
  if (visibleWorks.length <= 1 || currentIndex === -1) return;
  const nextIndex = direction === "prev" ? (currentIndex - 1 + visibleWorks.length) % visibleWorks.length : (currentIndex + 1) % visibleWorks.length;
  openDetailModal(visibleWorks[nextIndex].id);
}

function openDetailModal(workId) {
  if (!state.detailModal) {
    state.detailModal = createDetailModal();
    bindDetailModalEvents();
  }
  const work = getWorkById(workId);
  if (!work) return;
  state.selectedWorkId = Number(work.id);
  state.lastFocusedElement = document.activeElement;
  renderDetailModal(work);
  state.detailModal.dataset.id = String(work.id);
  state.detailModal.classList.add("active");
  focusModal(state.detailModal);
  requestAnimationFrame(updateDetailScrollbar);
  renderWorks(state.currentFilter);
  if (typeof renderMainPreview === "function") renderMainPreview(state.currentType);
}

function deleteWork(workId) {
  const nextWorks = getWorks().filter((work) => Number(work.id) !== Number(workId));
  saveWorks(nextWorks);
  syncGenreFilterOptions();
  state.selectedWorkId = null;
  closeDetailModal();
  renderWorks(state.currentFilter);
  if (typeof renderMainPreview === "function") renderMainPreview(state.currentType);
}

function bindDetailModalEvents() {
  const closeButton = state.detailModal.querySelector(".modal-close-button");
  const editButton = state.detailModal.querySelector(".detail-edit-button");
  const deleteButton = state.detailModal.querySelector(".detail-delete-button");
  const prevButton = state.detailModal.querySelector(".detail-prev-button");
  const nextButton = state.detailModal.querySelector(".detail-next-button");
  const modalBox = state.detailModal.querySelector(".detail-modal-box");
  const confirmBox = state.detailModal.querySelector(".delete-confirm-box");
  const cancelDeleteButton = state.detailModal.querySelector(".delete-cancel-button");
  const confirmDeleteButton = state.detailModal.querySelector(".delete-confirm-button");
  closeButton.addEventListener("click", closeDetailModal);
  modalBox.addEventListener("scroll", showDetailScrollbar);
  window.addEventListener("resize", updateDetailScrollbar);
  prevButton.addEventListener("click", () => moveDetailWork("prev"));
  nextButton.addEventListener("click", () => moveDetailWork("next"));
  state.detailModal.addEventListener("click", (event) => {
    if (event.target === state.detailModal) closeDetailModal();
  });
  editButton.addEventListener("click", () => {
    const work = getWorkById(state.detailModal.dataset.id);
    if (!work) return;
    closeDetailModal();
    state.returnDetailWorkId = work.id;
    openWorkFormModal("edit", work);
  });
  deleteButton.addEventListener("click", () => {
    confirmBox.classList.add("active");
    confirmDeleteButton.focus();
  });
  confirmBox.addEventListener("click", (event) => {
    if (event.target === confirmBox) {
      confirmBox.classList.remove("active");
      deleteButton.focus();
    }
  });
  cancelDeleteButton.addEventListener("click", () => {
    confirmBox.classList.remove("active");
    deleteButton.focus();
  });
  confirmDeleteButton.addEventListener("click", () => {
    const work = getWorkById(state.detailModal.dataset.id);
    if (work) deleteWork(work.id);
  });
}

function initLibraryCardClick() {
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!libraryGrid) return;
  libraryGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".library-item");
    if (card) openDetailModal(card.dataset.id);
  });
}
