export const SEARCH_ENGINE_STORAGE_KEY = "hectapia-startpage-search-engine";

export const SEARCH_ENGINES = {
  google: { name: "Google", url: "https://www.google.com/search" },
  bing: { name: "Bing", url: "https://www.bing.com/search" },
  brave: { name: "Brave", url: "https://search.brave.com/search" },
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/" },
} as const;

export type SearchEngine = keyof typeof SEARCH_ENGINES;

export function detectSearchEngine(userAgent: string, isBrave: boolean): SearchEngine {
  if (isBrave) return "brave";
  if (/Edg\//.test(userAgent)) return "bing";
  if (/Firefox\//.test(userAgent) || /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return "google";
  }
  if (/Chrome\//.test(userAgent)) return "google";
  return "duckduckgo";
}

export function readSearchEngine(storage: Storage): SearchEngine | null {
  const saved = storage.getItem(SEARCH_ENGINE_STORAGE_KEY);
  return saved !== null && Object.hasOwn(SEARCH_ENGINES, saved) ? (saved as SearchEngine) : null;
}

export function writeSearchEngine(storage: Storage, engine: SearchEngine): void {
  storage.setItem(SEARCH_ENGINE_STORAGE_KEY, engine);
}
