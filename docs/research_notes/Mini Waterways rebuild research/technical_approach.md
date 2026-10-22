# Technical approach for a Mini Metro / Mini Motorways style browser game (2026)

Research date: 2026-10-22. Versions below were read from the GitHub releases API and npm registry on that date. Many algorithm recommendations are my own engineering inferences (marked as such), not cited facts.

## 1. Rendering stack: Canvas 2D vs WebGL vs PixiJS vs Phaser vs SVG

### Takeaway
Recommended: TypeScript + Vite, with PixiJS v8 (WebGL/WebGPU, Graphics API) as the renderer if you want hundreds of animated entities with headroom. Plain Canvas 2D is the lazy runner-up and probably sufficient for Mini Metro scale. Phaser is overkill for a vector/minimalist game with no sprites or physics. SVG DOM is fine for prototyping but is the weakest option for hundreds of moving entities.

### Cited Findings
- PixiJS latest release is v8.22.0, published 2026-10-01 — [GitHub API](https://api.github.com/repos/pixijs/pixijs/releases/latest)
- PixiJS v8.16.0 added an experimental Canvas 2D renderer; it is an automatic fallback when WebGL/WebGPU is unavailable, or selectable with `preference: 'canvas'`. It handles sprites, graphics, text, basic filters but not every GPU feature — [PixiJS 8.16.0 blog](https://pixijs.com/blog/8.16.0)
- PixiJS v8 treats WebGPU as a core paradigm alongside WebGL; v8.20.0 was a WebGPU-focused release (shader overrides, render bundles, depth-stencil) — [gamedev.net v8.20.0 mirror](https://gamedev.net/news/5221/), [PixiJS v8 launch](https://pixijs.com/blog/pixi-v8-launches). Dating on the mirror was inconsistent; the version number from the official API above is authoritative.
- Phaser latest on npm: 4.2.1 — [npm registry](https://registry.npmjs.org/phaser/latest)
- Existing clones span the options: Canvas 2D + React ([mini-metro-js](https://github.com/Kaos599/mini-metro-js)), Canvas 2D vanilla TS ([Mini-Waterways](https://github.com/CaptainPancakeWithBacon/Mini-Waterways), [tinytraffictown](https://github.com/pyrou/tinytraffictown)), and an SVG DOM mirror of a headless sim ([svgmetro](https://github.com/ujjwalvivek/svgmetro)). No clone found that uses PixiJS or Phaser.
- MDN HiDPI recipe for Canvas: size the backing store by `devicePixelRatio`, `ctx.scale(dpr, dpr)`, keep CSS size fixed; also: layer multiple canvases by update frequency, pre-render static content offscreen, avoid `shadowBlur`/text in hot paths, use `alpha:false` if no transparency — [MDN Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- Build tooling versions: Vite v8.3.5 (2026-10-21), TypeScript 7.0.2, Vitest 5.0.5 — [Vite releases](https://api.github.com/repos/vitejs/vite/releases/latest), [npm typescript](https://registry.npmjs.org/typescript/latest), [npm vitest](https://registry.npmjs.org/vitest/latest)

### Inferences
- Mini Metro scale (tens of stations, tens of trains, a few hundred passengers as tiny shapes) is well within Canvas 2D budget at 60fps if static layers (map background, water) are cached on a separate canvas and only the dynamic layer is redrawn. Mini Motorways with many cars and a road grid is still comfortable.
- PixiJS's benefit is retained-mode scene graph, batching, smooth antialiasing via `antialias`/`resolution` options, and an easy path to filters/glow/bloom; its cost is a ~dependency and Graphics geometry rebuilds when a line's path changes (redraw only the edited line).
- Because simulation is separated from rendering (see section 4), the renderer is swappable: start Canvas 2D, move to Pixi only if profiling demands it. This is the lowest-risk plan for a solo developer.
- SVG DOM: thousands of attributes updated per frame is the usual bottleneck; keep SVG for UI overlay/menus only.
- "Svelte/Laravel-adjacent": use Svelte (or plain DOM) only for HUD/menus around the canvas; Laravel is irrelevant for a static client-only game, relevant only if you later add server-side daily-challenge leaderboards.

### Gaps
- No benchmark numbers found comparing Canvas 2D vs PixiJS for several hundred vector entities; recommend a 1-day spike measuring both.
- Phaser 4 specifics (renderer changes, bundle size) not researched.

## 2. Algorithms

### Takeaway
Use A* for single-target grid pathing (roads/canal), BFS on the (small, unweighted) station graph for passenger routing, a hand-rolled octilinear segment router with arc-rounded corners for lines, and a small seeded PRNG (sfc32 or mulberry32) with a fixed-timestep accumulator loop. Pointer Events unify mouse and touch.

### Cited Findings
- Red Blob Games: BFS when costs are uniform and you want paths to many locations; Dijkstra when costs vary; A* for a single target or nearest of several goals, optimal if the heuristic never overestimates; Manhattan heuristic for 4-way grids — [Red Blob Games A* intro](https://www.redblobgames.com/pathfinding/a-star/introduction.html)
- Fixed timestep: accumulator loop with dt fixed, clamp frame time (0.25s in the article) to avoid spiral of death, render with interpolation `alpha = accumulator/dt` — [Gaffer On Games, Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
- PRNGs: sfc32 (128-bit state) passes PractRand and TestU01 BigCrush and is recommended by its author; mulberry32 (32-bit state) is fast but skips about a third of 32-bit values; seed with an xmur3 string hash for e.g. date-string daily seeds — [bryc PRNGs](https://github.com/bryc/code/blob/master/jshash/PRNGs.md)
- Octilinear metro layout literature: Nöllenburg & Wolff (2011) MIP formulation; Bast, Brosi, Storandt (2020) "Metro Maps on Octilinear Grid Graphs" gives an exact ILP plus a fast greedy shortest-path-on-octilinear-grid approximation producing near-optimal maps in a fraction of a second; Chivers & Rodgers (2014) force-directed octilinear layout; Nickel & Nöllenburg (2019) k-linear generalisation — [Bast et al., Eurographics](https://diglib.eg.org/handle/10.1111/cgf13986), [Nickel & Nöllenburg, TU Wien](https://ac.tuwien.ac.at/files/pub/smw19-paper-6.pdf), [Chivers & Rodgers, Kent](https://kar.kent.ac.uk/41428/), [Nöllenburg & Wolff, KIT](https://i11www.iti.kit.edu/extra/publications/nw-dlhqm-10.pdf). Note: search summary only; I did not read the full papers.
- Mini Metro passenger behaviour (from developer forum posts, secondhand via search summary): passengers want any station of a matching shape, choose between direct and transfer routes, can abandon a route if a tight transfer is missed; seat reservation is a small part of the pathfinding; a 2017 passenger-AI rework took weeks because of many small bugs — [search summary of Dinosaur Polo Club posts](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)). Weak sourcing: no primary developer post was retrieved.
- svgmetro uses a BFS network router for passengers — [svgmetro](https://github.com/ujjwalvivek/svgmetro). tinytraffictown uses A* over a 3D road graph, with a headless sim — [tinytraffictown](https://github.com/pyrou/tinytraffictown)

### Inferences (design proposals, not sourced)
- **Octilinear line drawing for a game (not a layout optimiser):** the player drags between stations, so you do not need the papers' global optimisation. Per segment between consecutive stations A and B: dx, dy; use the dominant-axis rule: one diagonal leg of length min(|dx|,|dy|) plus one axis-aligned leg of the remainder, ordering (diagonal-first vs straight-first) chosen to minimise overlap or to follow the previous segment's direction (avoid sharp turns of more than 90 degrees). Corners are then rounded by trimming radius r from each leg end and drawing a quadratic/arc join (`arcTo`/`quadraticCurveTo` in Canvas, or Pixi Graphics `roundPath`/`arcTo`). Parallel lines sharing a corridor get offset perpendicular by lane index * lane width (offset computed from the polyline normal) - the most fiddly part; build it with unit tests.
- **Passenger routing:** model a graph whose nodes are (station, line) pairs; edges = ride along a line (weight = travel time) and transfer (weight = wait penalty). Mostly unweighted so BFS suffices; use Dijkstra if you weight by time. Recompute only when topology changes (cache next-hop per destination-shape), not per tick.
- **Grid-based road/canal (Motorways/Waterways):** integer grid, edge set of connected cells, A* with Manhattan heuristic for vehicles; dirty-flag recompute on edit. For a waterway variant, water vs land is just a per-cell mask.
- **Procedural spawning:** seeded RNG; candidate cell sampling with min-distance rejection (Poisson-ish) and a bias towards the existing centroid with expanding radius; pick shape from weighted table that unlocks over time. Draw all randomness from sim-owned RNG streams (one for spawns, one for cosmetics) so replays and daily seeds stay deterministic.
- **Loop:** fixed dt (e.g. 1/60 or 1/30 s), accumulate from `requestAnimationFrame`, interpolate positions of moving entities in render. Pause/speed-up = scale accumulator input, never change dt.
- **Input:** Pointer Events (`pointerdown/move/up`, `setPointerCapture`, CSS `touch-action: none` on the canvas) cover mouse, touch and pen with one code path; hit-test station radius generously (24 to 32 CSS px) for touch.

### Gaps
- No primary-source Mini Metro or Mini Motorways internals (GDC talks / developer blog) located.
- Full octilinear papers not read; no JS implementation of the Bast et al. grid-graph approach was identified (their C++ tool is "loom"; not verified here).
- Pointer Events / touch-action claims are from general knowledge, not fetched this session.

## 3. Procedural / generative audio with Web Audio API

### Takeaway
Skip audio files for the music: drive a small Web Audio graph (oscillators + gain + filter + convolver or delay) from a lookahead scheduler on `audioContext.currentTime`, and feed it from sim state (e.g. station count to harmony density, overcrowding to filter/tension). Create/resume the context inside a user gesture.

### Cited Findings
- Scheduling pattern: a ~25 ms timer schedules notes falling in a ~100 ms lookahead window on the Web Audio clock, giving precise timing despite main-thread jitter (tolerated a 50 ms stall) — [web.dev, A tale of two clocks](https://web.dev/articles/audio-scheduling)
- Autoplay policy: create or resume the `AudioContext` inside a user gesture; use `AudioParam` scheduling methods (`setValueAtTime`, ramps) for timed changes; generated sound via `OscillatorNode` or custom buffers; provide mute/volume controls — [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- Libraries mentioned by MDN: Tone.js (scheduling, synths, effects), howler.js, standardized-audio-context — same MDN page.
- svgmetro generates its audio procedurally with Web Audio (no samples) — [svgmetro](https://github.com/ujjwalvivek/svgmetro). mini-metro-js lists ambient audio as an unbuilt roadmap item — [mini-metro-js](https://github.com/Kaos599/mini-metro-js)

### Inferences
- Cheap reactive design: pick a pentatonic scale from the day's seed; each time a station is added or a passenger delivered, trigger a soft sine/triangle note quantised to the next 1/8 beat from the scheduler (a "sonification" layer that sounds like music because of the quantisation + scale). A slow pad (2 detuned oscillators through lowpass) whose cutoff and gain track a 0..1 "tension" value (crowding) gives the reactive ambience; smooth with `setTargetAtTime`.
- Hand-rolled graph is likely under 200 lines; Tone.js is worth it only if you want its transport/effects; its bundle cost is not measured here.
- Mobile Safari requires the user-gesture resume; wire it to the first tap on the start screen.

### Gaps
- No Web Audio benchmark for CPU on low-end phones; no published recipe specific to Mini Metro-like reactive scores.

## 4. Architecture, save/load, replays, testing, build, deploy, PWA

### Takeaway
Pure TypeScript simulation module (no DOM imports) that takes `(state, inputs, dt)` and a seeded RNG; renderer, audio and UI read state. Determinism makes save/load, replays and daily challenges nearly free: save = seed + input log (or state snapshot). Test the sim in Vitest headless. Build with Vite, deploy to GitHub Pages via Actions, optional vite-plugin-pwa.

### Cited Findings
- tinytraffictown uses exactly this separation: `core/` (Grid, Pathfinder), `sim/Simulation.ts` ("headless, no rendering"), `render/Renderer.ts`, `input/Input.ts`, `ui/UI.ts`, `storage/Storage.ts` (localStorage wrapper), plus autosave in `Game.ts`; strict TS, zero runtime dependencies — [tinytraffictown](https://github.com/pyrou/tinytraffictown)
- svgmetro: headless sim (BFS router, world state, tick manager) mirrored to SVG DOM through an update system with an element cache; the game can be saved as a playable SVG — [svgmetro](https://github.com/ujjwalvivek/svgmetro)
- Vite GitHub Pages deploy: set `base` to `'/<REPO>/'` for project sites, enable Pages with source "GitHub Actions", workflow runs `npm ci`, `npm run build`, uploads `./dist` and deploys — [Vite static deploy guide](https://vite.dev/guide/static-deploy.html)
- vite-plugin-pwa: zero-config, framework-agnostic, generates a Workbox service worker and the web app manifest; shown version v1.2.0 — [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/). Vite 8 compatibility was not stated on the page.
- Versions (2026-10-22): Vite 8.3.5, TypeScript 7.0.2, Vitest 5.0.5, PixiJS 8.22.0 (sources in section 1).

### Inferences
- State model: plain serialisable objects (ids not references), e.g. `{tick, rngState, stations[], lines[], vehicles[], passengers[]}`; RNG state is part of the snapshot. Avoid class graphs and `Date.now()`/`Math.random()` in sim code (lint rule).
- Replay = `{version, seed, inputs:[{tick, action}]}` re-run through the sim; add a state hash every N ticks to detect drift. Floating-point is deterministic enough within one JS engine; cross-browser divergence is possible for `Math.sin` etc., so prefer integer/fixed-step arithmetic or avoid transcendental functions in sim for a leaderboard-grade daily challenge.
- Tests: unit tests for geometry (octilinear router, lane offsets), router (graph cases), RNG determinism, and one golden-replay test (seed + inputs -> expected final hash). Playwright smoke test optional.
- Save: autosave snapshot to localStorage/IndexedDB with a `version` field and a migration function.
- PWA/mobile: manifest + service worker for offline, `touch-action: none`, `viewport-fit=cover`, handle `visibilitychange` to pause the sim and suspend audio.
- Workflow suggestion: one repo, `src/sim`, `src/render`, `src/audio`, `src/ui`, `tests`.

### Gaps
- vite-plugin-pwa compatibility with Vite 8 not confirmed; check its release notes before choosing.
- Cross-browser floating-point determinism not verified with sources.

## 5. Open-source clones on GitHub (stack, quality, lessons, licence)

### Takeaway
No high-quality, widely-used open-source web Mini Metro clone exists; the field is small hobby repos. Best learning value: tinytraffictown (sim/render split), svgmetro (headless sim + BFS + procedural audio), mini-metro-js (full feature loop, React+Canvas), and Mini-Waterways (directly on topic, MIT, but README-thin).

### Cited Findings
Data from GitHub search API, stars as of 2026-10-22 and README fetches.
- [Kaos599/mini-metro-js](https://github.com/Kaos599/mini-metro-js): TypeScript 5.8, React 19, Vite 6, Canvas; Apache-2.0; 4 stars; folders `engine/`, `components/`, `utils/`; draw-to-connect lines, procedural station spawning, shape-based passenger routing, weekly upgrades, Normal/Extreme/Endless modes, touch-first; ambient audio and interchanges on roadmap. Lesson: complete game loop and modes; README claims 60fps but gives no data.
- [CaptainPancakeWithBacon/Mini-Waterways](https://github.com/CaptainPancakeWithBacon/Mini-Waterways): TypeScript + Canvas, vanilla DOM, Vite, GitHub Actions + Netlify config; MIT; 3 stars; README lists mostly planned features (boat routes, tides, weather); credits an engine by erjbroek. Same theme as the target project; low maturity, so read as a skeleton only.
- [pyrou/tinytraffictown](https://github.com/pyrou/tinytraffictown): TypeScript strict, zero runtime deps, Canvas 2D, Vite, Pages via Actions; 5 stars; isometric traffic game; A* pathfinder over 3D road graph; headless sim; autosave; i18n. Licence not stated (no LICENSE file visible). README says it was built in about an hour with an AI model, so treat code quality as unreviewed. Best sim/render separation reference for the Motorways half.
- [ujjwalvivek/svgmetro](https://github.com/ujjwalvivek/svgmetro): TypeScript, Vite, SVG output (~53 KB, 18 KB gzipped); MIT; headless sim + BFS router, SVG DOM mirror with node cache, pointer-driven route editor, Web Audio synth; saves game as a playable SVG. Lesson: tiny footprint, procedural audio, clean sim/view split.
- [RyanEdo/mini-metro-web](https://github.com/RyanEdo/mini-metro-web): TypeScript/React, 198 stars (most starred found); this is a map editor/viewer for creating Mini Metro-style maps rather than a playable sim, per README; no licence listed. Lesson: UX of station placement and line creation; rendering method not described.
- [glouno/MiniMetroClone](https://github.com/glouno/MiniMetroClone): TypeScript, Vite, has `AGENTS.md` and `docs/`; no licence; 0 stars. Not evaluated beyond file list.
- [conradlempert/mini-metro-map-maker](https://github.com/conradlempert/mini-metro-map-maker): TypeScript tool for custom shapes for Mini Metro maps; 2 stars; no licence.
- [quentalt/mini-metro](https://github.com/quentalt/mini-metro): React + p5.js simulation; no licence.
- Non-web or other: [tvmaaren/mini-underground](https://github.com/tvmaaren/mini-underground) (C++), [ralucado/TinySubway](https://github.com/ralucado/TinySubway) (C#, MIT), [utilForever/infinity-motorways](https://github.com/utilForever/infinity-motorways) (Rust sim + RL, MIT, headless Motorways simulator, useful for rules), [matthewlimdiy/MiniMotorways](https://github.com/matthewlimdiy/MiniMotorways) (C).
- Original games are proprietary (Dinosaur Polo Club); avoid their assets and branding — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)). mini-metro-js frames itself as a non-commercial fan project.

### Inferences
- Licence caution: repos with no LICENSE file are all-rights-reserved by default; use them for ideas only, not code. Permissive ones (MIT: Mini-Waterways, svgmetro, TinySubway, infinity-motorways; Apache-2.0: mini-metro-js) could be adapted with attribution.
- Everything found is Canvas or SVG; none stress-tests PixiJS, so section 1's Pixi recommendation rests on general engine capability, not a precedent.
- Most repos are tiny and hobbyist (stars under 10 except mini-metro-web), so treat them as references, not as architecture to copy wholesale.

### Gaps
- I did not read source code of any repo (README and file listings only), so quality claims about line routing, rounding and tests are unverified.
- Searches were limited to GitHub's search API (first 10 results per query); further repos may exist (for example under topic tags).
- Game-industry postmortems/talks on Mini Metro/Motorways technology: none found.
