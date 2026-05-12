function createWorkFormModal() {
  const modal = document.createElement("div");

  modal.className = "work-modal work-form-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "workFormTitle");
  modal.innerHTML = `
    <div class="work-modal-box">
      <div class="work-modal-head">
        <h2 id="workFormTitle">작품 추가하기</h2>
        <button class="modal-close-button" type="button" aria-label="닫기">
          <img src="../image/close.svg" alt="" aria-hidden="true" />
        </button>
      </div>

      <form class="work-form">
        <label class="form-half">
          구분
          <select name="type" required>
            <option value="">구분 선택</option>
            <option value="webtoon">웹툰</option>
            <option value="webnovel">웹소설</option>
            <option value="manga">만화</option>
            <option value="anime">애니</option>
          </select>
        </label>

        <label class="form-half">
          장르
          <select name="genre" required>
            <option value="">장르 선택</option>
            ${createGenreOptions()}
          </select>
          <input class="custom-genre-input" name="customGenre" type="text" placeholder="장르 입력" hidden disabled />
        </label>

        <label class="full">
          작품명
          <input name="title" type="text" required />
          <span class="field-message title-message" aria-live="polite"></span>
        </label>

        <label class="full">
          작가
          <input name="author" type="text" />
        </label>

        <label class="form-half">
          상태
          <select name="status" required>
            <option value="">상태 선택</option>
            <option value="completed">완독</option>
            <option value="paused">보류</option>
            <option value="dropped">하차</option>
            <option value="reading">읽는 중</option>
          </select>
        </label>

        <label class="form-half">
          평점
          <select name="rating">
            <option value="">평점 선택</option>
            ${createRatingOptions()}
          </select>
        </label>

        <label class="full">
          현재 회차
          <input name="progress" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="예: 675" />
          <span class="field-message progress-message" aria-live="polite"></span>
        </label>

        <label class="full">
          태그
          <input name="tags" type="text" placeholder="예: #헌터 #게이트 또는 헌터, 게이트" />
        </label>

        <label class="full">
          작품소개
          <textarea name="description" rows="3"></textarea>
        </label>

        <label class="full">
          개인 메모
          <textarea name="memo" rows="3"></textarea>
        </label>

        <button class="button-primary full" type="submit">등록하기</button>
      </form>
    </div>
    <div class="custom-modal-scrollbar" aria-hidden="true">
      <div class="custom-modal-scrollbar-thumb"></div>
    </div>
  `;

  document.body.appendChild(modal);

  return modal;
}

function closeWorkFormModal(options = {}) {
  if (!state.workFormModal) {
    return;
  }

  const workForm = state.workFormModal.querySelector(".work-form");
  const shouldRestoreDetail = options.restoreDetail !== false;
  const returnDetailWorkId = state.returnDetailWorkId;

  state.workFormModal.classList.remove("active");
  workForm.reset();
  resetWorkFormValidation(workForm);
  state.workFormMode = "create";
  state.editingWorkId = null;
  state.returnDetailWorkId = null;

  if (shouldRestoreDetail && returnDetailWorkId) {
    openDetailModal(returnDetailWorkId);
    return;
  }

  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
  }
}

function openWorkFormModal(mode = "create", work = null) {
  if (!state.workFormModal) {
    state.workFormModal = createWorkFormModal();
    bindWorkFormModalEvents();
  }

  const modalTitle = state.workFormModal.querySelector("#workFormTitle");
  const submitButton = state.workFormModal.querySelector(".work-form .button-primary");
  const form = state.workFormModal.querySelector(".work-form");

  state.lastFocusedElement = document.activeElement;
  state.workFormMode = mode;
  state.editingWorkId = work ? Number(work.id) : null;

  modalTitle.textContent = mode === "edit" ? "작품 수정하기" : "작품 추가하기";
  submitButton.textContent = mode === "edit" ? "수정하기" : "등록하기";
  form.reset();
  resetWorkFormValidation(form);

  if (work) {
    form.elements.type.value = work.type;
    if (genres.includes(work.genre)) {
      form.elements.genre.value = work.genre;
    } else {
      form.elements.genre.value = "custom";
      form.elements.customGenre.value = work.genre || "";
    }
    form.elements.title.value = work.title;
    form.elements.author.value = work.author || "";
    form.elements.status.value = work.status;
    form.elements.rating.value = work.rating || "";
    form.elements.progress.value = work.progress || "";
    form.elements.tags.value = work.tags || "";
    form.elements.description.value = work.description;
    form.elements.memo.value = work.memo || "";
  }

  state.workFormModal.classList.add("active");
  updateCustomGenreInput(form);
  requestAnimationFrame(() => {
    updateWorkFormScrollbar();
  });
  focusModal(state.workFormModal);
}

function setFieldMessage(input, messageElement, message) {
  if (!input || !messageElement) {
    return;
  }

  input.classList.toggle("invalid", Boolean(message));
  input.setCustomValidity(message);
  messageElement.textContent = message;
}

function normalizeTitle(value) {
  return compactKeyword(value);
}

function isDuplicateWorkTitle(type, title) {
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedTitle) {
    return false;
  }

  return getWorks().some((work) => {
    return (
      work.type === type &&
      Number(work.id) !== Number(state.editingWorkId) &&
      normalizeTitle(work.title) === normalizedTitle
    );
  });
}

function validateWorkTitle(form) {
  const titleInput = form.elements.title;
  const titleMessage = form.querySelector(".title-message");
  const isDuplicate = isDuplicateWorkTitle(form.elements.type.value, titleInput.value);
  const message = isDuplicate ? "같은 구분에 이미 등록된 작품입니다." : "";

  setFieldMessage(titleInput, titleMessage, message);
  return !message;
}

function validateProgress(form) {
  const progressInput = form.elements.progress;
  const progressMessage = form.querySelector(".progress-message");
  const hasInvalidValue = /\D/.test(progressInput.value);
  const message = hasInvalidValue ? "숫자만 입력하세요." : "";

  setFieldMessage(progressInput, progressMessage, message);
  return !message;
}

function updateCustomGenreInput(form) {
  const genreSelect = form.elements.genre;
  const customGenreInput = form.elements.customGenre;
  const isCustom = genreSelect.value === "custom";

  genreSelect.hidden = isCustom;
  genreSelect.disabled = isCustom;
  genreSelect.required = !isCustom;
  customGenreInput.hidden = !isCustom;
  customGenreInput.disabled = !isCustom;
  customGenreInput.required = isCustom;

  if (!isCustom) {
    customGenreInput.value = "";
  } else {
    customGenreInput.focus();
  }
}

function resetWorkFormValidation(form) {
  form.querySelectorAll(".field-message").forEach((message) => {
    message.textContent = "";
  });

  form.querySelectorAll(".invalid").forEach((input) => {
    input.classList.remove("invalid");
    input.setCustomValidity("");
  });

  updateCustomGenreInput(form);
}

function validateWorkForm(form) {
  updateCustomGenreInput(form);
  const isTitleValid = validateWorkTitle(form);
  const isProgressValid = validateProgress(form);

  if (!form.reportValidity()) {
    return false;
  }

  return isTitleValid && isProgressValid;
}

function bindWorkFormModalEvents() {
  const closeModalButton = state.workFormModal.querySelector(".modal-close-button");
  const modalBox = state.workFormModal.querySelector(".work-modal-box");
  const workForm = state.workFormModal.querySelector(".work-form");
  const typeSelect = workForm.elements.type;
  const genreSelect = workForm.elements.genre;
  const titleInput = workForm.elements.title;
  const progressInput = workForm.elements.progress;

  closeModalButton.addEventListener("click", closeWorkFormModal);
  modalBox.addEventListener("scroll", showWorkFormScrollbar);
  window.addEventListener("resize", updateWorkFormScrollbar);

  state.workFormModal.addEventListener("click", (event) => {
    if (event.target === state.workFormModal) {
      closeWorkFormModal();
    }
  });

  typeSelect.addEventListener("change", () => {
    validateWorkTitle(workForm);
  });

  genreSelect.addEventListener("change", () => {
    updateCustomGenreInput(workForm);
  });

  workForm.elements.customGenre.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    workForm.elements.genre.disabled = false;
    workForm.elements.genre.value = "";
    updateCustomGenreInput(workForm);
    workForm.elements.genre.focus();
  });

  titleInput.addEventListener("input", () => {
    validateWorkTitle(workForm);
  });

  progressInput.addEventListener("input", () => {
    const sanitizedValue = progressInput.value.replace(/\D/g, "");
    const hasInvalidValue = sanitizedValue !== progressInput.value;

    progressInput.value = sanitizedValue;
    setFieldMessage(
      progressInput,
      workForm.querySelector(".progress-message"),
      hasInvalidValue ? "숫자만 입력하세요." : ""
    );
  });

  workForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateWorkForm(workForm)) {
      return;
    }

    const formData = new FormData(workForm);
    const works = getWorks();
    const now = new Date().toISOString();
    const selectedGenre = workForm.elements.customGenre.hidden
      ? String(formData.get("genre") || "")
      : "custom";

    const formValues = {
      title: String(formData.get("title") || "").trim(),
      type: String(formData.get("type") || ""),
      status: String(formData.get("status") || ""),
      genre: selectedGenre === "custom"
        ? String(formData.get("customGenre") || "").trim()
        : selectedGenre,
      author: String(formData.get("author") || "").trim(),
      rating: String(formData.get("rating") || ""),
      progress: String(formData.get("progress") || "").trim(),
      tags: normalizeTags(formData.get("tags") || ""),
      description: String(formData.get("description") || "").trim(),
      memo: String(formData.get("memo") || "").trim()
    };

    if (state.workFormMode === "edit") {
      const selectedWork = works.find((work) => work.id === state.editingWorkId);

      if (!selectedWork) {
        return;
      }

      Object.assign(selectedWork, formValues);
      selectedWork.updatedAt = now;
      saveWorks(works);
      syncGenreFilterOptions();
      closeWorkFormModal({ restoreDetail: false });
      renderWorks(state.currentFilter);
      if (typeof renderMainPreview === "function") renderMainPreview(state.currentType);
      openDetailModal(selectedWork.id);
      return;
    }

    const newWork = {
      id: Date.now(),
      ...formValues,
      createdAt: now,
      updatedAt: now
    };

    works.push(newWork);
    saveWorks(works);
    syncGenreFilterOptions();
    closeWorkFormModal({ restoreDetail: false });

    document.querySelectorAll(".filter-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === "all");
    });

    state.currentFilter = "all";
    state.selectedWorkId = newWork.id;

    renderWorks(state.currentFilter);
    if (typeof renderMainPreview === "function") renderMainPreview(state.currentType);
  });
}

function initAddWorkModal() {
  const addWorkButtons = document.querySelectorAll(".add-work-button");

  if (addWorkButtons.length === 0) {
    return;
  }

  addWorkButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openWorkFormModal("create");
    });
  });
}

