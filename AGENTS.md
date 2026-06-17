# Agent Context

## Free Games Sources (authoritative)
When updating the game list, always consult these sources:

1. **LowVisionSquirrel Gist (Primary - free/premium list)**
   https://gist.github.com/LowVisionSquirrel/794eea649b5d698766b45aa8c197f91d
   (Lists exactly which games are free vs premium on BGA)

2. **LowVisionSquirrel Gist (Secondary - additional info)**
   https://gist.github.com/LowVisionSquirrel/58648a938d68c6b3e169c0c7edc88e1d

3. **BGA Help Page (for understanding free tier mechanics)**
   https://en.doc.boardgamearena.com/index.php?title=Help

## Key Rules
- Only include games where free-tier users can CREATE tables (not just join).
- Slugs are case-sensitive (e.g., `yatzy` not `yahtzee`).
- URL format: `https://boardgamearena.com/gamepanel?game=SLUG`
- Verify each new game by fetching its gamepanel URL and checking for premium indicators.

## CSS Style Preferences
- **Boxy aesthetic**: `border-radius: 0 !important` on `*, *::before, *::after` — no rounded corners anywhere.
- **Color palette**: Dark beige (`#D4C5A0`) backgrounds, royal red (`#B22222`) and burgundy (`#800020`) accents. Dark mode inverts bg to near-black (`#1A1510`), keeps red accents.
- **Typography**: Georgia serif (`--font-heading`) for headings; system/Segoe UI sans-serif (`--font-body`) for body text.
- **Dark mode**: Switched via `[data-theme="dark"]` on `<html>`, toggled by a `<button id="darkToggle">`. All colors are CSS custom properties so one attribute switch works.
- **Cards**: Use `border` + `box-shadow` hover instead of rounding. Grid layout via `repeat(auto-fill, minmax(250px, 1fr))`.
- **Pills/badges/buttons**: Uppercase, tight letter-spacing (`0.03em`–`0.08em`), small font sizes (`0.7rem`–`0.85rem`), bold weight.
- **Layout**: Flexbox-heavy, responsive `auto-fill` grid, media query breakpoint at `600px`.
- **Header**: Burgundy (`#800020`) background with `3px` accent-secondary bottom border.
- **RSS/update/dark buttons**: Match the accent color scheme, all share the same visual style (padding, border, uppercase, letter-spacing).
- **Scrollbar**: Smooth scroll via `scroll-behavior: smooth` on `<html>`.
- **BEM-like class naming**: `.game-card`, `.game-card-name`, `.game-card-meta`, `.game-card-genres`, `.stat-bar`, `.stat-bar-fill`, `.free-badge`, `.genre-pill`, `.search-bar`, `.btn-update`, `.dark-btn`, `.rss-link`.

## JavaScript Style Preferences
- **IIFE + `'use strict'`**: All client JS wrapped in `(function () { 'use strict'; ... })()`.
- **DOM API over innerHTML**: Use `document.createElement()` + `appendChild()` for untrusted content (game names, descriptions). innerHTML only for static safe HTML (e.g., stat row markup). Use `textContent` for text assignment.
- **async/await**: For all async operations. Try/catch for error handling.
- **Event listeners**: `addEventListener()` over inline handlers. `'click'` for buttons, `'input'` (debounced) for search, `'change'` for selects.
- **Debounce**: 200ms debounce on search input to avoid excessive API calls.
- **Naming**: camelCase variables/functions, PascalCase for constructors. Descriptive names like `gamesCache`, `genresCache`, `loadGames`.
- **Comments**: Block comments at top of files/IIFE explaining architecture and decisions. Minimal inline comments — only where logic is non-obvious.
- **localStorage**: Theme preference persisted as `bga-theme` key.
- **No template literals inside innerHTML for untrusted data** — always escape or use DOM methods.

## Backend (Node.js) Style Preferences
- **Express modular routes**: API routes in `routes/api.js`, RSS feed in `routes/feed.js`. Server entry is `server.js` — mounts routes, starts auto-update, serves `public/` statically.
- **Module pattern**: `require`/`module.exports`. Split into `scraper.js` (game data + heuristics), `db.js` (JSON file persistence), `updater.js` (auto-update loop), `routes/*.js`.
- **JSON file DB**: Flat `games.json` file. Read via `fs.readFileSync`, write via `fs.writeFileSync`. Sync is safe because the dataset is small (~883 games) and writes are infrequent.
- **Logging**: Console.log with bracketed prefixes like `[Update]`, `[AutoUpdate]`.
- **Error handling**: try/catch in async functions with `.message` logging. Silent catch for non-critical failures (e.g., BGA scrape fallback).
- **Port**: `1379` hardcoded, no env vars.
- **const over let**: Use `const` for requires, config values, and anything not reassigned.

## GitHub
- **Usage**: `$env:GH_TOKEN = "..."` before running `gh release create`
- **Release command**: `gh release create <tag> --title "<title>" --notes "<body>"`
- **Push tags**: `git push origin master --tags`

## File Organization
```
/public/index.html     – SPA shell (search, filter, sort, dark mode button, RSS link)
/public/style.css      – Boxy theme (287 lines)
/public/script.js      – Client-side logic (IIFE, fetch/render/filter/update)
/public/favicon.svg    – Tab icon (red BGA badge)
/routes/api.js         – /api/games, /api/genres, /api/update, /api/status, /api/games/:id
/routes/feed.js        – /rss (RSS 2.0 feed for newly discovered games)
server.js              – Express entry point, mounts + starts everything
scraper.js             – Curated game list (883 entries), keyword-based genre/popularity heuristics
db.js                  – JSON file DB (games.json), upsert, stats, new-games-for-RSS
updater.js             – Background scrape-and-upsert loop (60s interval)
docs/index.html        – Static snapshot for GitHub Pages live demo
start.bat              – One-click Windows launcher
games.json             – Auto-generated data store (delete to force re-scrape)
build-docs.js          – Regenerates docs/index.html static snapshot with inline CSS/JS/data
AGENTS.md              – This file
```

## Future Considerations (Feature Ideas)
These are common feature requests / enhancements to consider for release notes and README:

- **Per-game detail page**: Click a game card to see description, BGG rating, links to rules/how-to-play videos
- **BGG API integration**: With a registered token, fetch accurate genres/categories/ratings/playtime per game
- **Player count filter**: Filter games by exact player count (e.g., "show me 2-player games")
- **Collection/user system**: Let users mark games as "played", "want to play", "favorites"
- **Playtime info**: Show approximate play duration per game (from BGG or manual data)
- **Expansion tracking**: Flag which games have expansions available (free vs premium)
- **Mobile app / PWA**: Add manifest and service worker for installable mobile experience
- **Multi-language support**: BGA supports many languages; show which languages each game supports
- **Sort by recently added**: Sort games by discovery date (newest first)
- **Stats dashboard**: Charts showing genre distribution, popularity histograms, etc.
- **Export / share**: Copy filtered list as text, CSV export of current view
- **Premium indicator diff**: Track games that recently switched between free and premium
- **Notifications**: Desktop/browser push when new free games are detected

## Conventions
- 2-space indentation throughout all files.
- HTML comments (`<!-- ... -->`) for section annotations.
- JSDoc-style block comments at top of each file explaining purpose and design decisions.
- `data-theme="light"` on `<html>` in index.html (switched by JS at runtime).
- `aria-label` on interactive elements.
- `rel="noopener"` on external `target="_blank"` links.
- Genre pills, status separators, and badge text used for visual metadata.
- Grid rendering: 4-column default, 1-column at 600px breakpoint.
