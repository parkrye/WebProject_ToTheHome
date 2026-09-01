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

/** 8프레임 스프라이트 시트. placeholder: PlaceholderArt 의 포즈 생성기 이름 */
export const SPRITE_SHEETS = [
  { key: 'dog_idle', file: 'dog_idle.png', w: 128, h: 128, fps: 8, loop: true, placeholder: 'dogIdle' },
  { key: 'dog_walk', file: 'dog_walk.png', w: 128, h: 128, fps: 10, loop: true, placeholder: 'dogWalk' },
  { key: 'dog_run', file: 'dog_run.png', w: 128, h: 128, fps: 14, loop: true, placeholder: 'dogRun' },
  { key: 'dog_jump', file: 'dog_jump.png', w: 128, h: 128, fps: 12, loop: false, placeholder: 'dogJump' },
  { key: 'dog_sniff', file: 'dog_sniff.png', w: 128, h: 128, fps: 8, loop: true, placeholder: 'dogSniff' },
  { key: 'dog_dispel', file: 'dog_dispel.png', w: 128, h: 128, fps: 10, loop: false, placeholder: 'dogDispel' },
  { key: 'dog_dig', file: 'dog_dig.png', w: 128, h: 128, fps: 12, loop: true, placeholder: 'dogDig' },
  { key: 'dog_sleep', file: 'dog_sleep.png', w: 128, h: 128, fps: 6, loop: true, placeholder: 'dogSleep' },
  { key: 'dog_splash', file: 'dog_splash.png', w: 128, h: 128, fps: 12, loop: true, placeholder: 'dogSplash' },
  { key: 'dog_ball_nudge', file: 'dog_ball_nudge.png', w: 128, h: 128, fps: 10, loop: true, placeholder: 'dogBall' },

  { key: 'dog_puppy_run', file: 'dog_puppy_run.png', w: 128, h: 128, fps: 14, loop: true, placeholder: 'puppyRun' },
  { key: 'owner_child_run', file: 'owner_child_run.png', w: 128, h: 128, fps: 12, loop: true, placeholder: 'childRun' },
  { key: 'owner_walk_silhouette', file: 'owner_walk_silhouette.png', w: 128, h: 128, fps: 8, loop: false, placeholder: 'ownerWalk' },
  { key: 'owner_adult_wake', file: 'owner_adult_wake.png', w: 256, h: 192, fps: 8, loop: false, placeholder: 'ownerWake' },
  { key: 'owner_dog_hug', file: 'owner_dog_hug.png', w: 256, h: 192, fps: 8, loop: false, placeholder: 'ownerHug' },

  { key: 'car_pass', file: 'car_pass.png', w: 256, h: 192, fps: 10, loop: true, placeholder: 'car' },
  { key: 'wave_loop', file: 'wave_loop.png', w: 256, h: 192, fps: 8, loop: true, placeholder: 'wave' },
  { key: 'boar_charge', file: 'boar_charge.png', w: 256, h: 192, fps: 12, loop: false, placeholder: 'boar' },
  { key: 'rock_fall', file: 'rock_fall.png', w: 64, h: 64, fps: 12, loop: false, placeholder: 'rock' },
  { key: 'platform_crumble', file: 'platform_crumble.png', w: 256, h: 192, fps: 10, loop: false, placeholder: 'crumble' },
  { key: 'steam_vent', file: 'steam_vent.png', w: 128, h: 128, fps: 10, loop: true, placeholder: 'steam' },
  { key: 'seagull_fly', file: 'seagull_fly.png', w: 128, h: 128, fps: 12, loop: true, placeholder: 'bird' },

  { key: 'butterfly', file: 'butterfly.png', w: 64, h: 64, fps: 10, loop: true, placeholder: 'butterfly' },
  { key: 'scent_wisp', file: 'scent_wisp.png', w: 64, h: 64, fps: 10, loop: true, placeholder: 'scent' },
  { key: 'savepoint_glow', file: 'savepoint_glow.png', w: 128, h: 128, fps: 8, loop: true, placeholder: 'saveGlow' },
  { key: 'stream_water', file: 'stream_water.png', w: 128, h: 128, fps: 10, loop: true, placeholder: 'water' },
  { key: 'owl_watch', file: 'owl_watch.png', w: 128, h: 128, fps: 6, loop: true, placeholder: 'owl' },
  { key: 'grass_sway', file: 'grass_sway.png', w: 128, h: 128, fps: 8, loop: true, placeholder: 'grass' },
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

  { key: 'bg_mountain_sky_night', file: 'bg_mountain_sky_night.png', kind: 'sky', theme: 'mountain' },
  { key: 'bg_mountain_sky_dawn', file: 'bg_mountain_sky_dawn.png', kind: 'sky', theme: 'mountain_dawn' },
  { key: 'bg_mountain_far', file: 'bg_mountain_far.png', kind: 'far', theme: 'mountain' },
  { key: 'bg_mountain_mid', file: 'bg_mountain_mid.png', kind: 'mid', theme: 'mountain' },
  { key: 'bg_mountain_near', file: 'bg_mountain_near.png', kind: 'near', theme: 'mountain' },

  { key: 'bg_columbarium_interior', file: 'bg_columbarium_interior.png', kind: 'interior', theme: 'city' },
  { key: 'bg_home_interior_night', file: 'bg_home_interior_night.png', kind: 'interior', theme: 'home' },
  { key: 'bg_home_exterior', file: 'bg_home_exterior.png', kind: 'interior', theme: 'field' },
];

/** 지형 타일 텍스처. 8×8 단색 타일을 tileSprite 로 늘려 쓴다 */
export const TILESETS = [
  { key: 'tiles_city', file: 'tiles_city.png', theme: 'city' },
  { key: 'tiles_coast', file: 'tiles_coast.png', theme: 'coast' },
  { key: 'tiles_mountain', file: 'tiles_mountain.png', theme: 'mountain' },
  { key: 'tiles_field', file: 'tiles_field.png', theme: 'field' },
];

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
  { key: 'prop_tree', file: PROP_DIR + 'prop_tree.png', placeholder: 'tree', w: 192, h: 256 },
  { key: 'prop_lamp', file: PROP_DIR + 'prop_lamp.png', placeholder: 'lamp', w: 96, h: 224 },
  { key: 'prop_house', file: PROP_DIR + 'prop_house.png', placeholder: 'house', w: 384, h: 320 },
  { key: 'prop_door', file: PROP_DIR + 'prop_door.png', placeholder: 'door', w: 128, h: 224 },
  { key: 'prop_bed', file: PROP_DIR + 'prop_bed.png', placeholder: 'bed', w: 256, h: 128 },
  { key: 'prop_niche_wall', file: PROP_DIR + 'prop_niche_wall.png', placeholder: 'nicheWall', w: 320, h: 320 },

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
