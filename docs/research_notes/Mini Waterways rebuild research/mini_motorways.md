# Mini Motorways (Dinosaur Polo Club): rules, systems and design

Legend: [CONFIRMED] = developer/official source (press release, dev blog, dev interview). [REVIEW] = single reviewer/guide observation. [COMMUNITY] = player-inferred, unverified. Research date 2026-10-22. Limits: ~14 tool calls; no wiki (Fandom returned HTTP 402), no GDC Vault access, no Reddit hits. No official numbers for spawn intervals, car speed or exact tile budgets were found.

## 1. Core loop and rules (houses, destinations, pins, roads, tools, upgrades, game over, score)

### Takeaway
Player draws roads on a tile grid so cars from coloured houses reach same-coloured destinations, which emit pins (trip requests). Each week the player picks one of two upgrade bundles (road tiles plus usually one special tool). The run ends when a destination's pin pile triggers a timer that fills. Score = completed trips.

### Cited Findings
- Draw roads on a grid to connect coloured houses (which contain cars) to same-colour buildings; buildings collect pins; too many pins starts a timer and the game ends if it fills — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- After each in-game week the player chooses an upgrade; it always includes extra road tiles and usually a special tool: bridges and tunnels, traffic lights, roundabouts, motorways — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Each week you choose from two random resource sets; one review describes each set as about 20 road tiles plus one special item — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]
- Weekly tools listed: roundabouts, traffic lights, bridges, tunnels, motorways; pausing is allowed to re-plan; a week lasts about 2.5 minutes at normal speed; the map zooms out over time adding terrain; spawn rates rise as the city grows — [Game Informer](https://www.gameinformer.com/review/mini-motorways/contemplative-commute) [REVIEW]
- Failure: "if even one destination backs up and people are stranded for too long, it's game over" — [Game Informer](https://www.gameinformer.com/review/mini-motorways/contemplative-commute)
- Pin overflow thresholds: 7 pins on square destinations, 10 on circular ones, then a warning timer; full timer = game over. Appears in search-result summaries without a primary source I could open — [Wikipedia search summary](https://en.wikipedia.org/wiki/Mini_Motorways) [COMMUNITY, unverified]
- Pin warning timer lasts roughly a minute; ticking sound plays while it runs — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]; [GamePretty](https://gamepretty.com/mini-motorways-strategy-guide-tips-for-you-to-start/) (ticking)
- Score is trips/pins collected (the game's achievements use "2000 trips"; challenges unlock at 1000 trips) — [Steam thread](https://steamcommunity.com/app/1127500/discussions/0/4410795316954451666) [COMMUNITY]
- Houses spawn with two cars; destinations spawn in a 2x3 footprint and later upgrade to Tier 2, generating more pins — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]
- A car departs only if a matching pin exists; it takes the shortest route and returns home after delivering; pin vanishes on arrival — [GamePretty](https://gamepretty.com/mini-motorways-strategy-guide-tips-for-you-to-start/); [Wikipedia search summary](https://en.wikipedia.org/wiki/Mini_Motorways) [COMMUNITY]
- Traffic light: alternates one direction at a time, suits small clustered intersections. Roundabout: cars pass without slowing much, bigger footprint, suits a single busy junction. Motorway: crosses over roads/buildings from point to point (not mountains per one search summary) — [GamePretty](https://gamepretty.com/mini-motorways-strategy-guide-tips-for-you-to-start/)
- Traffic lights widely criticised as often worsening traffic; roundabouts called the best anti-jam tool — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways); [Game Informer](https://www.gameinformer.com/review/mini-motorways/contemplative-commute)
- Dev: 9 months of prototyping to land on the simple tile-based road system; earlier concept was connecting cities across a country, scaled down to a city; inspirations include Justin Smith's Freeways, real maps, Mini Metro — via search summary of [Gfinity making-of](https://www.Gfinityesports.Com/features/the-making-of-mini-motorways-steam/) (page itself 404'd on fetch) [secondary]
- Rob Curry: the crisis point/failure is intentional because the game has to end somewhere — [Pocket Tactics](https://www.pockettactics.com/dinosaur-polo-club/interview)

### Inferences
- Minimal clone data model: grid of tiles; roads as tile edges/links; houses (colour, 2 cars); destinations (colour, 2x3 footprint, tier, pin count, overflow timer); inventory (tiles, lights, roundabouts, bridges, motorways).
- Failure is local (one destination), not global, so the overflow timer should reset when pins drop below threshold (not confirmed; assumption).

### Gaps
- Exact pin generation rate per destination/tier, exact thresholds (7/10 unverified), timer duration (reviewer "about a minute"), road tiles per bundle (reviewer "about 20"), starting tile count, car speed: no official numbers found.
- Whether bridges cost extra tiles in base game (only seen as a challenge modifier "bridges cost double").

## 2. Pathfinding, congestion, and spawning/demand scaling

### Takeaway
Cars take the shortest route and do not repath after leaving; congestion emerges from junction slow-downs and queueing on shared roads. Spawns are pseudo-random with clustering rules and a supply/demand balancer the devs say was the hardest part to tune.

### Cited Findings
- Cars slow when approaching a junction with another road; they do not slow at a house driveway joining their road; roundabouts best for crossing colours; winding roads to avoid junctions can help — [Steam thread](https://steamcommunity.com/app/1127500/discussions/0/4410795316954451666) [COMMUNITY]
- Cars do not repath after leaving; deleted road tiles linger as "ghost" tiles until cars using them finish (often 1-2 minutes) — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW, single source]
- Cars prefer closer destinations — [GamePretty](https://gamepretty.com/mini-motorways-strategy-guide-tips-for-you-to-start/) [COMMUNITY]
- Spawn: if the game can't find a valid spot for a new destination, it raises demand at an existing one instead — [Steam thread](https://steamcommunity.com/app/1127500/discussions/0/4410795316954451666) [COMMUNITY]
- Houses and destinations never spawn within 1 tile of an existing building, nor on roads; players block spawns with roads (e.g. roads every 3 tiles, staggered diagonals to deny any 2x3 area) — [Steam thread](https://steamcommunity.com/app/1127500/discussions/0/4410795316954451666); [GamePretty](https://gamepretty.com/mini-motorways-strategy-guide-tips-for-you-to-start/) [COMMUNITY]
- Algorithm clusters same-colour houses and places destinations far from them, otherwise unpredictable — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]
- Traffic grows geometrically so every run ends eventually — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]
- A dev said the hardest part was the supply/demand balancing algorithm (houses = supply, destinations = demand) and that at launch the team was too optimistic about house capacity per map — per search summary of Gfinity feature (unfetched) [secondary]
- Early concept art had diagonal spawning, since removed — [Dinosaur Polo Club blog](https://dinopoloclub.com/2023/07/23/behind-the-scenes-concepting-mini-motorways/) [CONFIRMED]
- Community rule of thumb: ~2 houses per square destination and ~4 per circle destination over ~10 road pieces — [search summary of GamePretty/Steam] [COMMUNITY, weak]

### Inferences
- Implementation: A*/Dijkstra over the road graph at trip start, path frozen; per-edge speed penalty at junctions; queues emerge from cars sharing lanes at junction nodes.
- Spawn scheduler: ramp a global rate; each event picks house vs destination to keep houses-per-colour / destination capacity balanced; search for a free footprint satisfying the 1-tile gap; fallback to demand increase.

### Gaps
- No official spawn intervals, house:destination ratios, colour palette order, or Tier-2 upgrade trigger. Car speed and lane/overtaking rules not documented. Reddit threads not found by search.

## 3. Maps, modes, difficulty, special rules, updates through 2026

### Takeaway
Roughly 27 city maps by 2026, four modes (Classic, Endless, Expert, Creative) plus daily/weekly/city challenges with modifiers. Per-map differences are mostly terrain; train-station mechanics came with crossover maps.

### Cited Findings
- Platforms/release: Apple Arcade Sept 19 2019; Steam July 20 2021; Switch May 11 2022; Unity; composer Disasterpeace — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Cities listed (27): Los Angeles, Beijing, Tokyo, London, Mumbai, New York City, Dar es Salaam, Moscow, Munich, Zurich, Manila, Rio de Janeiro, Dubai, Mexico City, Wellington, Warsaw, Chiang Mai, Lisbon, Busan, Reykjavik, Vancouver, Cairns, Copenhagen, Hong Kong, Cape Town, Istanbul, Singapore — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways). No Lagos map found; Rome is additional/upcoming.
- Endless mode (Nov 3 2022): no time limit, can continue after Game Over; upgrades earned via milestones/efficiency; 15 maps at that time — [Press release](https://gamespress.com/Mini-Motorways-Builds-Highway-to-Two-New-Game-Modes-with-The-Endless-E) [CONFIRMED]
- Expert mode: inspired by Mini Metro Extreme; roads and upgrades become permanent quickly; full upgrade set each week but the same upgrade can't be picked twice in a row; own leaderboards — same press release [CONFIRMED]
- Same update: multi-level manual zoom, preview city before choosing upgrade, custom colourblind options, controller options — same press release [CONFIRMED]
- Creative mode (free update, 26 Aug): no scoring; reposition/recolour houses and destinations on any map; extra upgrade options; fourth mode — [Pocket Gamer](https://www.pocketgamer.com/mini-motorways/creative-mode) (year not stated in fetch; likely 2025, unverified)
- Cape Town update released 17 Feb 2026: new map (Lion's Head, Table Mountain, coast), tunnels/bridges, new achievements, daily/weekly/city challenges; all maps playable in Classic, Endless, Expert, Creative. 2026 roadmap: June new map + Creative additions; September community surprise; December another new map — [Dinosaur Polo Club](https://dinopoloclub.com/2026/02/17/beep-beep-our-next-stop-in-mini-motorways-is-cape-town/) [CONFIRMED]
- Rome map (land + waterway design) announced for Winter 2026, free; ">9 million players" — [Press release](https://www.gamespress.com/The-MIX-Fall-Mini-Motorways-Celebrates-7-Year-Milestone-Coming-to-Rome) [CONFIRMED]. Note: this release says "launched 2021", while Apple Arcade launch was 2019; Rome vs the roadmap's December slot may be the same release (unconfirmed). Past additions: Hong Kong, Istanbul, Iceland (Reykjavik), Singapore.
- July 2023 Miniversary update: New York, London, Mumbai, with train stations/tracks from Mini Metro that interact with traffic; London and Mumbai got roundabouts/highways; NYC chosen by community vote — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways); [TouchArcade](https://toucharcade.com/2023/05/08/mini-metro-motorways-10th-anniversary-update-release-date-new-maps-features-trains-iphone-android-apple-arcade-switch-steam-pc)
- Cairns ("Down Under", Dec 2024) and Copenhagen ("Spires and Tires", ~Mar 2025) — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Per-city challenges: up to three unlockable after 1000 trips on the map; each has 2-3 modifiers (boons/banes) — search summary of [TV Tropes](https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/MiniMotorways) [COMMUNITY]
- Daily/weekly challenge modifiers seen in reviews: half road pieces, unlimited road tiles, mystery upgrades, straight roads cost double, bridges cost double tiles, doubled weekly upgrades, indestructible trees; dailies single attempt, weeklies unlimited, shared seed leaderboard; Extra for Experts update (May 2023) added a weekly Expert-mode daily — [Dinosaur Polo Club](https://dinopoloclub.com/2023/05/04/buckle-up-for-new-daily-challenges-with-the-extra-for-experts-update/); [Game Informer](https://www.gameinformer.com/review/mini-motorways/contemplative-commute)
- Mountains block roads; motorways pass over buildings/roads (mountains exception per one summary) — [GamePretty/TVTropes search summaries] [COMMUNITY]
- Pricing: Steam $9.99, Switch $14.99, Apple Arcade subscription — [Press release](https://gamespress.com/Mini-Motorways-Builds-Highway-to-Two-New-Game-Modes-with-The-Endless-E)

### Inferences
- Difficulty scales via spawn rate and zoom-out/map growth, not via per-mode rules; per-map terrain (rivers needing bridges, mountains, bays) shapes placement.
- A Mini-Waterways-style clone could map "map = terrain + seed + modifiers" as data.

### Gaps
- No per-map special rules for Tokyo, Dar es Salaam, etc. found beyond terrain; Lagos not in any roster. Exact map-by-map release dates, Creative mode year, and the June/Sept 2026 outcomes not verified (search returned only the roadmap).

## 4. UX, visual design, input, accessibility, audio

### Takeaway
Soft flat-colour minimalism, simple click/drag road tiles, strong readability; audio is procedural by Disasterpeace.

### Cited Findings
- Minimalist UI and art make building status easy to track in busy moments; controller cursor precise but error-prone under pressure; touch drawing on handheld — [Game Informer](https://www.gameinformer.com/review/mini-motorways/contemplative-commute)
- Colourblind options, controller support, manual zoom — [Press release](https://gamespress.com/Mini-Motorways-Builds-Highway-to-Two-New-Game-Modes-with-The-Endless-E) [CONFIRMED]
- Auto-save; returning to main menu overwrites it — [Steam thread](https://steamcommunity.com/app/1127500/discussions/0/4410795316954451666) [COMMUNITY]
- Art evolution: isometric concept built around overpass; mountains iterated; roads with dashed centre lines in concepts; art team lead credits (Poppy de Raad, Blake Wood) — [Dinosaur Polo Club](https://dinopoloclub.com/2023/07/23/behind-the-scenes-concepting-mini-motorways/); [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Audio: Disasterpeace talk on "procedurally generated harmony and rhythm" and DSP in Mini Motorways — [Disasterpeace](https://disasterpeace.com/blog/mini-motorways.talk). For Mini Metro, nearly all sound is samples triggered in real time by player actions and music was meant to offset stress — [Designing Sound](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace). Reviewers praise ambient mix; car horns as useful cue — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Reviewer complaint: cheerful look vs car-centric theme; delayed feedback and no rerouting feel unfair — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]

### Inferences
- Faithful audio: pentatonic/harmony system with notes triggered by trips and pin events, ticking for overflow warning, horns for stuck cars.

### Gaps
- No exact palette hex values, day/night details, undo/delete input rules (reports only that deleting leaves ghost tiles, single source), or Mini Motorways-specific audio postmortem content (page redirects to a postmortem not fetched).

## 5. Design philosophy vs Mini Metro, developer statements, known numbers

### Takeaway
Devs call it "predictable chaos": indirect control (routing via roads, not driving cars) with an intentional inevitable crisis. Mini Metro is explicit planning of lines; Motorways is shaping a network cars self-route through.

### Cited Findings
- "Predictable chaos": players control drivers only partly and must build routes unlikely to cause delays; crisis is intentional — [Pocket Tactics](https://www.pockettactics.com/dinosaur-polo-club/interview) [CONFIRMED]
- Studio describes Mini games as simple, approachable, tied to everyday concepts — via search summary of dev blog [secondary]
- Mini Metro designed "verbally in about half an hour", final design nearly unchanged — [Pocket Tactics](https://www.pockettactics.com/dinosaur-polo-club/interview)
- Expert mode explicitly borrows from Mini Metro Extreme — [Press release](https://gamespress.com/Mini-Motorways-Builds-Highway-to-Two-New-Game-Modes-with-The-Endless-E)
- Reviewer: Mini Metro's planning layouts hold interest more; Motorways punishes unfairly via delayed feedback, small toolset, no rerouting; spawn blocking is the dominant exploit — [Scientific Gamer](https://scientificgamer.com/thoughts-mini-motorways/) [REVIEW]
- Pocket Gamer criticised the frantic pace; Metacritic iOS 80, PC 87, Switch 81 — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)
- Credits: designers Robert Curry, Niamh Fitzgerald; programmers incl. Peter Curry; Unity — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Motorways)

### Inferences
- Key contrast for a clone: Metro = player owns the vehicle schedule/lines; Motorways = player owns static infrastructure, agents are autonomous, so failure feels like an emergent traffic jam rather than a wrong plan.

### Gaps
- No direct dev comparison of the two games found; GDC "Expanding the Miniverse" talk content (GDC Vault, login-gated) and the full Gfinity making-of not read. Treat shapes.inc "deep dive" claims (e.g. "2026 meta", "motorway flicking") as unverified and unused.
