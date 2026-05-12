const STORAGE_KEY = "littleLibraryWorksData";

const defaultWorks = [];
const validPages = ["webtoon", "webnovel", "manga", "anime", "recent", "library"];
const validStatuses = ["all", "completed", "paused", "dropped", "reading"];
const validTypes = ["all", "webtoon", "webnovel", "manga", "anime"];
const validSorts = ["recent", "ratingDesc", "ratingAsc", "title"];
const validSearchScopes = ["all", "page", "title", "author", "tags", "memo", "description"];
let worksCache = null;

const pageInfo = {
  webtoon: { title: "웹툰", documentTitle: "웹툰 | Little Library", eyebrow: "WEBTOON", description: "저장한 웹툰 작품들을 관리하는 페이지입니다.", placeholder: "웹툰을 검색하세요.", empty: "등록된 웹툰이 없습니다." },
  webnovel: { title: "웹소설", documentTitle: "웹소설 | Little Library", eyebrow: "WEB NOVEL", description: "저장한 웹소설 작품들을 관리하는 페이지입니다.", placeholder: "웹소설을 검색하세요.", empty: "등록된 웹소설이 없습니다." },
  manga: { title: "만화", documentTitle: "만화 | Little Library", eyebrow: "MANGA", description: "저장한 만화 작품들을 관리하는 페이지입니다.", placeholder: "만화를 검색하세요.", empty: "등록된 만화가 없습니다." },
  anime: { title: "애니", documentTitle: "애니 | Little Library", eyebrow: "ANIME", description: "저장한 애니 작품들을 관리하는 페이지입니다.", placeholder: "애니를 검색하세요.", empty: "등록된 애니가 없습니다." },
  recent: { title: "최근기록", documentTitle: "최근기록 | Little Library", eyebrow: "RECENT", description: "최근 수정한 작품들을 관리하는 페이지입니다.", placeholder: "최근기록을 검색하세요.", empty: "최근 수정한 작품이 없습니다." },
  library: { title: "보관함", documentTitle: "보관함 | Little Library", eyebrow: "LIBRARY", description: "저장한 작품들을 관리하는 페이지입니다.", placeholder: "보관함에서 검색하세요.", empty: "보관함에 등록된 작품이 없습니다." }
};

const typeText = { webtoon: "웹툰", webnovel: "웹소설", manga: "만화", anime: "애니" };
const statusText = { completed: "완독", paused: "보류", dropped: "하차", reading: "읽는 중" };

const genres = [
  "로맨스", "로맨스 판타지", "판타지", "게임 판타지", "현대 판타지", "현대",
  "무협", "선협", "스포츠", "SF", "대체역사", "라이트노벨"
];
const defaultGenre = "로맨스";
