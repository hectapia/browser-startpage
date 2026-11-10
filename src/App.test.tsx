import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { DEFAULT_BOOKMARKS } from "./bookmarks";
import { SEARCH_ENGINE_STORAGE_KEY } from "./search";

describe("start page", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the profile, projects, and saved learning shortcuts", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /make room for/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Testing Library/ })).toHaveAttribute(
      "href",
      "https://testing-library.com/docs/react-testing-library/intro/",
    );
    expect(screen.getByRole("link", { name: /goerp-payroll/ })).toHaveAttribute(
      "href",
      "https://github.com/hectapia/goerp-payroll",
    );
  });

  it("adds a shortcut and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /add bookmark/i }));
    await user.type(screen.getByLabelText("Name"), "TypeScript Handbook");
    await user.type(screen.getByLabelText("URL"), "https://www.typescriptlang.org/docs/");
    await user.selectOptions(screen.getByLabelText("Category"), "Learn");
    await user.type(screen.getByLabelText("Description"), "Language reference");
    await user.click(screen.getByRole("button", { name: "Save bookmark" }));

    expect(screen.getByRole("link", { name: /TypeScript Handbook/ })).toHaveAttribute(
      "href",
      "https://www.typescriptlang.org/docs/",
    );
    expect(window.localStorage.getItem("hectapia-startpage-bookmarks")).toContain("TypeScript Handbook");
  });

  it("edits an existing shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);

    const card = screen.getByRole("link", { name: /MDN Web Docs/ }).closest("article");
    if (!card) throw new Error("The MDN bookmark card should be rendered.");
    await user.click(within(card).getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "MDN Reference");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("link", { name: /MDN Reference/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /MDN Web Docs/ })).not.toBeInTheDocument();
  });

  it("filters shortcuts by category and text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Filter by category"), "Engineering");
    expect(screen.getByRole("link", { name: /GitHub Actions/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /MDN Web Docs/ })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Filter bookmarks"), "missing");
    expect(screen.getByText(/no shortcuts match/i)).toBeInTheDocument();
  });

  it("removes a shortcut after confirmation", async () => {
    const user = userEvent.setup();
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    const card = screen.getByRole("link", { name: /React/ }).closest("article");
    if (!card) throw new Error("The React bookmark card should be rendered.");
    await user.click(within(card).getByRole("button", { name: "Remove" }));

    expect(screen.queryByRole("link", { name: /^React/ })).not.toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  it("saves the chosen search engine and supports the slash shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Search engine"), "brave");
    expect(screen.getByRole("search")).toHaveAttribute("action", "https://search.brave.com/search");
    expect(window.localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY)).toBe("brave");

    fireEvent.keyDown(document, { key: "/" });
    expect(screen.getByRole("searchbox", { name: "Search the web" })).toHaveFocus();
  });

  it("restores the saved search engine on the next visit", () => {
    window.localStorage.setItem(SEARCH_ENGINE_STORAGE_KEY, "duckduckgo");

    render(<App />);

    expect(screen.getByLabelText("Search engine")).toHaveValue("duckduckgo");
    expect(screen.getByRole("search")).toHaveAttribute("action", "https://duckduckgo.com/");
  });

  it("keeps the default shortcut list when the browser has no saved data", () => {
    render(<App />);

    expect(window.localStorage.getItem("hectapia-startpage-bookmarks")).toBeNull();
    expect(screen.getByRole("link", { name: /GitHub \(opens in a new tab\)/ })).toHaveAttribute(
      "href",
      DEFAULT_BOOKMARKS[0].url,
    );
  });
});
