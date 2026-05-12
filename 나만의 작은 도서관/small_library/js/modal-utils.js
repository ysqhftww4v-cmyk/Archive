function focusModal(modal) {
  const focusable = modal.querySelector("button, input, select, textarea, a");
  if (focusable) focusable.focus();
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")).filter((element) => element.offsetParent !== null);
}

function keepFocusInModal(event, modal) {
  if (event.key !== "Tab") return;
  const focusableElements = getFocusableElements(modal);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (!firstElement || !lastElement) {
    event.preventDefault();
    return;
  }
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }
  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function updateModalScrollbar(modal, scrollContainerSelector, options = {}) {
  if (!modal?.classList.contains("active")) return;
  const modalBox = modal.querySelector(scrollContainerSelector);
  const scrollbar = modal.querySelector(".custom-modal-scrollbar");
  const thumb = modal.querySelector(".custom-modal-scrollbar-thumb");
  if (!modalBox || !scrollbar || !thumb) return;
  const boxRect = modalBox.getBoundingClientRect();
  const styles = getComputedStyle(modalBox);
  const modalPadding = parseFloat(styles.getPropertyValue("--form-modal-padding")) || 0;
  const scrollbarWidth = parseFloat(getComputedStyle(scrollbar).width) || 4;
  const trackHeight = Math.max(boxRect.height - modalPadding * 2, 0);
  syncCustomScrollbar(modalBox, scrollbar, thumb, {
    show: options.show === true,
    trackHeight,
    updateTrack(track) {
      track.style.left = `${boxRect.right - modalPadding / 2 - scrollbarWidth / 2}px`;
      track.style.top = `${boxRect.top + modalPadding}px`;
      track.style.height = `${trackHeight}px`;
    }
  });
}

function updateWorkFormScrollbar() {
  updateModalScrollbar(state.workFormModal, ".work-modal-box");
}

function showWorkFormScrollbar() {
  updateModalScrollbar(state.workFormModal, ".work-modal-box", { show: true });
}

function updateDetailScrollbar() {
  updateModalScrollbar(state.detailModal, ".detail-modal-box");
}

function showDetailScrollbar() {
  updateModalScrollbar(state.detailModal, ".detail-modal-box", { show: true });
}
