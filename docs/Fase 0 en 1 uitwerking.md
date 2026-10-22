# Fase 0 en 1: fundament en tracer bullet

Uitwerking van de fases 0 en 1 uit het rapport "Mini Waterways rebuild research". Alle getallen hieronder zijn startwaarden voor playtests, geen feiten uit de bronnen. De werktitel "Waterways" staat nog niet vast.

## Fase 0: fundament

**Doel:** een lege canvas die vanuit CI op GitHub Pages staat, met een testsuite die draait. Geen gameplay.

### Keuzes (met mijn default)

| Vraag | Default | Waarom |
|---|---|---|
| Waar bouwen | nieuwe repo, oude Mini-Waterways archiveren | eerder besloten in het rapport |
| Repo-naam | niet "Mini-..." | IP-risico bij publiek gebruik, naam kan later nog |
| Taal en tooling | TypeScript `strict`, Vite, Vitest | pure sim is zo goed testbaar |
| Lint | ESLint flat config, geen airbnb | oude config was verouderd |
| Renderer | Canvas 2D achter een kleine interface | PixiJS later zonder sim-wijziging |
| Packages | alleen vite, typescript, vitest, eslint | geen three, neataptic en dergelijke |

Versies: pin op wat `npm install` die dag oplevert (in het onderzoek op 2026-10-22: Vite 8.3.5, TypeScript 7.0.2, Vitest 5.0.5). Lees de release notes, want plugin-compatibiliteit met Vite 8 is niet bevestigd.

### Mapstructuur

```
src/
  sim/            geen DOM, geen Date.now, geen Math.random
    config.ts     alle tuning-waarden op één plek
    rng.ts        sfc32 + xmur3 string-hash
    types.ts      State, Command, Tile, Barge, Wharf, Quay
    grid.ts       tile-opslag, buren, vrije-voetafdruk-check
    path.ts       A* over kanaaltegels
    spawn.ts      plaatsing en tempo van wharves en quays
    step.ts       step(state, commands) -> state, één tick
    hash.ts       state-hash voor replay-tests
  render/         canvas-tekenen, leest alleen State
  input/          pointer events -> Command
  main.ts         loop met fixed timestep, koppelt alles
tests/            sim-tests, golden replay
.github/workflows/deploy.yml
```

Regel: `render` en `input` importeren `sim`, nooit andersom.

### Scripts en CI

`npm run dev`, `build`, `typecheck` (`tsc --noEmit`), `lint`, `test`. De workflow draait typecheck, lint en test, daarna build en deploy naar Pages. Triggers alleen op `main`, Node op een huidige LTS, `base` van Vite op de repo-naam.

### Klaar als

- een lege canvas staat live op Pages
- CI is groen met één trivale test
- `config.ts` bestaat en wordt door een test geïmporteerd
- README heeft `npm install` en `npm run dev`

## Fase 1: tracer bullet

**Doel:** één volledige, minimale run. Een boot levert af, een vol quay beëindigt het spel, en een replay van seed plus inputs geeft altijd dezelfde eindstaat. Geen sluizen, geen hoogte, geen weekkeuze.

### Wereld

- Raster van 32 x 20 tegels, alles laagland. Tegel is `leeg`, `kanaal`, `wharf` of `quay`.
- Eén kleur in de eerste versie. De data heeft al een `colour`-veld, zodat fase 2 meerdere kleuren zonder refactor kan toevoegen.
- Kanaaltegels plaatsen en weghalen is gratis en onbeperkt. Het tegelbudget komt in fase 2.

### Entiteiten

- **Wharf:** staat vast op een tegel, bezit maximaal 2 boten (zoals huizen in Motorways 2 auto's hebben).
- **Quay:** staat vast, heeft `pending` (wachtende lading), `capacity` en een `ring` (0 tot 1).
- **Barge:** heeft een wharf, een doel-quay, een pad (lijst tegels) en een voortgang `t` per tegel.

### Regels per tick

Vaste tick van 30 Hz. Tijd in de sim is een geheel aantal ticks.

1. **Commando's:** `placeCanal(x,y)` en `removeCanal(x,y)`. Weghalen onder een boot wordt geweigerd. De simpelste regel die niets kapotmaakt; "spooktegel" zoals in Motorways kan later.
2. **Spawn:** na `spawnDelay` ticks verschijnt een nieuwe wharf of quay op een vrije plek. Plek: niet binnen 1 tegel van een ander gebouw en niet op een kanaal. Lukt dat niet, dan stijgt de vraag van een bestaande quay, zoals de community het voor Motorways beschrijft.
3. **Vraag:** elke quay krijgt elke `demandInterval` ticks +1 `pending`. Het interval krimpt geometrisch met een globale moeilijkheidsfactor.
4. **Boten:** een wharf zonder boot onderweg stuurt een boot naar de quay met de meeste `pending` die via kanaaltegels bereikbaar is. Pad met A* bij vertrek, geen herberekening onderweg (bewuste keuze, nog open voor discussie). Geen bereikbare quay: de boot blijft thuis.
5. **Afleveren:** aankomst geeft `pending -= 1`, `score += 1`, en de boot vaart terug naar de wharf.
6. **Falen:** als `pending > capacity` loopt de ring met `1 / ringTicks` per tick op, anders loopt hij terug met dezelfde snelheid. Ring op 1 betekent game over.

### Startwaarden (alle playtest-knoppen)

| Naam | Waarde | Opmerking |
|---|---|---|
| `tickRate` | 30 | |
| `bargeSpeed` | 1,5 tegels/s | schatting |
| `quayCapacity` | 7 | community-getal voor Motorways, onbevestigd |
| `ringSeconds` | 45 | tussen de twee conflicterende Mini Metro-bronnen |
| `demandIntervalStart` | 12 s | |
| `difficultyGrowth` | 1,02 per 10 s | geometrische ramp |
| `spawnDelayStart` | 20 s | |

Alles staat in `config.ts` en de sim leest nergens anders getallen vandaan.

### Determinisme

- Eén `State` van gewone objecten met id's, geen klassen met verborgen toestand.
- PRNG sfc32, geseed met xmur3(`seedString`). Aparte stream voor spawns en voor cosmetica.
- Alleen gehele tick-tellers in de sim-logica. Positie langs een pad is `tick - startTick` gedeeld door een vaste ticks-per-tegel, afgerond. Zo vermijd je floats waar browsers kunnen afwijken.
- Replay is `{ seed, commands: [{tick, cmd}] }`. `hash(state)` na N ticks is de check.

### Renderer en input (minimaal)

- Statische laag (raster, kanalen) naar een eigen canvas gecachet, dynamische laag (boten, ringen) elke frame.
- HiDPI via `devicePixelRatio`.
- Pointer events met `setPointerCapture` en `touch-action: none`. Slepen over tegels plaatst kanaal, slepen met rechtermuisknop of een wisselknop haalt weg. Raakstraal voor aanraking 24 tot 32 CSS-px.
- Palet: een eigen paar kleuren in een `palette.ts`, niet de Motorways-kleuren overnemen.
- Game-overscherm: een DOM-overlay met score en "opnieuw".

### Tests (klein maar scherp)

1. `rng`: dezelfde seed geeft dezelfde reeks, andere seed een andere.
2. `path`: A* vindt het kortste pad, geeft `null` zonder verbinding.
3. `spawn`: nooit binnen 1 tegel van een gebouw, nooit op kanaal.
4. `step`: een boot levert af en `score` stijgt; `pending` boven capaciteit laat de ring oplopen en bij 1 eindigt het spel.
5. **Golden replay:** vaste seed plus vaste commando's geven een vaste eindhash. Dit is de test die breekt als determinisme stukgaat.

### Klaar als

- een run start, een boot levert af, een vol quay beëindigt de run
- de golden replay-test slaagt, ook na een rebuild
- je zonder tekst begrijpt wat je moet doen (kanaal tussen wharf en quay trekken)

## Volgorde van werken

1. Fase 0 afmaken en deployen (repo, tooling, CI, lege canvas).
2. `rng`, `grid`, `types`, `config` met tests.
3. `path` met tests.
4. `step` zonder spawn: handmatig geplaatste wharf en quay, boot levert af.
5. `spawn` en de vraagramp.
6. Falen en het game-overscherm.
7. Renderer en pointer-input.
8. Golden replay-test vastleggen.

Stap 4 vóór de renderer is bewust: dan zie je in tests of de kern klopt voordat er iets te zien is.

## Open punten voor jou

- Nieuwe repo-naam en of de oude repo gearchiveerd wordt.
- Geen herberekening van het pad onderweg: akkoord, of toch wel?
- Kanaal weghalen onder een boot weigeren (default) of boot laten uitvaren?
- Is dit een school-, portfolio- of publiek project? Dat bepaalt licentie en naam.
