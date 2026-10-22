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
  // wharf en quay spawnen minstens zo ver uit elkaar (manhattan)
  minWharfQuayDistance: 6,
  spawnAttempts: 50,
  // moeilijkheid groeit met deze factor per rampSeconds
  difficultyGrowth: 1.02,
  rampSeconds: 10,
} as const;

export const ticks = (seconds: number) => Math.max(1, Math.round(seconds * config.tickRate));
