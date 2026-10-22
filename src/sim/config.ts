// Alle tuning-waarden. De sim leest nergens anders getallen vandaan.
// Alles hier is een playtest-startwaarde, geen bevestigd feit.
export const config = {
  tickRate: 30,
  grid: { width: 32, height: 20 },
  bargeSpeedTilesPerSec: 1.5,
  quayCapacity: 7,
  ringSeconds: 45,
  demandIntervalStartSec: 12,
  spawnDelayStartSec: 20,
  difficultyGrowthPer10Sec: 1.02,
} as const;
