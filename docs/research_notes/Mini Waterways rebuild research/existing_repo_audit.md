# Existing Mini-Waterways repo audit

Method: shallow-read of a fresh clone plus `gh` API calls (nothing executed, no npm install). Source for everything below is the repo itself: [GitHub repo](https://github.com/CaptainPancakeWithBacon/Mini-Waterways), [live Pages site](https://captainpancakewithbacon.github.io/Mini-Waterways/) (returned HTTP 200).

## Tech stack, structure, history, licence, deployment

### Takeaway
A small (~4.3k lines TypeScript), dependency-light Vite + vanilla Canvas 2D project with working GitHub Pages CI, MIT licence, 22 commits, last activity 2025-12-10. Tooling is dated and several declared dependencies are unused; there are no tests and no art/audio assets.

### Cited Findings
- Description: "A spinoff from both mini motorways and mini metro in shipyard form"; public; created 2025-04-04; last push 2025-12-10; ~230 KB repo (disk usage), 344 KB .git — [repo](https://github.com/CaptainPancakeWithBacon/Mini-Waterways)
- Licence: MIT (GitHub detects it; package.json also says MIT, author "HZ University of Applied Sciences") — [repo](https://github.com/CaptainPancakeWithBacon/Mini-Waterways)
- Languages by bytes: TypeScript 118,428; HTML 3,767; JavaScript 2,789 — [repo](https://github.com/CaptainPancakeWithBacon/Mini-Waterways)
- Git history: 22 commits on main, 3 branches (main, development; origin/HEAD). Authors: Gijs Borghouts 12, CaptainPancakeWithBacon 8 (same user, different identity), SIrAdolphus 1 ("first commit" 2025-04-04). Bursts: Apr-May 2025 (setup, "Game engine supplied by Erik" 2025-05-13, grid with draw and following dots 2025-05-17, "removed grid for rework" 2025-05-29), then Dec 2025 (2025-12-06 "major updates", 12-07 "added a fucking million jsdocs", 12-08 "V0.1", 12-10 three deploy-fix PRs). Last commit e865df3, 2025-12-10 — `git log` of clone
- PRs: 4 total (#1 "V0.1", #2 "Development", #3 "pages fix", #4 "more deploy fixes"), all merged development->main. Open issues: none (none ever filed) — `gh pr list` / `gh issue list`
- Deployment: GitHub Pages, build_type "workflow", source main, https enforced, status "built" — `gh api repos/.../pages`. Workflow `.github/workflows/deploy.yml`: triggers on push to main/master/development + manual; Node 18; `npm ci` -> `npm run build` -> upload-pages-artifact@v3 -> deploy-pages@v4. Note it deploys from the `development` branch too.
- Also `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect `/*`->`/index.html`); `vite.config.ts` switches `base` between `/` (if env NETLIFY) and `/Mini-Waterways/`; sourcemaps on.
- package.json: scripts only dev/build/preview (no lint, no test, no typecheck script). Dev deps: vite ^6.3.5, typescript pinned 4.8, eslint ^8.18 with airbnb-base/airbnb-typescript/jsdoc plugins, @typescript-eslint v5, plus leftovers webpack ^5.93, webpack-cli, ts-loader, @web/dev-server, @types/three, @types/color-namer. Runtime deps: three ^0.168.0, neataptic ^1.4.7, color-namer ^1.4.0. A grep of src/ finds none of three/neataptic/color-namer imported (only the word "three" in a comment) — these look like unused template leftovers.
- tsconfig: target es2022, `strict: false` (but noImplicitAny/This/Override/Returns on), moduleResolution node, trailing comma in `include` (invalid strict JSON, tolerated by tsc). Imports use `.js` extensions on `.ts` files (e.g. `'./Boat.js'`).
- Lint config `.eslintrc.cjs`: strict (explicit member accessibility, camelCase naming, jsdoc required on public methods, max-len 300). Explains the "million jsdocs" commit. Also `.editorconfig` (2 spaces, LF).
- Committed editor cruft: `.idea/` (JetBrains) and `.vscode/settings.json`.
- Structure (35 tracked files): `index.html` (large inline CSS + HTML overlay incl. "How to Play" panel, `<canvas id=game>`, `<script type=module src=./src/app.ts>`); `public/.nojekyll` only (public/ contains no other assets); `src/` = app.ts 79, main.ts 24, GameLoop.ts 172, Grid.ts 117, Boat.ts 311, Port.ts 457, Route.ts 282, RouteNetwork.ts 361, TransitLine.ts 340, scenes/Scene.ts 29, scenes/Start.ts 980, utilities/{ButtonBar 261, CanvasUtil 283, ColorGa 84, KeyListener 167, MouseListener 175, UIButton 173}.ts. Total 4,295 lines.
- README claims: "built with TypeScript and HTML5 Canvas"; "Created for an IT conference with a focus on water and energy"; "Current Features: None :)"; roadmap (click & drag routes, AI boats, weather/tide, hydro/tidal energy, multiple boat types, scoring). Tech section says "Lightweight and dependency-free" (contradicted by package.json deps). Clone URL in README uses lowercase `mini-waterways` (repo is `Mini-Waterways`). Credits erjbroek for "helping to design and providing the game engine" — [README](https://github.com/CaptainPancakeWithBacon/Mini-Waterways#readme)
- Existing game logic in brief (to be discarded): a Mini-Metro-style port/transit-line game. User places grid tiles (P/R), creates transit lines between ports (L), places boats manually (B), edits lines (E); boats carry max 10 passengers; ports overflow if unconnected; rewards every 3 days (+10 tiles) and 6 days (+1 boat per line). Most logic sits in `scenes/Start.ts` (980 lines) with Port/Boat/TransitLine/RouteNetwork/Route classes. The index.html panel documents this; the README still says "no features".

### Inferences
- The game loop, input and canvas helper code come from a teacher/school-supplied engine (the "BugSlayer" `@author` tag in GameLoop.ts, HZ author field, README credit). Check provenance/licence before reusing verbatim; MIT on the repo likely but the origin is third-party.
- The repo is small enough that a rebuild loses almost nothing by starting a fresh directory; keep it only for reference/history.

### Gaps
- Did not run or build the project, so build success, bundle size and the current look of the game are unverified. Pages returned 200 but content not inspected visually.
- No info on whether the Dec-2025 PRs had review comments (not fetched).

## Reusable pieces independent of game logic

### Takeaway
Reusable: the Vite + GitHub Pages workflow (with fixes), Canvas helper/input/loop utilities, Grid snap helper, and the lint/editorconfig conventions. There are no art, audio, palette or test assets to keep.

### Cited Findings
- Assets: none. `public/` holds only `.nojekyll`; all visuals are drawn with Canvas primitives; no audio files; no sprites. No `.png/.svg/.mp3` tracked in the 35-file listing — `git ls-files`
- Colours: ~53 hard-coded hex literals scattered in src, no central palette file; index.html uses `#2c3e50 -> #3498db` gradient background and flat-UI colours (#3498db, #2ecc71, #e74c3c) — repo grep
- `CanvasUtil.ts` (283 lines): static helpers over a 2D context (fillCanvas, loadNewImage(s), drawImage with rotation/opacity, clearCanvas, writeText/writeTextOutline, drawCircle/Line/Rectangle, fillCircle/fillRectangle with border radius). Generic, but takes the canvas as a parameter on every call and uses default colour `#FF10F0` — thin wrappers over native Canvas API.
- `KeyListener.ts` (167), `MouseListener.ts` (175): input wrappers; `GameLoop.ts` (172): rAF fixed/variable-step loop with `Game` abstract class (processInput/update/render); `Scene.ts` + `ColorGa.ts`: simple scene manager and window-resize handling; `ButtonBar.ts`/`UIButton.ts` (261/173): canvas-drawn UI buttons; `Grid.ts` (117): snapToGrid and random placement, but imports `Point` from Boat.ts (coupling to a game class).
- CI: `deploy.yml` is directly reusable (swap Node 18 for a current LTS; restrict triggers to main).

### Inferences
- Worth keeping as concept/reference, probably rewritten: game loop, input, grid snap. Not worth keeping: CanvasUtil wrappers, Netlify config (unless Netlify is wanted), webpack/ts-loader/@web/dev-server, three, neataptic, color-namer.

### Gaps
- Licence/provenance of the supplied engine code not verified.

## Structural and tooling problems worth fixing in a rebuild

### Takeaway
No tests, loose TypeScript, stale/unused deps and toolchain versions, a 980-line scene monolith, inline CSS in index.html, committed IDE files, and docs that contradict the code.

### Cited Findings
- No tests: no test runner, no test script, no spec files (tsconfig excludes `**/*.spec.ts` but none exist) — repo files/package.json
- Types: `strict: false`; TypeScript pinned to 4.8 (old) alongside Vite 6 and @typescript-eslint 5/ESLint 8 (both legacy generations; ESLint 8 is end-of-life) — package.json (EOL status is my knowledge, not sourced here)
- Unused/duplicated tooling: webpack + ts-loader + @web/dev-server alongside Vite; three, neataptic, color-namer unused — package.json vs `grep src`
- `lint` is configured but not exposed as an npm script and not run in CI; CI does not typecheck (vite build does not typecheck) or test.
- Monolith: `scenes/Start.ts` is 980 lines of the 4,295 (~23%) and combines state, input and rendering; static class-based utilities and global `ColorGa.canvas` static.
- Pages `base` hard-coded as `/Mini-Waterways/` with env switch for Netlify; deploy workflow triggers on `development` branch pushes too, which overwrite the production site.
- `.idea/` and `.vscode/` committed; commit messages are low-signal (e.g. "small changes", "pages fix"); mixed git author identities (3 names).
- README: install instructions are just clone+cd (no `npm install`/`npm run dev`), "dependency-free" claim false, "Current Features: None".

### Inferences
- A rebuild should: start strict TS on a current toolchain, add `lint`/`typecheck`/`test` scripts and run them in CI, adopt a small test runner (e.g. Vitest, which pairs with Vite) for pure game-logic modules, separate simulation from rendering, centralise a palette module, move CSS out of index.html, drop IDE folders via .gitignore, and keep a single Pages workflow on main.

### Gaps
- Branch protection, releases, repo topics and traffic stats not checked.
