# Hector's Start Page

A personal browser start page built with React, TypeScript, and Vite. It preserves the original profile-inspired design and adds browser-local shortcuts that can be searched, filtered, added, edited, and removed.

## Run locally

```sh
npm ci
npm run dev
```

## Verify changes

```sh
npm run typecheck
npm run test:ci
npm run build
```

The test suite uses Jest and React Testing Library to check bookmark workflows, filtering, storage, and search-engine preferences.

## Deploy to GitHub Pages

The GitHub Actions workflow runs the type checker, tests, and production build before deploying `dist`. It runs on pushes to `main` and can also be started manually from the Actions tab. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Skills practiced

The project applies the development plan in `docs/JobHunting_Required_Skills_Marked.md`:

- React and TypeScript components with typed data and browser state.
- Jest and React Testing Library tests for user-facing behavior.
- Client-side persistence and validation for saved shortcuts.
- A repeatable GitHub Actions check-and-deploy pipeline for a static site.
