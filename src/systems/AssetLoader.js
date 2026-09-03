/**
 * 에셋 로더
 *
 * 1) public/assets/manifest.json 을 읽어 어떤 실제 에셋이 있는지 파악한다.
 *    - autodetect 가 true 면 HEAD 요청으로 파일 존재를 직접 확인한다(기본값).
 *    - false 면 files 배열에 적힌 것만 실제 파일로 취급한다(콘솔이 조용해진다).
 * 2) 존재하는 파일만 Phaser 로더에 등록한다.
 * 3) 없는 것은 PlaceholderArt / PlaceholderScenery 로 같은 key 의 텍스처를 만든다.
 * 4) 애니메이션은 실제/플레이스홀더 구분 없이 동일하게 등록된다.
 */

import {
  SPRITE_SHEETS, BACKGROUNDS, ATLASES, CUTSCENES, IMAGES, AUDIO, DIRS,
  ACTOR_SLOTS, ACTOR_FRAMES, ACTOR_FPS, actorAnim, actorFrame,
} from './AssetManifest.js';
import { buildSpriteSheet } from './PlaceholderArt.js';
import { buildBackground, buildAtlas, buildImage } from './PlaceholderScenery.js';

const AUDIO_EXTS = ['ogg', 'mp3', 'wav'];

/** 실제로 존재하는 에셋 경로 집합 (assets/ 기준 상대경로) */
let available = new Set();
let discovered = false;

function spritePath(def) {
  return DIRS.SPRITE_DIR + def.file;
}

function bgPath(def) {
  return DIRS.BG_DIR + def.file;
}



async function head(path) {
  try {
    const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/** 어떤 에셋이 실제로 존재하는지 조사한다. BootScene 에서 한 번만 호출 */
export async function discoverAssets() {
  if (discovered) return available;
  discovered = true;

  // ?placeholder=1 로 열면 실제 에셋을 전부 무시하고 임시 그림으로만 돌린다.
  // "에셋이 하나도 없어도 게임이 도는가"를 언제든 확인하기 위한 스위치다.
  try {
    if (new URLSearchParams(location.search).has('placeholder')) {
      console.info('[assets] placeholder 모드 — 실제 에셋을 쓰지 않는다');
      return available;
    }
  } catch {
    /* location 이 없는 환경이면 그냥 넘어간다 */
  }

  let manifest = { autodetect: true, files: [] };
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-store' });
    if (res.ok) manifest = { ...manifest, ...(await res.json()) };
  } catch {
    /* manifest 가 없어도 정상 — 전부 플레이스홀더로 간다 */
  }

  (manifest.files || []).forEach((f) => available.add(f));

  if (!manifest.autodetect) return available;

  const candidates = [
    ...SPRITE_SHEETS.map(spritePath),
    ...BACKGROUNDS.map(bgPath),
    ...ATLASES.map((d) => d.file),
    ...CUTSCENES.map((d) => d.file),
    ...IMAGES.map((d) => d.file),
  ];
  AUDIO.forEach((d) => AUDIO_EXTS.forEach((ext) => candidates.push(`${DIRS.AUDIO_DIR}${d.file}.${ext}`)));

  await Promise.all(
    candidates.map(async (path) => {
      if (await head(path)) available.add(path);
    })
  );

  return available;
}

export function has(path) {
  return available.has(path);
}

/**
 * 그 키가 실제 에셋으로 채워졌는지 (플레이스홀더가 아닌지) 알려준다.
 * 연출이 실제 그림을 전제로 할 때 쓴다 — 임시 도형으로 하면 오히려 어색한 경우.
 */
export function isReal(key) {
  const all = [...SPRITE_SHEETS.map((d) => [d.key, spritePath(d)]), ...BACKGROUNDS.map((d) => [d.key, bgPath(d)])];
  const found = all.find(([k]) => k === key);
  if (found) return has(found[1]);

  const direct = [...ATLASES, ...CUTSCENES, ...IMAGES].find((d) => d.key === key);
  return direct ? has(direct.file) : false;
}

/** PreloadScene 에서 호출 — 존재하는 파일만 로드 큐에 넣는다 */
export function queueRealAssets(scene) {
  SPRITE_SHEETS.forEach((def) => {
    const path = spritePath(def);
    if (has(path)) scene.load.spritesheet(def.key, path, { frameWidth: def.w, frameHeight: def.h });
  });

  BACKGROUNDS.forEach((def) => {
    const path = bgPath(def);
    if (has(path)) scene.load.image(def.key, path);
  });

  ATLASES.forEach((def) => {
    if (has(def.file)) scene.load.spritesheet(def.key, def.file, { frameWidth: def.w, frameHeight: def.h });
  });

  CUTSCENES.forEach((def) => {
    if (has(def.file)) scene.load.image(def.key, def.file);
  });

  IMAGES.forEach((def) => {
    if (has(def.file)) scene.load.image(def.key, def.file);
  });

  AUDIO.forEach((def) => {
    const urls = AUDIO_EXTS.map((ext) => `${DIRS.AUDIO_DIR}${def.file}.${ext}`).filter(has);
    if (urls.length) scene.load.audio(def.key, urls);
  });
}

/** 로드 완료 후 호출 — 빠진 텍스처를 절차적으로 채운다 */
export function buildMissingTextures(scene) {
  SPRITE_SHEETS.forEach((def) => {
    if (!scene.textures.exists(def.key)) buildSpriteSheet(scene, def);
  });
  BACKGROUNDS.forEach((def) => {
    if (!scene.textures.exists(def.key)) buildBackground(scene, def);
  });
  ATLASES.forEach((def) => {
    if (!scene.textures.exists(def.key)) buildAtlas(scene, def);
  });
  IMAGES.forEach((def) => {
    if (!scene.textures.exists(def.key)) buildImage(scene, def);
  });
}

/** 8프레임 애니메이션 일괄 등록 */
export function registerAnimations(scene) {
  SPRITE_SHEETS.forEach((def) => {
    if (scene.anims.exists(def.key)) return;
    if (!scene.textures.exists(def.key)) return;

    const frameCount = scene.textures.get(def.key).frameTotal - 1; // __BASE 제외
    const end = Math.max(0, Math.min(7, frameCount - 1));

    // 시트가 도입 / 고리 / 마무리로 나뉘어 있으면 그대로 셋으로 등록한다.
    //
    //   key         고리 (평소에 쓰는 것)
    //   key + '_in'  들어가는 동작, 한 번만
    //   key + '_out' 마무리 동작, 한 번만
    //
    // 나눌 게 없으면 예전처럼 전체가 곧 고리다.
    const from = def.loop ? Math.min(def.loopFrom ?? 0, end) : 0;
    const to = def.loop ? Math.min(def.loopTo ?? end, end) : end;

    scene.anims.create({
      key: def.key,
      frames: scene.anims.generateFrameNumbers(def.key, { start: from, end: to }),
      frameRate: def.fps,
      repeat: def.loop ? -1 : 0,
    });

    if (from > 0) {
      scene.anims.create({
        key: `${def.key}_in`,
        frames: scene.anims.generateFrameNumbers(def.key, { start: 0, end: from - 1 }),
        frameRate: def.fps,
        repeat: 0,
      });
    }
    if (to < end) {
      scene.anims.create({
        key: `${def.key}_out`,
        frames: scene.anims.generateFrameNumbers(def.key, { start: to + 1, end }),
        frameRate: def.fps,
        repeat: 0,
      });
    }

    // 사망 → 부활은 같은 시트의 역재생을 쓴다
    if (def.key === 'dog_dispel' && !scene.anims.exists('dog_respawn')) {
      scene.anims.create({
        key: 'dog_respawn',
        frames: scene.anims.generateFrameNumbers(def.key, { start: end, end: 0 }),
        frameRate: def.fps,
        repeat: 0,
      });
    }
  });

  registerActorAnimations(scene);
}

/**
 * 움직이는 것들 — 시트 한 장에 역할 네 줄이 들어 있으므로 줄마다 애니메이션을 만든다.
 *
 * 플레이스홀더 시트도 같은 칸 배치로 만들어지므로 실제 에셋 유무와 무관하게 돈다.
 */
function registerActorAnimations(scene) {
  ATLASES.filter((def) => def.kind === 'actor').forEach((def) => {
    if (!scene.textures.exists(def.key)) return;
    const total = scene.textures.get(def.key).frameTotal - 1; // __BASE 제외

    ACTOR_SLOTS.forEach((name, slot) => {
      const key = actorAnim(def.key, slot);
      if (scene.anims.exists(key)) return;

      const start = actorFrame(slot);
      const end = start + ACTOR_FRAMES - 1;
      if (end >= total) return;

      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(def.key, { start, end }),
        frameRate: ACTOR_FPS[name] ?? 12,
        repeat: -1,
      });
    });
  });
}

/**
 * 사용자가 직접 고른 PNG 를 런타임에 주입한다 (타이틀의 "스프라이트 추가해서 시작").
 * 8프레임 가로 시트를 가정하고 프레임을 다시 나눈다.
 * @returns {Promise<string[]>} 교체에 성공한 key 목록
 */
export function injectUserSprites(scene, files) {
  const byKey = new Map(SPRITE_SHEETS.map((d) => [d.key, d]));

  const jobs = Array.from(files).map(
    (file) =>
      new Promise((resolve) => {
        const key = file.name.replace(/\.[^.]+$/, '');
        const def = byKey.get(key);
        if (!def) return resolve(null);

        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const frameW = Math.floor(img.width / 8);
            const frameH = img.height;
            const canvasKey = `${key}__user`;
            if (scene.textures.exists(canvasKey)) scene.textures.remove(canvasKey);
            const tex = scene.textures.createCanvas(canvasKey, img.width, frameH);
            tex.getContext().drawImage(img, 0, 0);
            tex.refresh();
            for (let i = 0; i < 8; i++) tex.add(i, 0, i * frameW, 0, frameW, frameH);

            // 기존 key 를 치우고 사용자 텍스처를 그 이름으로 다시 등록
            if (scene.anims.exists(key)) scene.anims.remove(key);
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.renameTexture(canvasKey, key);

            scene.anims.create({
              key,
              frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
              frameRate: def.fps,
              repeat: def.loop ? -1 : 0,
            });
            resolve(key);
          };
          img.onerror = () => resolve(null);
          img.src = reader.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      })
  );

  return Promise.all(jobs).then((keys) => keys.filter(Boolean));
}
