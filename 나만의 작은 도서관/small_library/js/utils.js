function getQueryParam(key) {
  return new URLSearchParams(location.search).get(key);
}

function getValidQueryParam(key, validValues, fallback) {
  const value = getQueryParam(key);
  return validValues.includes(value) ? value : fallback;
}

function isValidRating(value) {
  return /^[1-5]$/.test(String(value || ""));
}

function getValidRatingQueryParam() {
  const value = getQueryParam("rating");
  return value === "all" || isValidRating(value) ? value : "all";
}

function getValidGenreQueryParam() {
  const value = getQueryParam("genre");
  return value === "all" || getAvailableGenres().includes(value) ? value : "all";
}

function getDefaultSearchScope() {
  return document.body?.dataset.page === "main" ? "all" : "page";
}

function getValidSearchScopeQueryParam() {
  const value = getQueryParam("scope");
  const defaultScope = getDefaultSearchScope();
  return validSearchScopes.includes(value) ? value : defaultScope;
}

function getWorks() {
  if (worksCache) return worksCache;
  const savedWorks = localStorage.getItem(STORAGE_KEY);

  if (!savedWorks) {
    saveWorks(defaultWorks);
    return worksCache;
  }

  try {
    const parsedWorks = JSON.parse(savedWorks);
    if (!Array.isArray(parsedWorks)) {
      saveWorks(defaultWorks);
      return worksCache;
    }
    worksCache = parsedWorks;
    return worksCache;
  } catch {
    saveWorks(defaultWorks);
    return worksCache;
  }
}

function saveWorks(works) {
  worksCache = Array.isArray(works) ? works.slice() : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(worksCache));
}

function getTextSortGroup(value) {
  const firstLetter = String(value || "").trim().charAt(0);
  if (/[가-힣]/.test(firstLetter)) return 0;
  if (/[a-z]/i.test(firstLetter)) return 1;
  if (/\d/.test(firstLetter)) return 2;
  return 3;
}

function compareTextNaturally(a, b) {
  const groupDifference = getTextSortGroup(a) - getTextSortGroup(b);
  if (groupDifference !== 0) return groupDifference;
  return String(a).localeCompare(String(b), ["ko-KR", "en"], { numeric: true, sensitivity: "base" });
}

function sortTextNaturally(values) {
  return values.slice().sort(compareTextNaturally);
}

function getAvailableGenres() {
  const customGenres = getWorks().map((work) => String(work.genre || "").trim()).filter(Boolean);
  return sortTextNaturally(Array.from(new Set([...genres, ...customGenres])));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mergeHighlightRanges(ranges) {
  return ranges.filter((range) => range.start < range.end).sort((a, b) => a.start - b.start).reduce((mergedRanges, range) => {
    const previousRange = mergedRanges[mergedRanges.length - 1];
    if (!previousRange || previousRange.end < range.start) {
      mergedRanges.push({ ...range });
      return mergedRanges;
    }
    previousRange.end = Math.max(previousRange.end, range.end);
    return mergedRanges;
  }, []);
}

function renderHighlightedText(text, ranges) {
  const mergedRanges = mergeHighlightRanges(ranges);
  let cursor = 0;
  let html = "";
  mergedRanges.forEach((range) => {
    html += escapeHTML(text.slice(cursor, range.start));
    html += `<mark>${escapeHTML(text.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  });
  return html + escapeHTML(text.slice(cursor));
}

function getCompactCharacterRanges(text, count) {
  const ranges = [];
  for (let index = 0; index < text.length && ranges.length < count; index += 1) {
    if (!/\s/.test(text[index])) ranges.push({ start: index, end: index + 1 });
  }
  return ranges;
}

function getWordStartRanges(text, count) {
  const ranges = [];
  const wordPattern = /\S+/g;
  let match = wordPattern.exec(text);
  while (match && ranges.length < count) {
    ranges.push({ start: match.index, end: match.index + 1 });
    match = wordPattern.exec(text);
  }
  return ranges;
}

function normalizeKeyword(keyword) {
  return String(keyword || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function compactKeyword(keyword) {
  return normalizeKeyword(keyword).replace(/\s+/g, "");
}

function getTextAcronym(value) {
  const words = normalizeKeyword(value).split(" ").filter(Boolean);
  if (words.length <= 1) return "";
  return words.map((word) => word.charAt(0)).join("");
}

function getKoreanInitial(value) {
  const code = value.charCodeAt(0) - 0xac00;
  const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  if (code < 0 || code > 11171) return value.toLowerCase();
  return initials[Math.floor(code / 588)];
}

function getInitialText(value) {
  return compactKeyword(value).split("").map(getKoreanInitial).join("");
}

function isInitialKeyword(value) {
  return /^[ㄱ-ㅎ]+$/.test(compactKeyword(value));
}

function highlightKeyword(value, keyword, options = {}) {
  const text = String(value ?? "");
  const normalizedKeyword = normalizeKeyword(keyword);
  const compactQuery = compactKeyword(keyword);
  const allowShortcutHighlight = options.allowShortcutHighlight !== false;

  if (!normalizedKeyword) return escapeHTML(text);
  if (normalizeKeyword(text).startsWith(normalizedKeyword)) return renderHighlightedText(text, [{ start: 0, end: normalizedKeyword.length }]);
  if (compactKeyword(text).startsWith(compactQuery)) return renderHighlightedText(text, getCompactCharacterRanges(text, compactQuery.length));
  if (allowShortcutHighlight && isInitialKeyword(compactQuery) && getInitialText(text).startsWith(compactQuery)) return renderHighlightedText(text, getCompactCharacterRanges(text, compactQuery.length));
  if (allowShortcutHighlight && getTextAcronym(text).startsWith(compactQuery)) return renderHighlightedText(text, getWordStartRanges(text, compactQuery.length));
  if (allowShortcutHighlight && isInitialKeyword(compactQuery) && getInitialText(getTextAcronym(text)).startsWith(compactQuery)) return renderHighlightedText(text, getWordStartRanges(text, compactQuery.length));
  return escapeHTML(text);
}

function getSearchIndex(value) {
  const acronym = getTextAcronym(value);
  return {
    normalized: normalizeKeyword(value),
    compact: compactKeyword(value),
    initials: getInitialText(value),
    acronym,
    acronymInitials: acronym ? getInitialText(acronym) : ""
  };
}

function getAuthorSearchIndex(value) {
  const index = getSearchIndex(value);
  return { ...index, initials: "", acronym: "", acronymInitials: "" };
}

function createWorkSearchIndexes(work, scope = "all") {
  const indexes = [];
  const shouldSearchTitle = scope === "all" || scope === "page" || scope === "title";
  const shouldSearchAuthor = scope === "all" || scope === "page" || scope === "author";
  if (shouldSearchTitle && work.title) indexes.push(getSearchIndex(work.title));
  if (shouldSearchAuthor && work.author) indexes.push(getAuthorSearchIndex(work.author));
  return indexes;
}

function matchesSearchIndex(index, query) {
  const normalizedQuery = normalizeKeyword(query);
  const compactQuery = compactKeyword(query);
  if (!compactQuery) return true;
  if (isInitialKeyword(compactQuery)) return index.initials.startsWith(compactQuery) || index.acronymInitials.startsWith(compactQuery);
  if (index.normalized.startsWith(normalizedQuery) || index.compact.startsWith(compactQuery) || index.acronym.startsWith(compactQuery)) return true;
  if (normalizedQuery.includes(" ")) return normalizedQuery.split(" ").filter(Boolean).every((word) => matchesSearchIndex(index, word));
  return false;
}

function matchesPlainSearchField(value, keyword) {
  const normalizedValue = normalizeKeyword(value);
  const normalizedQuery = normalizeKeyword(keyword);
  const compactValue = compactKeyword(value);
  const compactQuery = compactKeyword(keyword);
  if (!compactQuery) return true;
  if (normalizedValue.includes(normalizedQuery) || compactValue.includes(compactQuery)) return true;
  if (normalizedQuery.includes(" ")) {
    return normalizedQuery.split(" ").filter(Boolean).every((word) => matchesPlainSearchField(value, word));
  }
  return false;
}

function getPlainSearchFields(work, scope) {
  const tagText = getTagsSearchText(work.tags);
  const plainSearchFields = {
    tags: [tagText],
    memo: [work.memo],
    description: [work.description],
    all: [tagText, work.memo, work.description],
    page: [tagText, work.memo, work.description]
  };

  if (plainSearchFields[scope]) return plainSearchFields[scope];
  return [];
}

function filterWorksByKeyword(works, keyword, scope = state.currentSearchScope) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return works;
  return works.filter((work) => {
    const searchIndexes = createWorkSearchIndexes(work, scope);
    if (searchIndexes.some((index) => matchesSearchIndex(index, normalizedKeyword))) return true;
    if (getPlainSearchFields(work, scope).some((value) => matchesPlainSearchField(value, normalizedKeyword))) return true;
    if (!isInitialKeyword(normalizedKeyword) && normalizedKeyword.includes(" ")) {
      return normalizedKeyword.split(" ").filter(Boolean).every((word) => searchIndexes.some((index) => matchesSearchIndex(index, word)));
    }
    return false;
  });
}

function getTypeWorks(type) {
  return getWorks().filter((work) => work.type === type);
}

function getPageWorks() {
  let works = getWorks();
  if (validTypes.includes(state.currentPage)) works = works.filter((work) => work.type === state.currentPage);
  if (state.currentPage === "recent") works = works.filter((work) => work.updatedAt || work.createdAt).slice().sort((a, b) => getWorkActivityTime(b) - getWorkActivityTime(a));
  return works;
}

function getStatusCounts(works) {
  return works.reduce((counts, work) => {
    if (counts[work.status] !== undefined) counts[work.status] += 1;
    return counts;
  }, { reading: 0, completed: 0, paused: 0, dropped: 0 });
}

function getVisibleWorks() {
  let works = getPageWorks();
  if ((state.currentPage === "library" || state.currentPage === "recent") && state.currentTypeFilter !== "all") works = works.filter((work) => work.type === state.currentTypeFilter);
  if (state.currentFilter !== "all") works = works.filter((work) => work.status === state.currentFilter);
  if (state.currentGenreFilter !== "all") works = works.filter((work) => work.genre === state.currentGenreFilter);
  if (state.currentRatingFilter !== "all") works = works.filter((work) => String(work.rating) === state.currentRatingFilter);
  works = filterWorksByKeyword(works, state.currentSearchKeyword);
  return sortWorks(works);
}

function sortWorks(works) {
  const compareTitle = (a, b) => compareTextNaturally(a.title || "", b.title || "");
  const sorters = {
    ratingDesc: (a, b) => Number(b.rating || 0) - Number(a.rating || 0) || compareTitle(a, b),
    ratingAsc: (a, b) => Number(a.rating || 0) - Number(b.rating || 0) || compareTitle(a, b),
    title: compareTitle,
    recent: (a, b) => getWorkActivityTime(b) - getWorkActivityTime(a)
  };

  return works.slice().sort(sorters[state.currentSort] || sorters.recent);
}

function getWorkById(workId) {
  return getWorks().find((work) => Number(work.id) === Number(workId));
}

function formatProgress(progress) {
  const value = String(progress || "").trim();
  if (!value) return "";
  return /^\d+$/.test(value) ? `${value}화` : value;
}

function parseTags(value) {
  return String(value || "")
    .split(/[#,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeTags(value) {
  return Array.from(new Set(parseTags(value))).join(", ");
}

function getTagsSearchText(value) {
  return parseTags(value).join(" ");
}

function getWorkActivityDate(work) {
  return work?.updatedAt || work?.createdAt || "";
}

function getWorkActivityTime(work) {
  const time = new Date(getWorkActivityDate(work)).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getCompactTextLength(value) {
  return String(value || "").replace(/\s+/g, "").length;
}

function getTextFitClass(value, baseClass) {
  const length = getCompactTextLength(value);
  if (length >= 34) return `${baseClass} ${baseClass}--xxs`;
  if (length >= 25) return `${baseClass} ${baseClass}--xs`;
  if (length >= 17) return `${baseClass} ${baseClass}--sm`;
  return baseClass;
}

function setTextFitClass(element, value, baseClass) {
  if (element) element.className = getTextFitClass(value, baseClass);
}

function getEmptyMessage() {
  if (state.currentSearchKeyword) return "검색 결과가 없습니다.";
  if (state.currentFilter !== "all") return `${statusText[state.currentFilter]} 상태의 작품이 없습니다.`;
  return pageInfo[state.currentPage]?.empty || "등록된 작품이 없습니다.";
}

function setButtonExpanded(button, expanded) {
  if (button) button.setAttribute("aria-expanded", String(expanded));
}

function syncCustomScrollbar(scrollContainer, scrollbar, thumb, options = {}) {
  if (!scrollContainer || !scrollbar || !thumb) return;
  const scrollableDistance = scrollContainer.scrollHeight - scrollContainer.clientHeight;
  if (scrollableDistance <= 0) {
    scrollbar.hidden = true;
    scrollbar.classList.remove("visible");
    return;
  }
  const { trackHeight = scrollContainer.clientHeight, minThumbHeight = 36, updateTrack, show = false } = options;
  const visibleRatio = scrollContainer.clientHeight / scrollContainer.scrollHeight;
  const thumbHeight = Math.max(visibleRatio * trackHeight, minThumbHeight);
  const maxThumbTop = Math.max(trackHeight - thumbHeight, 0);
  const thumbTop = (scrollContainer.scrollTop / scrollableDistance) * maxThumbTop;
  scrollbar.hidden = false;
  if (show) showCustomScrollbar(scrollbar);
  if (typeof updateTrack === "function") updateTrack(scrollbar);
  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${thumbTop}px)`;
}

function showCustomScrollbar(scrollbar, hideDelay = 400) {
  clearTimeout(scrollbar.fadeTimer);
  scrollbar.classList.add("visible");
  scrollbar.fadeTimer = setTimeout(() => {
    scrollbar.classList.remove("visible");
  }, hideDelay);
}

function formatDate(dateValue) {
  if (!dateValue) return "기록 없음";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
