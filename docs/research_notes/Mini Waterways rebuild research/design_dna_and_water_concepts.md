# Design DNA of Mini Metro / Mini Motorways and water-themed concepts ("Mini Waterways")

Research date: 2026-10-22. Method: web search + page fetches. Developer primary material on design philosophy was thinner than expected (several interview pages were truncated, 403 or 404); where a claim in the brief (no tutorial text, slow-fail, "one more game") could not be sourced to the developers, it is listed under Gaps and not asserted as fact.

## Q1. What design principles recur in Mini Metro and Mini Motorways?

### Takeaway
The documented, citable DNA is: scope-driven constraints (minimal art, no hand-built levels, so procedural maps), you design infrastructure and watch autonomous units use it, a weekly reward/upgrade beat with a small limited toolset (bridges/tunnels as scarce items), information carried by abstract shapes/colours and by sound, and a procedural soundtrack that doubles as a state indicator. Slow-fail and "one more run" are supported by reviewers, not by developer statements I could find.

### Cited Findings
- Constraints were set to limit scope: minimal art, no reliance on audio, no hand-built levels, which led to procedurally generated levels. Mini Metro began as "Mind the Gap" at Ludum Dare 26 (April 2013, theme minimalism; ranked first in Innovation); Unity; Early Access Aug 2014, full release 6 Nov 2015. — [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro "discards" 3D environments, physics and economic systems to keep the essence (connecting stations); Robert Curry says the minimalism made the game hard to make. — [Indieorama (via search snippet; page itself 404 on fetch)](https://www.indieorama.com/mini-metro-and-robert-curry-the-minimalism-was-one-of-the-things-that-made-the-game-hard-to-make)
- Studio's "ridiculous amount of work that goes into minimalist games"; each asset needs careful design even though fewer assets were expected to be simpler; Robert: pairing programming with design means you "enjoy creating the problem and also solving it"; development is "a conversation with the community"; the team has repeatedly reacted to unexpected player responses (a Hong Kong map bug that spawned passengers faster was replaced by double trains because players liked it; a beta map-screen redesign was reverted after players liked the old one). — [Dinosaur Polo Club, "A chat with the devs, part two" (2023)](https://dinopoloclub.com/2023/07/20/a-chat-with-the-devs-part-two/)
- Core framing: Mini Metro's goal is to design infrastructure and watch how units use it, not command units directly; Mini Motorways swaps line-dragging for a grid-based, Sims-like build mode with a trash mode, adds traffic lights, bridges and overpasses, and shows vehicles moving so players spot bottlenecks. Reviewer notes Motorways' visuals are "a little less clear" than Metro's but more recognisable, and touch input reduced precision. — [Super Jump Magazine](https://www.superjumpmagazine.com/from-game-jam-idea-to-mobile-classic/)
- Mini Metro rules: stations overcrowd at a limited capacity (typically six passengers); rivers must be crossed with a limited supply of tunnels/bridges; new assets are earned each in-game week; modes are Normal, Extreme (lines cannot be changed once placed), Endless, Creative. — [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Motorways rules: connect coloured houses to same-coloured destinations; destinations accumulate pins (7 for square, 10 for round buildings); overflow starts a warning timer and the game ends when it fills; a week lasts ~2.5 min; after each week choose one of two upgrades, both include road tiles and one always includes a special tool (bridge, tunnel, traffic lights, roundabout, motorway). — [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways) (fetched via tool summary; the direct page returned 403 on a first attempt, second fetch succeeded)
- Mini Motorways was partly inspired by Justin Smith's "Freeways" and took months of road-mechanic experiments; Robert Curry called it much harder to build than Metro (about six months of hard work to get into shape). — [Twinfinite interview summary via search snippet](https://twinfinite.net/2021/07/mini-motorways-interview-dinosaur-polo-club-talks-aesthetics-traffic-their-name/) (page itself paywalled/blocked on fetch; treat as secondary)
- Procedural soundtrack by Rich Vreeland (Disasterpeace): "The gameplay essentially serves as the music's conductor"; chord choice uses a "Common Tone Chord Network"; music is an information channel so players can hear whether the city is working; car horns are slightly out of tune, driven by a per-driver "generosity score", and kept "just annoying enough" to signal growing problems; per-vehicle constant pitch was abandoned as overwhelming. Peter Curry is programmer and "vision holder". — [Game Developer: Turning road noise into music in Mini Motorways](https://www.gamedeveloper.com/design/turning-road-noise-into-music-mini-motorways)
- Mini Metro won Excellence in Audio at IGF 2016; Disasterpeace's procedural audio was inspired by Philip Glass and Steve Reich. — [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Reviewer language for the loop: "At its heart, Mini Motorways is about failure. Every attempt ratchets up in difficulty until the tipping point of inevitable failure"; another reviewer said the ramp made them say "just one more run"; early game is a single house and destination, then buildings appear faster. — [OpenCritic Mini Motorways reviews aggregation (search snippets)](https://opencritic.com/game/11703/-/reviews), [The Sixth Axis](https://www.thesixthaxis.com/2022/07/04/mini-motorways-review-switch-apple-arcade/)
- A reviewer found Metro's auto-generated pathing made a problem "an annoyance to fix rather than a fun puzzle", whereas Motorways' freely drawn roads give more control. — [RAWG review (search snippet)](https://rawg.io/games/mini-motorways/reviews)
- Critics praised Motorways' soundtrack, minimalist art, colourblind mode, calm/difficulty balance; Rock Paper Shotgun praised horns as warning cues; the traffic-light upgrade drew criticism for often making traffic worse; Pocket Gamer found the pace frantic. Metacritic: Motorways iOS 80 / PC 87 / Switch 81; Metro PC 77 / iOS 89 / Switch 86. — [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways), [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Pocket Gamer found Metro's early game confusing (i.e. onboarding is not universally praised). — [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Rob Curry on origin: "I just really enjoyed having to get from A to B on the train"; routing through a transit network as a puzzle was the core; the pitch pre-dated the London trip. — [Pocket Tactics, GDC 2023](https://www.pockettactics.com/mini-metro/london)
- Studio grew from ~8 to 26 staff after Motorways' success. — [Wikipedia: Dinosaur Polo Club](https://en.wikipedia.org/wiki/Dinosaur_Polo_Club)

### Inferences
- Synthesised principle list for a design brief: (1) one verb per game (draw line / lay road); (2) autonomous agents so the player designs the system, not the units; (3) procedural generation so scope stays tiny; (4) one scarce "break the geography" resource (river crossing) per week; (5) binary-readable state (shape = type, colour = group, a ring/timer = danger); (6) failure by accumulation of a visible local overload, not hidden global metrics; (7) audio as feedback channel; (8) a two-option weekly choice that forces an opportunity-cost decision.
- The user-supplied "no tutorial text" and "slow-fail" principles are consistent with the sources (timer-based overflow gives a warning window) but are my reading, not developer-stated.

### Gaps
- No GDC talk transcript with design-principle detail was retrievable (Pocket Tactics GDC 2023 piece is a thin summary). Giant Bomb's Peter Curry interview and the Pocket Tactics DPC interview page were truncated in search; worth a direct manual read.
- No developer statement found on tutorial philosophy, on "one more game" as an intent, or on balancing curves.
- Twinfinite, Indieorama and Gfinity pages could not be fully fetched.

## Q2. Essence vs. incidental (critics and players)

### Takeaway
Critics converge on: minimal readable visuals, audio feedback, a calm-then-tense ramp, and the player's control over system layout are the essence. Theme (trains/roads), map realism, specific tool sets and even abstraction level appear incidental, since Motorways deliberately loosened abstraction and the lineage still reads as the same family.

### Cited Findings
- Critics praise intuitive interface, relaxing tone and minimalist design (Rock Paper Shotgun: "mesmerising challenge of logic and aesthetics"). — [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Motorways traded some abstraction for recognisable buildings/landscape to support a more complex building system, at some cost to clarity. — [Super Jump Magazine](https://www.superjumpmagazine.com/from-game-jam-idea-to-mobile-classic/)
- Frustration/agency finding: free-draw control was preferred to auto-pathing (see Q1, RAWG). Panic when a working route suddenly fails, and honks alerting to jams, are noted both as downside and as key feedback. — [OpenCritic/Sixth Axis snippets](https://www.thesixthaxis.com/2022/07/04/mini-motorways-review-switch-apple-arcade/)
- Weekly-upgrade decisions are the strategic layer: players "carefully manage upgrades to meet the changing demands." — [MikeTendo64 interview write-up](https://miketendo64.com/2022/08/14/interview-mini-motorways/)
- Cross-pollination in 2023: Mini Motorways got trains and stations from Metro in its "Miniversary" update, showing the systems are interchangeable modules. — [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Mini Metro itself is described by a reviewer as a management puzzler under a transit theme. — [Tampere Univ. Playlab review (search snippet)](https://blogs.tuni.fi/playlab/game-reviews/mini-metro-bite-sized-puzzle-strategy-game-wrapped-in-a-minimalistic-atmosphere-of-transit-craze/)

### Inferences
- Essence: legible overload + limited re-planning budget + procedural escalation + sensory feedback. Incidental: stations as shapes, specific city maps, pins as the score unit, even the fail rule.
- Weak spot to improve on: the traffic-light upgrade is widely seen as a trap (low-value choice), and Metro's auto-routing removes agency. A water game should make every weekly option have a real use case.

### Gaps
- No systematic player-survey or Steam-review corpus analysed (Steam pages not readable in this tool); player sentiment is from reviewer snippets only.

## Q3. Existing clones, fan games, similar titles; licensing/IP

### Takeaway
Open-source Metro/Motorways clones are all tiny student projects (few stars, mostly unlicensed); there is already an MIT-licensed, early-stage "Mini-Waterways" repo, plus itch.io ferry prototypes. The only commercial cases with friction were name/trade-dress copycats (Mini Subway removed from the Switch eShop; Mini Airways criticised for naming). Copy mechanics freely, not the "Mini" name, look, or assets.

### Cited Findings
- GitHub Mini Metro clones: tvmaaren/mini-underground (C++, 4 stars, no licence), ralucado/TinySubway (C#, MIT, 3 stars), ObsidianSeal/SmallSubways (Java), glouno/MiniMetroClone (TypeScript), others with 0-1 stars; none are notable. — [GitHub search API](https://api.github.com/search/repositories?q=mini+metro+clone&sort=stars&per_page=10)
- Motorways-likes on GitHub: pyrou/tinytraffictown (TypeScript, isometric, 5 stars), nickpatelcs/MiniMotorways (Python, course project), utilForever/infinity-motorways (Rust, MIT, RL simulator), wenkwonk/minimotorwayer (bot). — [GitHub search API](https://api.github.com/search/repositories?q=mini+motorways+in:name,description&sort=stars&per_page=10)
- **CaptainPancakeWithBacon/Mini-Waterways** (TypeScript, HTML5 Canvas, MIT, 3 stars, 21 commits): README describes a boat-route game with towns, industrial ports and clean-water stations; planned weather/tides, hydro/tidal energy, sustainability scoring; "Current Features: None". Name overlap with this project is worth noting. — [GitHub](https://github.com/CaptainPancakeWithBacon/Mini-Waterways)
- Itch.io: "Mini Ferry" (NYC Ferry tribute, one-level prototype, no transfers, ends at cycle 50) — [itch.io](https://brpasiliao.itch.io/mini-ferry); "Mini-Ferries" (Baltic/Tallink advergame, one-week course project; draw lines between ports, ships follow them, sharp bends delete the line, game ends when a port has too many waiting passengers) — [itch.io](https://levartar.itch.io/mini-ferries); "Boats & Merchants" (idle/Mini-Metro-inspired, thin page) — [itch.io search result](https://hubertloz64.itch.io/boats-merchants/community); "Mini Trains" (railway builder inspired by Motorways, browser playable) — [lafferty.itch.io](https://lafferty.itch.io)
- Commercial: Mini Airways (CCC Games, 2024) is an ATC game inspired by Metro/Motorways; devs say no code/art shared; commenters called the name/style "blatant plagiarism" while another found gameplay distinct enough. — [GamingOnLinux](https://www.gamingonlinux.com/2024/03/mini-airways-is-like-mini-metro-mini-motorways-but-for-aircraft)
- Mini Subway (Switch eShop, 2022) closely copied Mini Metro; DPC: "While we always try to reach out to the developers first, if required, we will take legal action"; the game was removed from the eShop. — [Nintendo Life](https://www.nintendolife.com/news/2022/08/mini-metro-copycat-game-has-been-removed-from-switch-eshop)
- DPC says it evaluates each reported clone for trademark infringement; a commenter says DPC apologised for how it handled the earlier "All Quiet Roads" case (unverified: the apology link was behind a login). — [search results incl. GamingOnLinux comments](https://www.gamingonlinux.com/2024/03/mini-airways-is-like-mini-metro-mini-motorways-but-for-aircraft)

### Inferences
- Common failures in prototypes: no escalation curve beyond "ends after N cycles"; no weekly choice layer; sharp-bend line deletion is a UX trap; sustainability/energy theming in the Mini-Waterways repo adds feature lists but no tension core.
- IP (not legal advice): game mechanics and general genre ideas are generally not protected by copyright; names, logos, art, music, code and close trade dress are. Safe-borrow list: autonomous agents, weekly choice, overflow timers, procedural maps, river-crossing scarcity. Avoid: "Mini" prefix naming, DPC colour palette/shape-set look-alike, copying their UI layout, their sound assets. Verify any trademark status of "Mini Metro"/"Mini Motorways" with a registry search before using "Mini Waterways" as a public title; for a private/school project, pick a distinct working title.

### Gaps
- Did not find any commercial canal/lock puzzle title in this genre; search was weak (Steam pages unreadable). Mini Airways and Mini Motorways trademark registrations not looked up. Mini Subway legal basis (trademark vs copyright) not stated in sources.
- Playability/quality of itch.io games not tested.

## Q4. Water-specific mechanics and 3-5 concept directions

### Takeaway
The best fit are mechanics that act as the "river crossing" analogue (a scarce infrastructure item) or as a hidden-but-legible capacity constraint: locks (throughput bottleneck with a cycle time), water budget at a summit (resource that is a visible number), and tides/flow direction (time-varying edge direction). Floods/drought work as slow, telegraphed pressure events. All are feasible in 2D Canvas.

### Cited Findings
- Lock cycle: fill/drain chamber, open gates, boat enters, close, level, exit; a full operation usually takes 10-20 min; meeting an oncoming boat saves 5-10 min; flights treated as units; staircases share gates and require the whole staircase to be full/empty first; convoys use less water; side ponds recycle water; twinned locks synchronise. — [Wikipedia: Lock (water transport)](https://en.wikipedia.org/wiki/Lock_(water_transport))
- Boat lifts / inclined planes are alternatives; the Foxton inclined plane failed early for high running cost, Three Gorges lift serves vessels under 3,000 t. — [Wikipedia: Lock (water transport)](https://en.wikipedia.org/wiki/Lock_(water_transport))
- Canals above sea level draw water from rivers/springs (supplemented for seasonal flow), reservoirs and back-pumping, sometimes long feeder canals; aqueducts can avoid lock delays; towpaths were standard for horse-drawn boats. — [Wikipedia: Canal](https://en.wikipedia.org/wiki/Canal)

### Inferences (concept directions; design proposals, not sourced)
Shared rule across all: procedural map with rivers/lakes/hills; endless waves of new nodes; weekly 2-choice upgrade; overflow-timer failure; palette and shapes deliberately unlike DPC's.

1. **Lock Flight (throughput puzzle)**. Player lays canal tiles on a heightmap; every elevation step needs a lock. Locks have a cycle time and a capacity of one boat per direction at a time; paired opposing traffic saves cycles (from the Wikipedia fact). Weekly upgrades: second chamber, side pond, boat lift. Pros: strong, readable bottleneck, direct analogue of Motorways' intersections; real mechanic. Cons: heightmap generation and legibility of elevation in flat 2D; risk of becoming a pure queueing puzzle.
2. **Summit Water Budget (resource network)**. Water is the traffic: each lock use drains the summit pound; feeders/reservoirs refill depending on a seasonal rain curve; drought shrinks supply. Weekly choice: reservoir, pump, water-saving basins. Pros: a fourth dimension (supply planning) nothing in Metro/Motorways has; drought gives a slow, telegraphed pressure. Cons: two coupled systems (boats + water) may overload new players; needs a very clear single gauge.
3. **Tidal Harbour (time-varying direction)**. Estuary map: channels flow with the tide; some stretches are only navigable at high water; boats wait for windows; dredging as the weekly tool to deepen channels. Pros: periodic rhythm gives a pulse that audio can follow; unique vs. both parents. Cons: tide timing interacts with weekly timer; "wait for window" may feel passive.
4. **Flood and Irrigation (supply network, Motorways-like)**. Instead of boats ferrying passengers, the player digs channels and sluices to deliver water from rivers/reservoirs to colour-coded farms/towns; flood events overflow low-lying channels; dams hold back supply. Pros: closest to Motorways structure while being water-native; no agents needed (flow simulation), which is cheaper. Cons: flow simulation is less "watching little agents", losing the charm of vehicle motion; hard to keep legible.
5. **Ferries, Bridges and Open Spans (multi-modal crossings)**. A river-city map where road/foot traffic crosses; the player chooses bridges (block boats), swing/lift bridges (open on a schedule, halting land traffic), ferries, or tunnels; boats and land traffic conflict at the same node. Pros: very simple geometry, strong trade-offs, great for 2D; mixes both parent mechanics in a new way. Cons: edges toward being a Motorways reskin if not careful; needs distinct goals for boats.

Suggested prototype order: 1 + 2 combined at small scale (locks consume summit water) is likely the most distinctive; 5 is cheapest to build; 4 if you want zero agent-routing work.

Technical feasibility note: all five fit Canvas/WebGL in TypeScript; direction 3 and 4 need a small grid flow/water-level sim (hundreds of cells, trivial on modern browsers); pathfinding on a weighted graph with per-edge cooldowns covers 1, 2 and 5.

### Gaps
- Real canal logistics beyond Wikipedia (tide tables, dredging cycles, lift/swing bridge opening schedules, drought restrictions on UK/Dutch canals) were not researched with primary sources; swing/lift bridge and tidal canal details came back absent from the fetched Canal article.
- No playtest data for any of these concepts; pros/cons are design judgement.
