/**
 * public/assets 를 훑어 manifest.json 을 갱신한다.
 *
 * 런타임에 파일 존재를 일일이 확인하면 요청이 백 개 넘게 생기고 로딩이 느려지므로,
 * dev/build 시작 전에 목록을 만들어 둔다. (npm run dev / npm run build 가 자동 실행)
 * 에셋을 새로 넣었다면 dev 서버를 다시 시작하거나 `npm run assets` 를 실행하면 된다.
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ASSETS_DIR = join(ROOT, 'public', 'assets');
const MANIFEST = join(ASSETS_DIR, 'manifest.json');

const ALLOWED = new Set(['.png', '.webp', '.jpg', '.jpeg', '.ogg', '.mp3', '.m4a', '.wav']);

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await walk(full)));
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED.has(ext)) continue;
    found.push(full);
  }
  return found;
}

async function main() {
  try {
    await stat(ASSETS_DIR);
  } catch {
    console.log('[assets] public/assets 가 없어 건너뜁니다.');
    return;
  }

  const files = (await walk(ASSETS_DIR))
    .map((full) => 'assets/' + relative(ASSETS_DIR, full).split(sep).join('/'))
    .sort();

  let previous = {};
  try {
    previous = JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    /* 처음 만들 때는 없는 게 정상 */
  }

  const manifest = {
    autodetect: previous.autodetect === true,
    generatedAt: new Date().toISOString(),
    files,
  };

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[assets] ${files.length}개 파일을 manifest.json 에 기록했습니다.`);
}

main();
