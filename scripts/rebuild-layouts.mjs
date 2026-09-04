/**
 * 확정해 둔 배치를 **저장된 씨앗으로 다시 굽는다.**
 *
 * 생성기(`src/systems/StageBuilder.js`)를 고치면 이미 확정한 배치는 예전 규칙 그대로다.
 * 찍은 점과 씨앗 번호는 `src/data/layouts/stage<N>.json` 안에 남아 있으므로,
 * 그것만 가지고 새 규칙으로 다시 만들면 된다. 관리 툴을 다시 열 필요가 없다.
 *
 * 사용: node scripts/rebuild-layouts.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from '../src/systems/StageBuilder.js';
import stage1 from '../src/data/stage1.js';
import stage2 from '../src/data/stage2.js';
import stage3 from '../src/data/stage3.js';
import stage4 from '../src/data/stage4.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(ROOT, 'src', 'data', 'layouts');
const BASE = Object.fromEntries([stage1, stage2, stage3, stage4].map((s) => [s.id, s]));

const dryRun = process.argv.includes('--dry-run');

function rebuild(file) {
  const full = path.join(DIR, file);
  const saved = JSON.parse(fs.readFileSync(full, 'utf8'));
  const seed = saved.seed;

  if (!seed?.start || !seed?.goal) {
    console.log(`[layout] ${file} — 씨앗에 출발/도착이 없어 건너뛴다`);
    return;
  }

  const def = BASE[saved.stage ?? seed.stage];
  if (!def) {
    console.log(`[layout] ${file} — 스테이지 ${saved.stage} 를 못 찾겠다`);
    return;
  }

  // 예전에 저장한 씨앗에는 소품 시트가 없다. 스테이지 정의에서 채워 준다
  const L = build({
    ...seed,
    stage: def.id,
    props: seed.props ?? `props_${def.theme}`,
    actors: seed.actors ?? def.actors,
  });

  if (L.stats?.error) {
    console.log(`[layout] ${file} — 생성 실패: ${L.stats.error}`);
    return;
  }

  const next = {
    ...saved,
    seed: { ...seed, props: `props_${def.theme}`, actors: def.actors },
    layout: {
      ground: L.ground,
      ledges: L.ledges,
      scent: L.scent,
      keepsakes: L.keepsakes,
      saves: L.saves,
      props: L.props,
      start: L.start,
      goal: { x: L.goal.x, y: L.goal.y - 90, h: 320 },
      width: L.width,
    },
  };

  const s = L.stats;
  console.log(
    `[layout] ${file}  발판 ${s['발판']}  소품 ${s['소품']}  높이차 ${s['높이차']}  ${s['이어짐']}`
  );

  if (!dryRun) fs.writeFileSync(full, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .forEach(rebuild);

console.log('[layout] 완료.' + (dryRun ? ' (--dry-run 이라 쓰지 않았다)' : ''));
