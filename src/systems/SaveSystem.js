/**
 * 진행 저장. localStorage 하나에 전부 담는다.
 * 저장 실패(프라이빗 모드 등)는 조용히 무시하고 메모리 상태만 유지한다.
 */

import { SAVE_KEY } from '../config.js';

const DEFAULT_SAVE = {
  version: 1,
  stage: 0, // 0 = 프롤로그 전
  checkpoint: null, // 스테이지 내 세이브포인트 id
  prologueSeen: false,
  clearedStages: [],
  keepsakes: [], // 주운 기억 조각의 id
  customSprites: false,
  muted: false,
};

export class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      if (parsed.version !== DEFAULT_SAVE.version) return { ...DEFAULT_SAVE };
      return { ...DEFAULT_SAVE, ...parsed };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* 저장할 수 없는 환경이면 이번 세션 동안만 유지된다 */
    }
  }

  get hasProgress() {
    return this.data.stage > 0 || this.data.prologueSeen;
  }

  set(patch) {
    Object.assign(this.data, patch);
    this.persist();
  }

  markPrologueSeen() {
    this.set({ prologueSeen: true });
  }

  /** 세이브 포인트 저장. 이미 같은 지점이면 false 를 돌려준다(모션만 재생) */
  saveCheckpoint(stage, checkpointId) {
    const isNew = !(this.data.stage === stage && this.data.checkpoint === checkpointId);
    this.set({ stage, checkpoint: checkpointId });
    return isNew;
  }

  hasKeepsake(id) {
    return this.data.keepsakes.includes(id);
  }

  /** 기억 조각을 주웠다. 이미 가진 것이면 false */
  collectKeepsake(id) {
    if (this.hasKeepsake(id)) return false;
    this.set({ keepsakes: [...this.data.keepsakes, id] });
    return true;
  }

  /** 그 스테이지에서 주운 개수 */
  keepsakesIn(stageId) {
    return this.data.keepsakes.filter((id) => id.startsWith(`s${stageId}_`)).length;
  }

  get keepsakeCount() {
    return this.data.keepsakes.length;
  }

  enterStage(stage) {
    if (this.data.stage !== stage) this.set({ stage, checkpoint: null });
  }

  clearStage(stage) {
    const cleared = new Set(this.data.clearedStages);
    cleared.add(stage);
    this.set({ clearedStages: [...cleared].sort(), checkpoint: null });
  }

  reset() {
    this.data = { ...DEFAULT_SAVE, muted: this.data.muted };
    this.persist();
  }
}
