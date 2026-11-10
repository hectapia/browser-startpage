import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BOOKMARK_CATEGORIES,
  createBookmarkId,
  DEFAULT_BOOKMARKS,
  isHttpUrl,
  readBookmarks,
  writeBookmarks,
  type Bookmark,
  type BookmarkCategory,
} from "./bookmarks";
import {
  detectSearchEngine,
  readSearchEngine,
  SEARCH_ENGINES,
  writeSearchEngine,
  type SearchEngine,
} from "./search";

interface PageState {
  bookmarks: Bookmark[];
  searchEngine: SearchEngine;
  storageMessage: string;
}

interface BookmarkFormValues {
  title: string;
  url: string;
  category: BookmarkCategory;
  description: string;
}

const EMPTY_FORM: BookmarkFormValues = {
  title: "",
  url: "",
  category: "Learn",
  description: "",
};

function getDetectedEngine(): SearchEngine {
  return detectSearchEngine(navigator.userAgent, "brave" in navigator);
}

function loadInitialState(): PageState {
  let bookmarks = DEFAULT_BOOKMARKS;
  let searchEngine = getDetectedEngine();
  const messages: string[] = [];

  try {
    bookmarks = readBookmarks(window.localStorage);
  } catch {
    messages.push("Saved bookmarks could not be read. Defaults are shown; save once to replace them.");
  }

  try {
    searchEngine = readSearchEngine(window.localStorage) ?? searchEngine;
  } catch {
    messages.push("Search preferences could not be read. The browser default is selected.");
  }

  return { bookmarks, searchEngine, storageMessage: messages.join(" ") };
}

function storageFailureMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Browser storage is full. This change will not persist after reload.";
  }
  return "Browser storage is unavailable. This change will not persist after reload.";
}

function useLocalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    date: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(now),
  };
}

function App() {
  const [pageState, setPageState] = useState(loadInitialState);
  const clock = useLocalClock();

  function updateBookmarks(bookmarks: Bookmark[]) {
    setPageState((current) => ({ ...current, bookmarks, storageMessage: "" }));
    try {
      writeBookmarks(window.localStorage, bookmarks);
    } catch (error) {
      setPageState((current) => ({
        ...current,
        bookmarks,
        storageMessage: storageFailureMessage(error),
      }));
    }
  }

  function updateSearchEngine(searchEngine: SearchEngine) {
    setPageState((current) => ({ ...current, searchEngine, storageMessage: "" }));
    try {
      writeSearchEngine(window.localStorage, searchEngine);
    } catch (error) {
      setPageState((current) => ({
        ...current,
        searchEngine,
        storageMessage: storageFailureMessage(error),
      }));
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <a
          className="brand"
          href="https://github.com/hectapia"
          aria-label="Hector Olivares Tapia on GitHub"
        >
          <span className="brand-mark" aria-hidden="true">HT</span>
          <span>Hector Olivares Tapia</span>
        </a>
        <a className="topbar-link" href="https://github.com/hectapia">
          GitHub profile <span className="arrow" aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="intro" aria-labelledby="welcome-heading">
          <p className="eyebrow">{clock.date}</p>
          <h1 id="welcome-heading">Make room for<br /><span>what&apos;s next.</span></h1>
          <p className="intro-copy">
            Engineering discipline meets software thinking. A focused space for exploring,
            building, and making the work measurable.
          </p>
          <SearchBar selectedEngine={pageState.searchEngine} onEngineChange={updateSearchEngine} />
        </section>

        <BookmarkManager bookmarks={pageState.bookmarks} onChange={updateBookmarks} />
        {pageState.storageMessage && (
          <p className="status-message" role="status">{pageState.storageMessage}</p>
        )}

        <section aria-labelledby="projects-heading">
          <div className="section-heading">
            <h2 className="section-title" id="projects-heading">A few things in the workshop</h2>
            <p className="section-note">Selected public repositories</p>
          </div>
          <div className="repo-grid">
            <RepositoryCard
              name="goerp-payroll"
              href="https://github.com/hectapia/goerp-payroll"
              description="A jurisdiction-agnostic payroll calculation engine."
              language="Python"
            />
            <RepositoryCard
              name="Phrasecraft"
              href="https://github.com/hectapia/Phrasecraft"
              description="A TypeScript project from the public profile."
              language="TypeScript"
            />
            <RepositoryCard
              name="autocare"
              href="https://github.com/hectapia/autocare"
              description="A Kotlin project from the public profile."
              language="Kotlin"
            />
          </div>
        </section>

        <div className="bottom-row">
          <section className="quote-panel" aria-labelledby="principle-heading">
            <h2 className="panel-label" id="principle-heading">A working principle</h2>
            <blockquote>
              “What is measured can be improved, and what is measured and reported
              <strong> accelerates its rate of improvement.</strong>”
            </blockquote>
          </section>
          <nav className="links-panel" aria-label="Connect">
            <h2 className="panel-label">Connect &amp; explore</h2>
            <div className="connect-links">
              <a className="connect-link" href="https://github.com/hectapia">
                <span aria-hidden="true">↗</span> GitHub
              </a>
              <a className="connect-link" href="https://github.com/hectapia?tab=repositories">
                <span aria-hidden="true">⌘</span> Repositories
              </a>
              <a className="connect-link" href="https://www.linkedin.com/in/hector-olivares-tapia/">
                <span aria-hidden="true">↗</span> LinkedIn
              </a>
            </div>
          </nav>
        </div>
      </main>

      <footer>
        <span>Built for curiosity and clear thinking.</span>
        <span>{clock.time}</span>
      </footer>
    </div>
  );
}

interface SearchBarProps {
  selectedEngine: SearchEngine;
  onEngineChange: (engine: SearchEngine) => void;
}

function SearchBar({ selectedEngine, onEngineChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !(target instanceof HTMLElement && (
          target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName)
        ))
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [inputRef]);

  return (
    <div className="search-wrap">
      <form
        className="search-form"
        action={SEARCH_ENGINES[selectedEngine].url}
        method="get"
        role="search"
      >
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <label className="sr-only" htmlFor="search-query">Search the web</label>
        <input
          className="search-input"
          id="search-query"
          name="q"
          type="search"
          placeholder="Search the web..."
          autoComplete="off"
          autoFocus
          ref={inputRef}
        />
        <label className="sr-only" htmlFor="search-engine">Search engine</label>
        <select
          className="engine-select"
          id="search-engine"
          value={selectedEngine}
          onChange={(event) => onEngineChange(event.target.value as SearchEngine)}
        >
          {Object.entries(SEARCH_ENGINES).map(([value, engine]) => (
            <option key={value} value={value}>{engine.name}</option>
          ))}
        </select>
        <button className="search-button" type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <div className="search-hint">
        <span>Searching with {SEARCH_ENGINES[selectedEngine].name}</span>
        <span>Press <kbd>/</kbd> to focus</span>
      </div>
    </div>
  );
}

interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  onChange: (bookmarks: Bookmark[]) => void;
}

function BookmarkManager({ bookmarks, onChange }: BookmarkManagerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [formValues, setFormValues] = useState<BookmarkFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const visibleBookmarks = bookmarks.filter((bookmark) => {
    const matchesCategory = category === "All" || bookmark.category === category;
    const searchText = `${bookmark.title} ${bookmark.description} ${bookmark.category}`.toLowerCase();
    return matchesCategory && searchText.includes(query.trim().toLowerCase());
  });

  function openCreateForm() {
    setEditingId(null);
    setFormValues(EMPTY_FORM);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(bookmark: Bookmark) {
    setEditingId(bookmark.id);
    setFormValues({
      title: bookmark.title,
      url: bookmark.url,
      category: bookmark.category,
      description: bookmark.description,
    });
    setFormError("");
    setIsFormOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = formValues.title.trim();
    const url = formValues.url.trim();

    if (!title) {
      setFormError("Enter a name for this bookmark.");
      return;
    }
    if (!isHttpUrl(url)) {
      setFormError("Enter a valid HTTP or HTTPS address.");
      return;
    }

    const bookmark: Bookmark = {
      id: editingId ?? createBookmarkId(),
      title,
      url,
      category: formValues.category,
      description: formValues.description.trim(),
    };
    const nextBookmarks = editingId
      ? bookmarks.map((item) => item.id === editingId ? bookmark : item)
      : [...bookmarks, bookmark];

    onChange(nextBookmarks);
    setEditingId(null);
    setFormValues(EMPTY_FORM);
    setFormError("");
    setIsFormOpen(false);
  }

  function handleDelete(bookmark: Bookmark) {
    if (!window.confirm(`Remove "${bookmark.title}" from your bookmarks?`)) return;
    onChange(bookmarks.filter((item) => item.id !== bookmark.id));
    if (editingId === bookmark.id) {
      setEditingId(null);
      setFormValues(EMPTY_FORM);
      setFormError("");
      setIsFormOpen(false);
    }
  }

  return (
    <section aria-labelledby="bookmarks-heading">
      <div className="section-heading">
        <div>
          <h2 className="section-title" id="bookmarks-heading">Your shortcuts</h2>
          <p className="section-note">Saved in this browser, just for you</p>
        </div>
        <button className="add-bookmark-button" type="button" onClick={openCreateForm}>
          <span aria-hidden="true">＋</span> Add bookmark
        </button>
      </div>

      <div className="bookmark-toolbar">
        <label className="filter-field">
          <span className="sr-only">Filter bookmarks</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter your shortcuts..."
          />
        </label>
        <label className="filter-field category-field">
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">All categories</option>
            {BOOKMARK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {isFormOpen ? (
        <BookmarkForm
          values={formValues}
          error={formError}
          isEditing={editingId !== null}
          onValuesChange={setFormValues}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditingId(null);
            setFormValues(EMPTY_FORM);
            setFormError("");
            setIsFormOpen(false);
          }}
        />
      ) : null}

      {visibleBookmarks.length > 0 ? (
        <div className="bookmark-grid">
          {visibleBookmarks.map((bookmark) => (
            <article className="repo-card bookmark-card" key={bookmark.id}>
              <div className="repo-top">
                <a className="repo-name bookmark-link" href={bookmark.url} target="_blank" rel="noreferrer">
                  {bookmark.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <span className="bookmark-category">{bookmark.category}</span>
              </div>
              <p className="repo-description">{bookmark.description || bookmark.url}</p>
              <div className="bookmark-actions">
                <button type="button" onClick={() => openEditForm(bookmark)}>Edit</button>
                <button type="button" onClick={() => handleDelete(bookmark)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-bookmarks">No shortcuts match. Try another filter or add a bookmark.</p>
      )}
    </section>
  );
}

interface BookmarkFormProps {
  values: BookmarkFormValues;
  error: string;
  isEditing: boolean;
  onValuesChange: (values: BookmarkFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

function BookmarkForm({
  values,
  error,
  isEditing,
  onValuesChange,
  onSubmit,
  onCancel,
}: BookmarkFormProps) {
  function updateValue<Key extends keyof BookmarkFormValues>(
    key: Key,
    value: BookmarkFormValues[Key],
  ) {
    onValuesChange({ ...values, [key]: value });
  }

  return (
    <form className="bookmark-form" onSubmit={onSubmit} aria-label={isEditing ? "Edit bookmark" : "Add bookmark"}>
      <div className="bookmark-form-grid">
        <label>
          Name
          <input
            required
            maxLength={60}
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
          />
        </label>
        <label>
          URL
          <input
            required
            type="url"
            placeholder="https://example.com"
            value={values.url}
            onChange={(event) => updateValue("url", event.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={values.category}
            onChange={(event) => updateValue("category", event.target.value as BookmarkCategory)}
          >
            {BOOKMARK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="description-field">
          Description
          <input
            maxLength={120}
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
          />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="save-bookmark-button" type="submit">{isEditing ? "Save changes" : "Save bookmark"}</button>
        <button className="cancel-bookmark-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

interface RepositoryCardProps {
  name: string;
  href: string;
  description: string;
  language: "Python" | "TypeScript" | "Kotlin";
}

function RepositoryCard({ name, href, description, language }: RepositoryCardProps) {
  const languageClass = language === "TypeScript" ? "ts" : language === "Kotlin" ? "kt" : "";

  return (
    <a className="repo-card" href={href}>
      <div className="repo-top">
        <h3 className="repo-name">{name}</h3>
        <span className="repo-arrow" aria-hidden="true">↗</span>
      </div>
      <p className="repo-description">{description}</p>
      <div className="repo-meta"><span className={`language-dot ${languageClass}`}></span> {language}</div>
    </a>
  );
}

export default App;
