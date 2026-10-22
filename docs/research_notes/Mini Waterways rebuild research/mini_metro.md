# Mini Metro (Dinosaur Polo Club): core rules, systems and design

Research depth note: ~13 tool calls. The Fandom wiki returned HTTP 402, so exact spawn rates, week length, and per-shape frequencies were NOT found in any source I could open. Numbers below are labelled CONFIRMED (developer/official/store), SOURCED (third-party text), or UNVERIFIED.

## Core loop: stations, lines, trains, passengers, upgrades, modes

### Takeaway
You draw coloured lines between stations; trains run automatically and carry shape-coded passengers to a station of the matching shape; each week you pick one of two upgrades; the game ends when a station stays full for too long. Normal, Endless, Extreme and Creative differ mainly in failure and editing rules.

### Cited Findings
- Premise: stations in various shapes appear randomly over time; small shapes appear beside stations and each passenger's shape shows which station type it must reach (matching by shape, not location). Trains run automatically and load/unload. Time can be paused to reroute lines or move trains between lines. Station count and ridership grow over time. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Fail condition: the game ends when a station stays overcrowded too long; a countdown circle appears at the station and ends the game if it completes while the station is still full. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)); [search summary of Giant Bomb/Untapped Cities](https://giantbomb.com/wiki/Games/Mini_Metro)
- Overcrowding threshold: "about six passengers" per station under standard rules. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)) (single source; the "18 for interchange" figure I tried to verify was NOT found anywhere).
- Overcrowding timer: SOURCES CONFLICT. Giant Bomb says 10 seconds at capacity without service; Pocket Gamer says 45 seconds. — [Giant Bomb](https://giantbomb.com/wiki/Games/Mini_Metro); [Pocket Gamer](https://www.pocketgamer.com/mini-metro/review/) (as reported by search summary, pages not opened). Untapped Cities adds that shapes at a crowded station jump around as a warning before the circle appears. — [Untapped Cities](https://www.untappedcities.com/build-your-own-subway-system-with-mini-metro-game/)
- Trains: one train carries 6 passengers; train + 1 carriage = 12. Max trains per line typically 4-6; carriages have a separate per-line max, so they can be added after the train cap is hit. — [hamy.xyz strategy guide](https://hamy.xyz/blog/2024-03_mini-metro-best-upgrades) (fan guide). Developer-side audio engineering note gives load limits of max 7 lines per city, 4 locomotives per line, 4 carriages per locomotive. — [Designing Sound interview with Disasterpeace](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace)
- Early build (alpha10, 30 Apr 2014, official changelog): railcar capacity started at 4; upgrades offered from week 3 as two picks from two pools; upgrades split into Line / Double Tracks (second locomotive) / Carriages (two carriages on one line); carriages loaded in parallel only at interchanges; unique stations often replaced existing circle or triangle stations; more stations in later weeks. Early-build, may not match current values. — [DPC alpha10 post](https://dinopoloclub.com/2014/04/30/mini-metro-alpha10/)
- Weekly reward: each in-game week gives rolling stock/assets; choices include extra carriage, new line (max 6-7 depending on map), tunnels/bridges (a pair), interchange, plus map-specific upgrades (e.g. fast train on Osaka). Choose-one-of-two presentation. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)); [Giant Bomb](https://giantbomb.com/wiki/Games/Mini_Metro); [hamy.xyz](https://hamy.xyz/blog/2024-03_mini-metro-best-upgrades)
- Interchange: a station upgrade that raises station capacity and speeds loading/unloading/transfers. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Strategy conventions (community): keep one spare line and one spare crossing for restructuring ("ghost line"); carriages are usually the best default; interchanges usually the weakest. — [hamy.xyz](https://hamy.xyz/blog/2024-03_mini-metro-best-upgrades)
- Station type meaning (one player blog, speculative): circles most common, triangles second, squares frequent, rarer shapes (cross, gem/diamond, etc.) appear once or twice. Early dev note confirms that unique stations replace circle/triangle ones. — [GGWash/older player write-up, via search](https://ggwash.org/view/34013/fun-on-friday-play-the-mini-metro-game); [DPC alpha10](https://dinopoloclub.com/2014/04/30/mini-metro-alpha10/)
- Modes: Normal (maximise ridership until a station overcrowds); Extreme (lines and assets cannot be adjusted, moved or removed once placed; each map unlocks for Extreme via a specific feat under a restraint); Endless (stations never overcrowd; assets are awarded by ridership instead of time; success measured by efficiency); Creative (sandbox added 2018, create/adjust/add stations); Daily Challenge (added in early access, compete worldwide). — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)); [Steam](https://store.steampowered.com/app/287980/Mini_Metro/); [App Store listing](https://apps.apple.com/vn/app/mini-metro/id837860959)
- Switch version has a multiplayer mode exclusive to that platform. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Passenger routing: developer Robert says the "reservation system" is "a very small part of the pathfinding system"; passengers only reserve seats on trains about to stop at the station, to avoid multiple trains stopping for the same demand; he admits he "may have oversold" it. Pathfinding bug found Jan 2017. — [Steam discussion](https://steamcommunity.com/app/287980/discussions/0/144513670981776015). Peter Curry: the passenger/train AI is "far and away the most complex thing in Mini Metro", "the cause of most of the feedback we get", the one part players do not control, and "it'll never be perfect". — [Digitally Downloaded](https://www.digitallydownloaded.net/?p=44565). Search summary of another dev post: search gets more conservative about tight transfers as it predicts further ahead; a later system discourages routes involving waiting at overcrowded stations (page not opened). — [Steam discussion](https://steamcommunity.com/app/287980/discussions/0/144513670981776015)
- Spawn rate: a Steam thread reports sudden bursts (~16 passengers per station near ~1800 passengers delivered); a dev called it too fast and asked for logs, so likely a bug, not design. — [Steam discussion](https://steamcommunity.com/app/287980/discussions/0/135507780428493386/) (snippet only).

### Inferences
- A faithful clone needs: station graph, shape-typed passengers, line = ordered list of stations (loops allowed), trains shuttling back and forth (or around loops), per-passenger pathfinding over the line graph that minimises travel/transfers and accounts for what train will stop next.
- Passenger routing rule of thumb implied by the sources: pathfind by destination shape (any station of that shape works), choose the shortest route including transfers, reserve a seat to avoid over-stopping. Exact cost function is unknown.
- Overcrowding is a per-station timer that fills while count >= capacity and drains when below; capacity ~6 (interchange higher).
- "Week" is a clock-driven tick (the game shows days of the week); I did not find its length in seconds.

### Gaps
- Exact overcrowding timer (10 s vs 45 s conflict), week length in real seconds, spawn-rate curve and per-shape probabilities, interchange capacity, loading speed per passenger, train speed, per-city line/crossing counts, and Extreme unlock feats: not found (Fandom wiki blocked, 402).

## Per-city mechanics and difficulty scaling

### Takeaway
Cities differ in colour theme, water obstacles, pace, and one or more map-specific rules/upgrades; difficulty scales by growing station count and passenger volume over time.

### Cited Findings
- Over two dozen real-world cities each with own colour theme, obstacles and pace; random city growth. — [Steam](https://store.steampowered.com/app/287980/Mini_Metro/)
- 34 cities as of Sept 2023 (Wikipedia, marked as needing citation): London, Paris, Warsaw, Lisbon, Budapest, Berlin, Barcelona, Stockholm, St. Petersburg, Istanbul, New York, Chicago, Boston, Montreal, San Francisco, Sao Paulo, Santiago, Washington D.C., Tokyo, Melbourne, Hong Kong, Osaka, Seoul, Tashkent, Singapore, Shanghai, Guangzhou, Nanjing, Chongqing, Mumbai, Auckland, Cairo, Addis Ababa, Lagos. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Rivers/water need tunnels or bridges from a limited weekly supply. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Historical alternate maps: London 1960, Paris 1937, New York 1972 (25 April 2018). — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- City-specific behaviours seen via audio design: Osaka has a unique Shinkansen (fast) train; in Berlin circle and square passengers appear on the hour, triangles at half past, other shapes at quarter marks (spawn timing tied to the in-game clock); Sao Paulo slows the game clock (envelopes lengthen). — [Designing Sound](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace). Map-specific upgrades exist per city. — [hamy.xyz](https://hamy.xyz/blog/2024-03_mini-metro-best-upgrades)
- Difficulty: ridership and station count grow over time; Rock Paper Shotgun praised how it "descends into chaos". — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))

### Inferences
- Rivers are best modelled as polygons; any line segment crossing them consumes a crossing token; city maps define water, start stations, palette, and optional special rules.

### Gaps
- Per-city rule list (beyond Osaka, Berlin, Sao Paulo, Cairo etc. in audio terms) not found; difficulty curve numbers not found.

## UX, visual design, input, accessibility

### Takeaway
Transit-map minimalism: flat shapes and bold line colours, drag-to-draw lines, pause-to-edit, with colourblind and night modes.

### Cited Findings
- Visuals imitate modern transit maps with straight lines and bold colours. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Inspiration: Rob Curry enjoyed getting from A to B on the London Underground and found route choice "an interesting puzzle". — [Pocket Tactics GDC 2023](https://www.pockettactics.com/mini-metro/london)
- Lines are drawn and extended by dragging between stations; redraw as new stations open (store descriptions). — [Steam](https://store.steampowered.com/app/287980/Mini_Metro/)
- Accessibility: colourblind mode, night mode, mouse-only and touch-friendly tags, 24 extra languages. Finished maps can be saved/shared; Steam Workshop maps. — [Steam](https://store.steampowered.com/app/287980/Mini_Metro/)
- Jamie Churchman did visual design. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))

### Inferences
- Octilinear (45/90 degree) routing is the genre-defining look I know from the game, but no source I opened states it explicitly; treat as common knowledge, not citation.

### Gaps
- Exact palette hex values, animation timings, line-edit gestures (e.g. drag from line end, drag a middle segment to insert, remove by dragging end back) not sourced.

## Audio design

### Takeaway
Fully generative: nearly all sound is samples triggered by player actions and game events, quantised to a per-city harmonic and rhythmic framework, with each line tied to a note and rhythm.

### Cited Findings
- Nearly all sound is samples triggered in real time; each city has rhythms, harmonic choices and engine sounds; the player's layout determines which are active. — [Designing Sound](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace)
- Each subway line is tied to a rhythm and a note; when the least recently edited line changes, its note takes the next note in the level's harmonic sequence and its rhythm moves along a list; harmony can shift by week. — same
- Passenger spawn, pickup, drop-off are timed to the music; an "Arpeggio" module spreads clumped actions into rhythmic sequences; limited interactions processed per window. — same
- Tools: G-Audio (Unity) used as a sequencer over FMOD; Serum, S-Layer, Battery; passenger sounds from mouth sounds and drum machines. — same
- Envelopes scale with game speed; music most ambient when paused. — same
- Intent: audio provides feedback on passenger volume, line count, trains and overloaded stations while staying meditative; influences Reich, Glass. — same; [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- City flavours: Berlin kick drum, New York and St Petersburg swing, Cairo uneven rhythms, Paris quintuplets/septuplets. — [Designing Sound](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace)
- Won IGF 2016 Excellence in Audio. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))

### Inferences
- Cheap clone: WebAudio scale per city, one note + rhythm slot per line, quantised event sounds, tempo tied to game speed.

### Gaps
- Specific note sequences and tempo values not found.

## Why it is fun: developer-stated design principles, history, updates

### Takeaway
Constraints-driven minimalism: two brothers cut art, music and hand-made levels, leading to abstract visuals, procedural generation and a pure routing puzzle that escalates into manageable chaos.

### Cited Findings
- Built by Peter and Robert Curry (founded 2013, Wellington NZ); started April 2013 as "Mind the Gap" Ludum Dare 26 entry (#1 Innovation, #7 overall) made in Unity over a weekend; constraints on art, audio and levels pushed procedural, abstract design. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Peter Curry: limited time (about three hours a day each) forced drastically rethinking scope. — [Giant Bomb interview (via search)](https://giantbomb.com/users/3929/articles/interview-peter-curry-co-creator-of-mini-metro)
- Early Access Aug 2014; full release 6 Nov 2015 (PC/Mac/Linux); iOS/Android 18 Oct 2016; Switch 30 Aug 2018; PS4 Sept 2019. — [Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Reception: Metacritic PC 77, iOS 89, Switch 86; praised for intuitive interface, minimalism, relaxing tone. — same
- Currency: no DLC listed on Steam; studio now also markets Mini Motorways; DPC site lists free map updates for that game in 2025-26 and did not list Mini Metro news. GOG shows a latest Mini Metro build dated Oct 2025. Tashkent was added as a city; Budapest in Aug 2021. — [Steam](https://store.steampowered.com/app/287980/Mini_Metro/); [DPC](https://dinopoloclub.com/minimetro/); [GamingOnLinux](https://gamingonlinux.com/2021/08/mini-metro-now-lets-you-build-up-one-of-europes-oldest-metro-systems-in-budapest)

### Inferences
- Fun drivers: legible rules, one verb (redraw lines), escalating pressure resolved by weekly choices, audiovisual feedback, a part you cannot control (passenger AI) that creates emergent tension.

### Gaps
- No GDC talk transcript with explicit design principles was retrieved (Pocket Tactics GDC 2023 article had only one quote); no 2026 Mini Metro patch notes found.
