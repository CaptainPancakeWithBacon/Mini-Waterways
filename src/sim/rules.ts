import { config } from './config';
import type { State } from './types';

/** Wat een spelmodus verandert. */
export function rules(s: Pick<State, 'mode'>) {
  return {
    fail: s.mode !== 'endless',
    canRemove: s.mode !== 'expert',
    noRepeatTool: s.mode === 'expert',
    byMilestone: s.mode === 'endless',
    growth: s.mode === 'expert' ? config.expertGrowth : config.difficultyGrowth,
  };
}
