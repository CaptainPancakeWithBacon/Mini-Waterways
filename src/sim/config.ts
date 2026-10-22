// Alle tuning-waarden. De sim leest nergens anders getallen vandaan.
// Alles hier is een playtest-startwaarde, geen bevestigd feit.
export const config = {
  tickRate: 30,
  grid: { width: 32, height: 20 },
  bargeSpeedTilesPerSec: 1.5,
  maxBargesPerWharf: 2,
  dispatchIntervalSec: 0.5,
  quayCapacity: 7,
  ringSeconds: 45,
  demandIntervalStartSec: 12,
  spawnDelayStartSec: 20,
  // wharf en quay van dezelfde kleur spawnen minstens zo ver uit elkaar (manhattan)
  minWharfQuayDistance: 6,
  spawnAttempts: 50,
  // moeilijkheid groeit met deze factor per rampSeconds
  difficultyGrowth: 1.02,
  expertGrowth: 1.04,
  rampSeconds: 10,

  // weken en kaarten
  weekSeconds: 100,
  startTiles: 30,
  startLocks: 1,
  cardTilesMin: 15,
  cardTilesMax: 25,
  maxColours: 4,
  colourEveryWeeks: 2,
  speedBonusStep: 0.2,
  // gewogen trekking van het gereedschap op een kaart
  toolPool: ['lock', 'lock', 'pond', 'boat', 'speed'],
  // Endless: een kaart per zoveel afleveringen
  endlessMilestone: 10,

  // terrein
  terrainCell: 8,
  levels: 3,

  // sluizen
  lockCycleSeconds: 4,
  pondFactor: 0.5,
  lockPathCost: 4,

  // waterbudget (optioneel)
  water: { max: 60, costLock: 3, costPond: 2, refillSeconds: 3, dryRefillSeconds: 6, dryEveryWeeks: 4 },
} as const;

export const ticks = (seconds: number) => Math.max(1, Math.round(seconds * config.tickRate));
