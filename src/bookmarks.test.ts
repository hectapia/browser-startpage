import {
  BOOKMARKS_STORAGE_KEY,
  DEFAULT_BOOKMARKS,
  isHttpUrl,
  readBookmarks,
  writeBookmarks,
} from "./bookmarks";

describe("bookmark persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses the starter shortcuts when no saved list exists", () => {
    expect(readBookmarks(window.localStorage)).toEqual(DEFAULT_BOOKMARKS);
  });

  it("round-trips saved shortcuts through browser storage", () => {
    writeBookmarks(window.localStorage, [DEFAULT_BOOKMARKS[0]]);

    expect(readBookmarks(window.localStorage)).toEqual([DEFAULT_BOOKMARKS[0]]);
  });

  it("rejects malformed saved data instead of treating it as valid bookmarks", () => {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([{ title: "unsafe", url: "javascript:alert(1)" }]));

    expect(() => readBookmarks(window.localStorage)).toThrow("invalid format");
  });

  it("accepts only HTTP and HTTPS bookmark addresses", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("ftp://example.com")).toBe(false);
  });
});
