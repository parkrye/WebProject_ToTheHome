import stage1 from './stage1.js';
import stage2 from './stage2.js';
import stage3 from './stage3.js';
import stage4 from './stage4.js';

export const STAGES = [stage1, stage2, stage3, stage4];

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || null;
}

export const LAST_STAGE = STAGES[STAGES.length - 1].id;
