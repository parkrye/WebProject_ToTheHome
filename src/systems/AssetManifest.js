/**
 * 에셋 목록.
 *
 * 여기 적힌 경로에 실제 파일이 있으면 그것을 쓰고, 없으면 PlaceholderArt 가
 * 같은 key 로 절차적 텍스처를 만들어 채운다. 즉 AI 에셋이 하나도 없어도 게임은 돈다.
 *
 * 파일명 규칙은 .docs/assets-sprites.md / assets-images.md / assets-audio.md 와 일치한다.
 */

const SPRITE_DIR = 'assets/sprites/';
const BG_DIR = 'assets/bg/';
const PROP_DIR = 'assets/props/';
const UI_DIR = 'assets/ui/';
const AUDIO_DIR = 'assets/audio/';

/**
 * 8프레임 애니메이션 시트.
 *
 * 레퍼런스 이미지 한 장과 8줄짜리 프롬프트로 프레임을 각각 만들어 이어 붙인 것이다.
 * 자세한 만드는 법은 .docs/assets-sprites.md 참고.
 *
 * 정말로 프레임마다 형태가 달라지는 것만 여기 둔다. 자동차나 돌처럼 모양은 그대로고
 * 위치나 각도만 바뀌는 것은 정적 그림 하나로 두고 코드가 움직인다 (ACTORS).
 */
export const SPRITE_SHEETS = [
  { key: 'dog_idle', file: 'dog_idle.png', w: 160, h: 160, fps: 8, loop: true, placeholder: 'dogIdle' },
  { key: 'dog_walk', file: 'dog_walk.png', w: 160, h: 160, fps: 10, loop: true, placeholder: 'dogWalk' },
  { key: 'dog_run', file: 'dog_run.png', w: 160, h: 160, fps: 14, loop: true, placeholder: 'dogRun' },
  { key: 'dog_jump', file: 'dog_jump.png', w: 160, h: 160, fps: 12, loop: false, placeholder: 'dogJump' },
  { key: 'dog_sniff', file: 'dog_sniff.png', w: 160, h: 160, fps: 8, loop: true, placeholder: 'dogSniff' },
  { key: 'dog_dispel', file: 'dog_dispel.png', w: 160, h: 160, fps: 10, loop: false, placeholder: 'dogDispel' },
  { key: 'dog_dig', file: 'dog_dig.png', w: 160, h: 160, fps: 12, loop: true, placeholder: 'dogDig' },
  // 잠자기·공놀이는 첫 칸이 '서 있는 자세'다. 생성기가 기본 자세에서 시작해 그렸기 때문에
  // 8칸을 그대로 돌리면 한 바퀴마다 벌떡 일어난다. loopFrom 부터를 고리로 삼는다.
  { key: 'dog_sleep', file: 'dog_sleep.png', w: 160, h: 160, fps: 6, loop: true, loopFrom: 2, placeholder: 'dogSleep' },
  { key: 'dog_splash', file: 'dog_splash.png', w: 160, h: 160, fps: 12, loop: true, placeholder: 'dogSplash' },
  { key: 'dog_ball_nudge', file: 'dog_ball_nudge.png', w: 160, h: 160, fps: 10, loop: true, loopFrom: 1, placeholder: 'dogBall' },

  // 프롤로그 · 엔딩 연출
  { key: 'dog_puppy_run', file: 'dog_puppy_run.png', w: 160, h: 160, fps: 14, loop: true, placeholder: 'puppyRun' },
  { key: 'owner_child_run', file: 'owner_child_run.png', w: 224, h: 224, fps: 12, loop: true, placeholder: 'childRun' },
  { key: 'owner_walk_silhouette', file: 'owner_walk_silhouette.png', w: 224, h: 224, fps: 8, loop: true, placeholder: 'ownerWalk' },
  { key: 'owner_adult_wake', file: 'owner_adult_wake.png', w: 224, h: 224, fps: 8, loop: false, placeholder: 'ownerWake' },
  { key: 'owner_adult_walk', file: 'owner_adult_walk.png', w: 224, h: 224, fps: 10, loop: true, placeholder: 'ownerWalkAdult' },
  { key: 'owner_adult_kneel', file: 'owner_adult_kneel.png', w: 224, h: 224, fps: 8, loop: false, placeholder: 'ownerKneel' },
];

/**
 * 배경 레이어. theme 은 config.STAGE_THEME 의 키이며 플레이스홀더 생성에 쓰인다.
 * kind: sky | far | mid | near
 */
export const BACKGROUNDS = [
  { key: 'bg_field_sky_morning', file: 'bg_field_sky_morning.png', kind: 'sky', theme: 'prologue_morning' },
  { key: 'bg_field_sky_noon', file: 'bg_field_sky_noon.png', kind: 'sky', theme: 'prologue_noon' },
  { key: 'bg_field_sky_evening', file: 'bg_field_sky_evening.png', kind: 'sky', theme: 'prologue_evening' },
  { key: 'bg_field_far', file: 'bg_field_far.png', kind: 'far', theme: 'field' },
  { key: 'bg_field_mid', file: 'bg_field_mid.png', kind: 'mid', theme: 'field' },
  { key: 'bg_field_near', file: 'bg_field_near.png', kind: 'near', theme: 'field' },

  { key: 'bg_city_sky', file: 'bg_city_sky.png', kind: 'sky', theme: 'city' },
  { key: 'bg_city_far', file: 'bg_city_far.png', kind: 'far', theme: 'city' },
  { key: 'bg_city_mid', file: 'bg_city_mid.png', kind: 'mid', theme: 'city' },
  { key: 'bg_city_near', file: 'bg_city_near.png', kind: 'near', theme: 'city' },

  { key: 'bg_coast_sky_day', file: 'bg_coast_sky_day.png', kind: 'sky', theme: 'coast' },
  { key: 'bg_coast_sky_sunset', file: 'bg_coast_sky_sunset.png', kind: 'sky', theme: 'coast_sunset' },
  { key: 'bg_coast_far', file: 'bg_coast_far.png', kind: 'far', theme: 'coast' },
  { key: 'bg_coast_mid', file: 'bg_coast_mid.png', kind: 'mid', theme: 'coast' },
  { key: 'bg_coast_near', file: 'bg_coast_near.png', kind: 'near', theme: 'coast' },

  { key: 'bg_mountain_sky_night', file: 'bg_mountain_sky_night.png', kind: 'sky', theme: 'mountain' },
  { key: 'bg_mountain_sky_dawn', file: 'bg_mountain_sky_dawn.png', kind: 'sky', theme: 'mountain_dawn' },
  { key: 'bg_mountain_far', file: 'bg_mountain_far.png', kind: 'far', theme: 'mountain' },
  { key: 'bg_mountain_mid', file: 'bg_mountain_mid.png', kind: 'mid', theme: 'mountain' },
  { key: 'bg_mountain_near', file: 'bg_mountain_near.png', kind: 'near', theme: 'mountain' },

  { key: 'bg_home_interior_night', file: 'bg_home_interior_night.png', kind: 'interior', theme: 'home' },
  { key: 'bg_home_exterior', file: 'bg_home_exterior.png', kind: 'interior', theme: 'field' },
];

/** 정적 컷 일러스트 — 없으면 씬이 알아서 건너뛴다 */
export const CUTSCENES = [
  { key: 'cut_prologue_night', file: 'assets/cutscene/cut_prologue_night.png' },
  { key: 'cut_ending_door', file: 'assets/cutscene/cut_ending_door.png' },
];

/**
 * 균등 격자 아틀라스.
 *
 * 소품과 지형 타일은 낱장이 아니라 시트 한 장으로 받고, 프레임 번호로 꺼내 쓴다.
 * 칸 배치와 번호는 .docs/assets-images2.md 와 일치해야 한다.
 */
export const ATLASES = [
  { key: 'props_city', file: PROP_DIR + 'props_city.png', w: 384, h: 384, cols: 4, rows: 3, kind: 'prop', theme: 'city' },
  { key: 'props_coast', file: PROP_DIR + 'props_coast.png', w: 384, h: 384, cols: 4, rows: 3, kind: 'prop', theme: 'coast' },
  { key: 'props_mountain', file: PROP_DIR + 'props_mountain.png', w: 384, h: 384, cols: 4, rows: 3, kind: 'prop', theme: 'mountain' },
  { key: 'props_field', file: PROP_DIR + 'props_field.png', w: 384, h: 384, cols: 4, rows: 3, kind: 'prop', theme: 'field' },

  { key: 'tiles_city', file: 'assets/tiles/tiles_city.png', w: 128, h: 128, cols: 4, rows: 2, kind: 'tile', theme: 'city' },
  { key: 'tiles_coast', file: 'assets/tiles/tiles_coast.png', w: 128, h: 128, cols: 4, rows: 2, kind: 'tile', theme: 'coast' },
  { key: 'tiles_mountain', file: 'assets/tiles/tiles_mountain.png', w: 128, h: 128, cols: 4, rows: 2, kind: 'tile', theme: 'mountain' },
  { key: 'tiles_field', file: 'assets/tiles/tiles_field.png', w: 128, h: 128, cols: 4, rows: 2, kind: 'tile', theme: 'field' },

  { key: 'actors_city', file: PROP_DIR + 'actors_city.png', w: 320, h: 320, cols: 8, rows: 4, kind: 'actor', theme: 'city' },
  { key: 'actors_coast', file: PROP_DIR + 'actors_coast.png', w: 320, h: 320, cols: 8, rows: 4, kind: 'actor', theme: 'coast' },
  { key: 'actors_mountain', file: PROP_DIR + 'actors_mountain.png', w: 320, h: 320, cols: 8, rows: 4, kind: 'actor', theme: 'mountain' },
  { key: 'actors_field', file: PROP_DIR + 'actors_field.png', w: 320, h: 320, cols: 8, rows: 4, kind: 'actor', theme: 'field' },

  { key: 'props_home', file: PROP_DIR + 'props_home.png', w: 384, h: 384, cols: 4, rows: 2, kind: 'prop', theme: 'home' },
];

/** 소품 아틀라스 칸 번호 — 네 스테이지가 같은 자리에 같은 역할을 둔다 */
export const PROP = {
  A: 0, B: 1, C: 2, D: 3,
  E: 4, F: 5, G: 6, H: 7,
  I: 8, J: 9,
  TREE: 10, // 10번은 항상 그 스테이지의 큰 나무
  LANDMARK: 11, // 11번은 그 스테이지의 상징물 (고가도로 / 등대 / 부엉이 가지 / 집)
};

/**
 * 움직이는 것들 — 스테이지마다 시트 한 장 (8열 × 4행).
 *
 * **세로 한 줄이 역할 하나**이고, 가로 8칸이 그 역할의 8프레임 애니메이션이다.
 * 바퀴가 돌고 날개가 움직이는 건 시트가 하고, 옮기고 돌리는 건 코드가 한다.
 *
 * 값은 줄 번호다. 그 역할의 첫 프레임 번호는 `actorFrame(역할)` 로 얻는다.
 */
export const ACTOR = {
  MOVER: 0, // 큰 이동체  — 자동차 / 자동차 / 멧돼지 / 큰 새
  FALLER: 1, // 떨어지거나 밀려오는 것 — 화분 / 파도 / 낙석 / 홀씨
  PUFF: 2, // 피어오르는 것 — 증기 / 물보라 / 안개 / 나비
  FLYER: 3, // 나는 것 — 참새 / 갈매기 / 부엉이 / 잠자리
};

/** 역할 한 줄에 들어 있는 프레임 수 */
export const ACTOR_FRAMES = 8;

/** 줄 번호 → 이름. 애니메이션 key 를 짓는 데 쓴다 */
export const ACTOR_SLOTS = ['mover', 'faller', 'puff', 'flyer'];

/** 역할마다 다른 재생 속도 — 날갯짓은 빠르고 안개는 느리다 */
export const ACTOR_FPS = { mover: 12, faller: 12, puff: 10, flyer: 14 };

/** 그 역할의 첫 프레임 번호 */
export function actorFrame(slot) {
  return slot * ACTOR_FRAMES;
}

/** 그 역할의 애니메이션 key (`actors_city_flyer` 꼴) */
export function actorAnim(sheetKey, slot) {
  const name = ACTOR_SLOTS[slot];
  return name ? `${sheetKey}_${name}` : null;
}

/**
 * 집 안 부품 칸 번호.
 *
 * 문이 열리는 장면을 한 장으로 그리지 않는다. 닫힌 문을 치우고 그 자리에 빛과 빈 문틀을
 * 깐 뒤, 문틀 구멍 뒤에 평소 쓰던 강아지 스프라이트를 세우면 "문 너머의 강아지"가 된다.
 */
export const HOME = {
  DOOR: 0, // 닫힌 문
  DOORWAY: 1, // 빈 문틀 — 안쪽이 뚫려 있다
  LIGHT: 2, // 문에서 쏟아지는 빛
  BED: 3,
  CUSHION: 4,
  WINDOW: 5,
  LAMP: 6,
  FRAME: 7,
};

/** 지형 타일 칸 번호 */
export const TILE = {
  TOP: 0,
  TOP_A: 1,
  TOP_B: 2,
  TOP_C: 3,
  FILL: 4,
  FILL_B: 5,
  LEDGE: 6,
  WALL: 7,
};

/** 단일 이미지 소품 / UI */
export const IMAGES = [
  { key: 'prop_sign_move', file: PROP_DIR + 'prop_sign_move.png', placeholder: 'signMove', w: 128, h: 160 },
  { key: 'prop_sign_jump', file: PROP_DIR + 'prop_sign_jump.png', placeholder: 'signJump', w: 128, h: 160 },
  { key: 'prop_sign_run', file: PROP_DIR + 'prop_sign_run.png', placeholder: 'signRun', w: 128, h: 160 },
  { key: 'prop_sandbox', file: PROP_DIR + 'prop_sandbox.png', placeholder: 'sandbox', w: 256, h: 128 },
  { key: 'prop_food_stall', file: PROP_DIR + 'prop_food_stall.png', placeholder: 'stall', w: 320, h: 256 },
  { key: 'prop_valley_pond', file: PROP_DIR + 'prop_valley_pond.png', placeholder: 'pond', w: 384, h: 160 },
  { key: 'prop_ball', file: PROP_DIR + 'prop_ball.png', placeholder: 'ball', w: 64, h: 64 },
  { key: 'prop_owner_car', file: PROP_DIR + 'prop_owner_car.png', placeholder: 'ownerCar', w: 256, h: 128 },

  { key: 'ui_title_logo', file: UI_DIR + 'ui_title_logo.png', placeholder: 'logo', w: 512, h: 256 },
  { key: 'ui_icon_paw', file: UI_DIR + 'ui_icon_paw.png', placeholder: 'iconPaw', w: 128, h: 128 },
  { key: 'ui_icon_bone', file: UI_DIR + 'ui_icon_bone.png', placeholder: 'iconBone', w: 128, h: 128 },
  { key: 'ui_icon_house', file: UI_DIR + 'ui_icon_house.png', placeholder: 'iconHouse', w: 128, h: 128 },
  { key: 'ui_btn_left', file: UI_DIR + 'ui_btn_left.png', placeholder: 'btnLeft', w: 128, h: 128 },
  { key: 'ui_btn_right', file: UI_DIR + 'ui_btn_right.png', placeholder: 'btnRight', w: 128, h: 128 },
  { key: 'ui_btn_down', file: UI_DIR + 'ui_btn_down.png', placeholder: 'btnDown', w: 128, h: 128 },
  { key: 'ui_btn_jump', file: UI_DIR + 'ui_btn_jump.png', placeholder: 'btnJump', w: 160, h: 160 },
  { key: 'ui_btn_interact', file: UI_DIR + 'ui_btn_interact.png', placeholder: 'btnInteract', w: 128, h: 128 },
  { key: 'ui_prompt_interact', file: UI_DIR + 'ui_prompt_interact.png', placeholder: 'promptInteract', w: 96, h: 96 },
  { key: 'ui_scent_mote', file: UI_DIR + 'ui_scent_mote.png', placeholder: 'scentMote', w: 96, h: 96 },
  { key: 'ui_save_glow', file: UI_DIR + 'ui_save_glow.png', placeholder: 'saveGlow', w: 192, h: 192 },
  { key: 'ui_save_burst', file: UI_DIR + 'ui_save_burst.png', placeholder: 'saveBurst', w: 256, h: 256 },
  { key: 'ui_rotate_device', file: UI_DIR + 'ui_rotate_device.png', placeholder: 'rotate', w: 256, h: 256 },
  { key: 'ui_pause_icon', file: UI_DIR + 'ui_pause_icon.png', placeholder: 'iconPause', w: 96, h: 96 },
  { key: 'ui_credits_marks', file: UI_DIR + 'ui_credits_marks.png', placeholder: 'credits', w: 512, h: 128 },
  { key: 'ui_vignette', file: UI_DIR + 'ui_vignette.png', placeholder: 'vignette', w: 960, h: 540 },
];

/** 오디오. 없으면 AudioSystem 이 합성음(SFX) 또는 무음(BGM)으로 대체한다 */
export const AUDIO = [
  { key: 'bgm_title', file: 'bgm_title', kind: 'bgm' },
  { key: 'bgm_prologue', file: 'bgm_prologue', kind: 'bgm' },
  { key: 'bgm_stage1_city', file: 'bgm_stage1_city', kind: 'bgm' },
  { key: 'bgm_stage2_coast', file: 'bgm_stage2_coast', kind: 'bgm' },
  { key: 'bgm_stage3_mountain', file: 'bgm_stage3_mountain', kind: 'bgm' },
  { key: 'bgm_stage4_field', file: 'bgm_stage4_field', kind: 'bgm' },
  { key: 'bgm_ending', file: 'bgm_ending', kind: 'bgm' },
  { key: 'jingle_save', file: 'jingle_save', kind: 'jingle' },
  { key: 'jingle_stage_clear', file: 'jingle_stage_clear', kind: 'jingle' },

  { key: 'amb_city_morning', file: 'amb_city_morning', kind: 'ambience' },
  { key: 'amb_coast_waves', file: 'amb_coast_waves', kind: 'ambience' },
  { key: 'amb_mountain_night', file: 'amb_mountain_night', kind: 'ambience' },
  { key: 'amb_field_wind', file: 'amb_field_wind', kind: 'ambience' },
  { key: 'amb_room_night', file: 'amb_room_night', kind: 'ambience' },

  { key: 'sfx_step_soft', file: 'sfx_step_soft', kind: 'sfx' },
  { key: 'sfx_step_hard', file: 'sfx_step_hard', kind: 'sfx' },
  { key: 'sfx_step_water', file: 'sfx_step_water', kind: 'sfx' },
  { key: 'sfx_jump', file: 'sfx_jump', kind: 'sfx' },
  { key: 'sfx_land', file: 'sfx_land', kind: 'sfx' },
  { key: 'sfx_dispel', file: 'sfx_dispel', kind: 'sfx' },
  { key: 'sfx_respawn', file: 'sfx_respawn', kind: 'sfx' },
  { key: 'sfx_dig', file: 'sfx_dig', kind: 'sfx' },
  { key: 'sfx_splash', file: 'sfx_splash', kind: 'sfx' },
  { key: 'sfx_ball', file: 'sfx_ball', kind: 'sfx' },
  { key: 'sfx_sniff', file: 'sfx_sniff', kind: 'sfx' },
  { key: 'sfx_bark_soft', file: 'sfx_bark_soft', kind: 'sfx' },
  { key: 'sfx_whine', file: 'sfx_whine', kind: 'sfx' },
  { key: 'sfx_scratch_door', file: 'sfx_scratch_door', kind: 'sfx' },
  { key: 'sfx_car_pass', file: 'sfx_car_pass', kind: 'sfx' },
  { key: 'sfx_rock_fall', file: 'sfx_rock_fall', kind: 'sfx' },
  { key: 'sfx_crumble', file: 'sfx_crumble', kind: 'sfx' },
  { key: 'sfx_boar_snort', file: 'sfx_boar_snort', kind: 'sfx' },
  { key: 'sfx_wave_rush', file: 'sfx_wave_rush', kind: 'sfx' },
  { key: 'sfx_steam', file: 'sfx_steam', kind: 'sfx' },
  { key: 'sfx_ui_select', file: 'sfx_ui_select', kind: 'sfx' },
  { key: 'sfx_page_turn', file: 'sfx_page_turn', kind: 'sfx' },
];

export const DIRS = { SPRITE_DIR, BG_DIR, PROP_DIR, UI_DIR, AUDIO_DIR };
