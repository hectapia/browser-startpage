export const BOOKMARKS_STORAGE_KEY = "hectapia-startpage-bookmarks";

export const BOOKMARK_CATEGORIES = ["Learn", "Engineering", "Projects", "Tools"] as const;

export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number];

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: BookmarkCategory;
  description: string;
}

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/hectapia",
    category: "Projects",
    description: "Repositories, experiments, and open-source work.",
  },
  {
    id: "mdn",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    category: "Learn",
    description: "The web platform reference for HTML, CSS, and JavaScript.",
  },
  {
    id: "react",
    title: "React",
    url: "https://react.dev/learn",
    category: "Learn",
    description: "Official React guides and component patterns.",
  },
  {
    id: "testing-library",
    title: "Testing Library",
    url: "https://testing-library.com/docs/react-testing-library/intro/",
    category: "Learn",
    description: "Practice testing interfaces the way people use them.",
  },
  {
    id: "github-actions",
    title: "GitHub Actions",
    url: "https://docs.github.com/actions",
    category: "Engineering",
    description: "Automate builds, checks, and deployments.",
  },
];

export function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== "object" || value === null) return false;

  const bookmark = value as Record<string, unknown>;
  return (
    typeof bookmark.id === "string" &&
    typeof bookmark.title === "string" &&
    typeof bookmark.url === "string" &&
    isHttpUrl(bookmark.url) &&
    typeof bookmark.category === "string" &&
    BOOKMARK_CATEGORIES.includes(bookmark.category as BookmarkCategory) &&
    typeof bookmark.description === "string"
  );
}

export function readBookmarks(storage: Storage): Bookmark[] {
  const serialized = storage.getItem(BOOKMARKS_STORAGE_KEY);
  if (serialized === null) return DEFAULT_BOOKMARKS;

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed) || !parsed.every(isBookmark)) {
    throw new Error("Saved bookmarks have an invalid format.");
  }

  return parsed;
}

export function writeBookmarks(storage: Storage, bookmarks: Bookmark[]): void {
  storage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

export function createBookmarkId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
