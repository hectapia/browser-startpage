import {
  detectSearchEngine,
  readSearchEngine,
  SEARCH_ENGINE_STORAGE_KEY,
  writeSearchEngine,
} from "./search";

describe("search engine preferences", () => {
  beforeEach(() => window.localStorage.clear());

  it("selects search defaults for common browser user agents", () => {
    expect(detectSearchEngine("Mozilla/5.0 Edg/130.0", false)).toBe("bing");
    expect(detectSearchEngine("Mozilla/5.0 Firefox/132.0", false)).toBe("google");
    expect(detectSearchEngine("Mozilla/5.0 Chrome/130.0", true)).toBe("brave");
    expect(detectSearchEngine("Unknown browser", false)).toBe("duckduckgo");
  });

  it("persists a manually selected search engine", () => {
    writeSearchEngine(window.localStorage, "brave");

    expect(readSearchEngine(window.localStorage)).toBe("brave");
  });

  it("ignores unsupported values in browser storage", () => {
    window.localStorage.setItem(SEARCH_ENGINE_STORAGE_KEY, "toString");

    expect(readSearchEngine(window.localStorage)).toBeNull();
  });
});
