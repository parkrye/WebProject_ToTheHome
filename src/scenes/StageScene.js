import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA, PARALLAX, PARALLAX_DROP, SCENT, DOG, MIX, FADE } from '../config.js';
import { getStage, LAST_STAGE } from '../data/stages.js';
import { Dog } from '../objects/Dog.js';
import { createGround, createLedge, MovingPlatform, CrumblePlatform } from '../objects/Platforms.js';
import { Keepsake, KeepsakeRow } from '../objects/Keepsake.js';
import { HAZARD_TYPES } from '../objects/Hazards.js';
import { SavePoint } from '../objects/SavePoint.js';
import { ScentTrail, SignBoard, placeProp, StageGoal, GoalMarker } from '../objects/Decor.js';
import { pathNodes, pathLinks, pathRoute, nearestNode, PATH_STEP } from '../systems/StageBuilder.js';
import { sizeTo } from '../systems/Layout.js';

/**
 * 주인의 차가 화면에서 차지할 높이.
 *
 * 강아지 그림이 71px 이고 0.4m 쯤이므로 1m 는 178px 이다 — 승용차 1.4m.
 */
const OWNER_CAR_H = 250;

/**
 * 스테이지 공용 씬. 레벨은 전부 src/data/stage*.js 의 데이터로 만들어진다.
 */
export default class StageScene extends Phaser.Scene {
  constructor() {
    super('Stage');
  }

  init(data) {
    this.stageId = data.stageId ?? 1;
    this.fromCheckpoint = !!data.fromCheckpoint;
    this.def = getStage(this.stageId);
    this.cleared = false;
    this.dying = false;

    /**
     * **씬 인스턴스는 스테이지가 바뀌어도 그대로 재사용된다.**
     *
     * 도착 구역은 움직이지 않으므로 한 번만 재 두는데, 그 값을 여기서 지우지 않아서
     * 2스테이지부터는 **1스테이지의 도착 사각형**과 겹치는지를 보고 있었다. 그래서
     * 2·3·4스테이지에서는 도착 지점에 서 있어도 안내가 뜨지 않고 E 도 먹지 않았다
     * (플레이 리뷰 5차 3). 씬을 다시 쓸 때마다 계산도 다시 한다.
     */
    this.goalBounds = null;
    this.atGoal = false;
  }

  create() {
    const def = this.def;
    this.audio = this.registry.get('audio');
    this.input_ = this.registry.get('input');
    this.save = this.registry.get('save');
    this.input_.attach(this);
    this.input_.clearTouch();
    this.save.enterStage(this.stageId);

    this.physics.world.setBounds(0, -200, def.width, def.height + 400);
    this.cameras.main.setBounds(0, 0, def.width, def.height);

    this.buildBackground();
    this.buildTerrain();
    this.buildHazards();
    this.buildDecor();
    this.buildPlayer();
    this.buildCollisions();
    this.buildCamera();

    this.scene.launch('Hud');
    this.scene.bringToTop('Hud');

    this.audio.playBgm(this, def.bgm);
    this.audio.playAmbience(this, def.ambience);

    // 세이브 포인트에서 이어할 때는 이미 깨어 있다. 처음부터 시작할 때만 깨어난다.
    // resolveSpawn() 과 같은 판단이어야 자다 깬 자리가 곧 출발 지점이 된다
    const atCheckpoint = this.fromCheckpoint && this.checkpointDef();
    if (def.wake && !atCheckpoint) {
      this.playWake(def.wake);
    } else if (def.intro && this.textures.exists(def.intro.texture)) {
      this.playIntro(def.intro);
    } else {
      this.cameras.main.fadeIn(FADE.in, 0, 0, 0);
    }
  }

  /* --------------------------------------------------------------- */
  /* 구성                                                              */
  /* --------------------------------------------------------------- */

  buildBackground() {
    const { layers } = this.def;
    this.bgLayers = [];

    // 카메라가 가장 아래에 있을 때의 스크롤 값. 여기서 얼마나 올라왔는지로 레이어를 내린다
    this.floorScrollY = Math.max(0, (this.def.height ?? GAME_HEIGHT) - GAME_HEIGHT);

    // **얼마나 올라가야 다 내려가는지를 스테이지 높이로 정한다.**
    //
    // 예전에는 올라온 px 에 고정 비율을 곱해서, 스테이지가 높든 낮든 1000px 만
    // 올라가면 연출이 끝나 버렸다. 오를 수 있는 높이의 fullAt(80%) 를 올랐을 때
    // 가까운 레이어가 화면 아래로 다 빠지도록 환산한다 (플레이 리뷰 2차 5)
    const climb = Math.max(1, this.floorScrollY * PARALLAX_DROP.fullAt);
    this.dropScale = GAME_HEIGHT / climb;

    const add = (key, factor, depth, drop = 0) => {
      if (!key || !this.textures.exists(key)) return;
      const tile = this.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(depth);
      this.bgLayers.push({ tile, factor, drop });
    };

    add(layers.sky, PARALLAX.sky, 0);
    add(layers.far, PARALLAX.far, 1);
    add(layers.mid, PARALLAX.mid, 2, PARALLAX_DROP.mid);
    add(layers.near, PARALLAX.near, 3, PARALLAX_DROP.near);

    this.vignette = this.add
      .image(0, 0, 'ui_vignette')
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(40)
      .setAlpha(0.22);
  }

  buildTerrain() {
    const def = this.def;
    this.groundGroup = this.physics.add.staticGroup();
    this.movingGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.crumbleGroup = this.physics.add.staticGroup();

    (def.ground || []).forEach((g) =>
      createGround(this, this.groundGroup, { surface: def.surface, ...g }, def.tile)
    );
    (def.ledges || []).forEach((l) =>
      createLedge(this, this.groundGroup, { surface: def.surface, ...l }, def.tile)
    );

    (def.moving || []).forEach((m) => {
      const platform = new MovingPlatform(this, m, def.tile);
      this.movingGroup.add(platform);
    });

    (def.crumble || []).forEach((c) => {
      const platform = new CrumblePlatform(this, c, def.tile);
      this.crumbleGroup.add(platform);
    });
  }

  buildHazards() {
    this.hazards = [];
    this.hazardGroup = this.physics.add.group({ allowGravity: false });
    // 고정 위험(냇물, 덫)은 static body 라서 dynamic 그룹에 넣으면 바디가 뒤집힌다
    this.staticHazardGroup = this.physics.add.staticGroup();

    (this.def.hazards || []).forEach((h) => {
      const Type = HAZARD_TYPES[h.type];
      if (!Type) return;
      const hazard = new Type(this, { actors: this.def.actors, ...h });
      this.hazards.push(hazard);
      if (h.type === 'static') {
        this.staticHazardGroup.add(hazard);
        return;
      }
      this.hazardGroup.add(hazard);
    });
  }

  buildDecor() {
    const def = this.def;

    (def.props || []).forEach((p) => placeProp(this, p));

    this.signs = (def.signs || []).map((s) => new SignBoard(this, s));

    this.scentTrail = new ScentTrail(this);
    this.buildPathGraph();

    // 세이브 포인트는 여러 개일 수 있다. 가까운 것 하나만 활성으로 잡는다
    const points = def.savePoints?.length ? def.savePoints : def.savePoint ? [def.savePoint] : [];
    this.savePoints = points.map((p) => new SavePoint(this, p));
    this.savePoint = this.savePoints[0] || null;
    this.saved = points.some((p) => this.save.data.checkpoint === p.id);

    this.goal = new StageGoal(this, def.goal);

    // 어디로 가야 하는지 보이게 한다 (플레이 리뷰 15).
    // 출발 표시는 두지 않는다 — 강아지가 이미 거기 서 있다 (플레이 리뷰 2차 2)
    this.goalMarker = new GoalMarker(this, def.goal.x, def.goal.y + (def.goal.h ?? 300) / 2);

    // 기억 조각 — 이미 주운 것은 다시 놓지 않는다
    const spots = def.keepsakes || [];
    this.keepsakeGroup = this.physics.add.group({ allowGravity: false });
    spots.forEach((k) => {
      if (this.save.hasKeepsake(k.id)) return;
      this.keepsakeGroup.add(new Keepsake(this, k));
    });
    this.keepsakeRow = new KeepsakeRow(this, spots.length, this.save.keepsakesIn(def.id));

    // 스테이지 4 의 회상 실루엣
    this.memories = (def.memories || []).map((m) => ({ ...m, fired: false }));
    this.events_ = (def.events || []).map((e) => ({ ...e, fired: false }));
  }

  /**
   * 길찾기용 발판 그래프.
   *
   * 냄새는 미리 그려 둔 한 줄기를 켜는 게 아니라, **맡을 때마다 지금 자리에서**
   * 도착까지의 최단 경로를 찾아 준다 (플레이 리뷰 20). 그러려면 발판 사이가 어떻게
   * 이어져 있는지를 알아야 한다.
   *
   * 이어짐의 규칙은 생성기와 **같은 함수**(StageBuilder.linked)를 쓴다. 생성기가
   * "오갈 수 있다"고 보고 이은 길이 곧 여기서 찾는 길이어야 하기 때문이다.
   */
  buildPathGraph() {
    const def = this.def;

    // 발판 하나에 노드 하나면 폭 2000px 짜리 바닥은 가운데 한 점만 길이 된다.
    // 일정 간격으로 쪼개야 긴 바닥에서도 갈 방향이 보인다 (StageBuilder.PATH_STEP)
    this.pathPads = pathNodes([...(def.ground || []), ...(def.ledges || [])]);

    // 인접 목록을 한 번만 만들어 둔다. 매번 O(n²) 로 재면 맡을 때마다 버벅인다
    this.pathAdj = pathLinks(this.pathPads);

    this.goalPad = nearestNode(
      this.pathPads,
      def.goal.x,
      def.goal.y + (def.goal.h ?? 300) / 2
    );
  }

  /**
   * 지금 자리에서 도착까지의 최단 경로를 낸다.
   *
   * @returns {{x:number,y:number}[]} 앞쪽 몇 걸음 (config.SCENT.lookahead)
   */
  scentRoute() {
    if (!this.pathPads?.length || this.goalPad < 0) return [];
    const from = nearestNode(this.pathPads, this.dog.x, this.dog.body.bottom);
    const route = pathRoute(this.pathAdj, from, this.goalPad);
    if (route.length < 2) return [];

    // 지금 서 있는 칸은 빼고, **앞쪽 얼마까지만** 보여 준다.
    // 노드 간격이 촘촘해졌으므로 걸음 수가 아니라 걸어갈 거리로 끊는다
    const motes = [];
    let walked = 0;

    for (let i = 1; i < route.length && motes.length < SCENT.maxMotes; i += 1) {
      const a = this.pathPads[route[i - 1]];
      const b = this.pathPads[route[i]];
      const span = Math.hypot(b.cx - a.cx, b.y - a.y);

      // 최단 경로는 **가장 적게 뛰는 길**이라 한 칸이 450px 씩 벌어지기도 한다.
      // 그대로 찍으면 입자가 띄엄띄엄해서 어디로 가라는 건지 읽히지 않는다.
      // 같은 높이를 걸어가는 구간은 노드 간격(PATH_STEP)으로 잘게 나눠 찍는다 —
      // 높이가 달라지는 구간은 뛰어 건너는 곳이라 나누지 않는다
      const steps = Math.abs(b.y - a.y) < 8 ? Math.max(1, Math.round(span / PATH_STEP)) : 1;

      for (let k = 1; k <= steps && motes.length < SCENT.maxMotes; k += 1) {
        walked += span / steps;
        if (walked > SCENT.lookahead) return motes;
        motes.push({
          x: a.cx + ((b.cx - a.cx) * k) / steps,
          y: a.y + ((b.y - a.y) * k) / steps - 62,
        });
      }
    }
    return motes;
  }

  /** 지금 저장되어 있는 세이브 포인트의 정의 */
  checkpointDef() {
    const def = this.def;
    const points = def.savePoints?.length ? def.savePoints : def.savePoint ? [def.savePoint] : [];
    return points.find((p) => p.id === this.save.data.checkpoint) || null;
  }

  buildPlayer() {
    const spawn = this.resolveSpawn();
    this.dog = new Dog(this, spawn.x, spawn.y);
    this.dog.setSurface(this.def.surface || 'soft');
  }

  resolveSpawn() {
    const def = this.def;
    const at = this.checkpointDef();
    if (this.fromCheckpoint && at) return { x: at.x, y: at.y - 60 };
    return def.start;
  }

  buildCollisions() {
    // 딛고 선 발판을 기억해 둔다. 아래 + 점프로 통과할 때 그 발판만 열기 위해서다
    const stand = (dog, platform) => {
      if (dog.body.touching.down) dog.standingOn = platform;
    };

    this.physics.add.collider(this.dog, this.groundGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
      stand(dog, platform);
    });

    this.physics.add.collider(this.dog, this.movingGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
      stand(dog, platform);
      // 발판을 따라 움직이도록 수평 이동분을 더해준다
      if (platform.body.velocity.x) dog.x += platform.body.velocity.x * (this.game.loop.delta / 1000);
    });

    this.physics.add.collider(this.dog, this.crumbleGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
      if (dog.body.velocity.y >= 0) platform.trigger();
    });

    this.physics.add.overlap(this.dog, this.hazardGroup, (dog, hazard) => this.onHazard(hazard));
    this.physics.add.overlap(this.dog, this.staticHazardGroup, (dog, hazard) => this.onHazard(hazard));

    this.physics.add.overlap(this.dog, this.keepsakeGroup, (dog, item) => this.onKeepsake(item));
  }

  buildCamera() {
    const cam = this.cameras.main;

    /**
     * 카메라는 강아지가 아니라 **시트 보정을 뺀 자리**를 따라간다.
     *
     * `Dog.applySheetSize()` 는 시트마다 다른 칸 여백을 메우려고 스프라이트 중심을
     * 몇 px 올렸다 내린다. 그림은 제자리에 남지만 **중심 좌표는 튄다** — 그걸 그대로
     * 따라가면 걷다 뛸 때마다 화면이 까딱거린다 (플레이 리뷰 4차 2).
     * 보정분을 되돌린 값을 읽어 오면 어떤 모션에서도 한 점으로 이어진다.
     *
     * 읽는 시점의 최신 좌표라야 하므로 값을 복사하지 않고 getter 로 넘긴다.
     */
    const dog = this.dog;
    this.camFocus = {
      get x() {
        return dog.x;
      },
      get y() {
        return dog.y - (dog.sheetDropPx ?? 0);
      },
    };

    // 정수 자리로 반올림하지 않는다 — 소수 단위 추적을 반올림하면 덜컥거린다 (main.js)
    cam.startFollow(this.camFocus, false, CAMERA.lerp, CAMERA.lerp, 0, CAMERA.followOffsetY);
    cam.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
  }

  /**
   * 잠에서 깨어나며 시작하는 연출.
   *
   * 페이드인이 도는 동안 **자는 부분만** 돌리고, 다 밝아진 뒤 잠시 있다가 그 시트를
   * 거꾸로 돌려 일어난다. 어디에서 왔는지 말하지 않고 그냥 눈을 뜬다.
   */
  playWake(wake) {
    const fade = wake.fade ?? FADE.in;
    this.dog.sleep();
    this.cameras.main.fadeIn(fade, 0, 0, 0);

    this.time.delayedCall(fade + (wake.hold ?? 1200), () => {
      if (this.cleared || this.dying) return;
      this.dog.wakeUp(wake.rise ?? 1100);
    });
  }

  playIntro(intro) {
    const cover = this.add
      .image(0, 0, intro.texture)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(45);

    this.cameras.main.fadeIn(FADE.in, 0, 0, 0);
    this.dog.setCutscene(true);

    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: cover,
        alpha: 0,
        duration: intro.fadeIn ?? 1400,
        onComplete: () => {
          cover.destroy();
          this.dog.setCutscene(false);
        },
      });
    });
  }

  /* --------------------------------------------------------------- */
  /* 상호작용                                                          */
  /* --------------------------------------------------------------- */

  onHazard(hazard) {
    if (this.dying || this.cleared) return;
    if (!this.dog.isControllable && hazard.effect !== 'lift') return;

    if (hazard.effect === 'lift') {
      if (hazard.phase === 'blow') this.dog.body.setVelocityY(hazard.liftPower);
      return;
    }

    if (hazard.effect === 'push') {
      const dir = this.dog.x < hazard.x ? -1 : 1;
      this.dog.body.setVelocityX(dir * 320);
      this.dog.body.setVelocityY(-180);
      return;
    }

    this.killDog();
  }

  async killDog() {
    if (this.dying) return;
    this.dying = true;
    this.input_.clearTouch();

    this.cameras.main.flash(220, 255, 240, 210);
    await this.dog.die();

    const spawn = this.checkpointPosition();
    this.cameras.main.fadeOut(FADE.death, 0, 0, 0);
    await new Promise((resolve) => this.cameras.main.once('camerafadeoutcomplete', resolve));

    await this.dog.respawnAt(spawn.x, spawn.y);
    this.cameras.main.fadeIn(FADE.respawn, 0, 0, 0);
    this.dying = false;
  }

  checkpointPosition() {
    const def = this.def;
    const at = this.checkpointDef();
    if (at) return { x: at.x, y: at.y - 60 };
    return { x: def.start.x, y: def.start.y };
  }

  async useSavePoint() {
    const point = this.savePoint;
    if (!point || point.busy || !this.dog.isControllable) return;
    point.busy = true;

    const isNew = this.save.saveCheckpoint(this.stageId, point.id);
    this.audio.duck(this, point.motionDuration + 400);
    if (point.def.sfx) this.audio.play(point.def.sfx, { volume: 0.5 });

    await this.dog.playMotion(point.motion, point.motionDuration);

    // 처음 저장할 때만 저장 이펙트가 난다. 재방문은 그냥 노는 것.
    if (isNew || !this.saved) {
      point.burst();
      this.audio.play('jingle_save', { volume: MIX.jingle });
      this.saved = true;
    }

    point.busy = false;
  }

  /** 기억 조각을 주웠다 */
  onKeepsake(item) {
    if (!item.take()) return;
    this.save.collectKeepsake(item.id);
    this.keepsakeRow.light(this);
    this.audio?.play('sfx_ui_select', { volume: 0.5 });
  }

  onClear() {
    if (this.cleared) return;
    this.cleared = true;
    this.dog.setCutscene(true);
    this.dog.body.setVelocity(0, 0);
    this.dog.anims.play('dog_idle', true);

    this.save.clearStage(this.stageId);
    this.audio.play('jingle_stage_clear', { volume: MIX.jingle });
    this.audio.stopAmbience(this);
    this.audio.stopBgm(this, 1200);

    this.cameras.main.fadeOut(FADE.clear, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Hud');
      if (this.stageId >= LAST_STAGE) {
        this.scene.start('Ending');
        return;
      }
      this.scene.start('Stage', { stageId: this.stageId + 1 });
    });
  }

  triggerMemory(memory) {
    memory.fired = true;
    const y = memory.y;
    const dog = this.add.sprite(memory.x - 90, y, memory.dog).setAlpha(0).setDepth(9).setScale(1.05);
    const owner = this.add.sprite(memory.x - 200, y, memory.owner).setAlpha(0).setDepth(9).setScale(1.1);
    dog.play(memory.dog);
    owner.play(memory.owner);

    if (memory.lead === 'dog') dog.x += 70;
    if (memory.lead === 'owner') owner.x += 140;

    [dog, owner].forEach((sprite, i) => {
      this.tweens.add({
        targets: sprite,
        alpha: 0.42,
        duration: 900,
        delay: i * 120,
        yoyo: true,
        hold: 1500,
        onComplete: () => sprite.destroy(),
      });
      this.tweens.add({ targets: sprite, x: sprite.x + 260, duration: 3400, ease: 'Sine.easeOut' });
    });
  }

  /**
   * 스테이지 2 — 주인의 차와 같은 색 차가 지나간다.
   *
   * 크기와 자리를 **강아지를 기준으로** 잡는다. 예전에는 원본 PNG 를 크기 지정 없이
   * 놓아서 화면을 통째로 덮었고, 손으로 잡아 둔 좌표는 관리 툴 지형에서 뜻을 잃어
   * 엉뚱한 높이에서 튀어나왔다 (플레이 리뷰 3차 2).
   */
  triggerEvent(event) {
    event.fired = true;
    if (event.type !== 'ownerCar') return;

    // 화면 밖에서 들어와 강아지를 지나쳐 화면 밖으로 나간다
    const groundY = this.dog.body.bottom;
    const fromX = this.dog.x + GAME_WIDTH * 0.8;
    const car = this.add.image(fromX, groundY, 'prop_owner_car').setOrigin(0.5, 1).setDepth(19);
    sizeTo(car, { height: OWNER_CAR_H });
    this.audio.play('sfx_car_pass', { volume: 0.5 });

    this.dog.setCutscene(true);
    this.dog.body.setVelocityX(0);
    this.dog.anims.play('dog_idle', true);

    this.tweens.add({
      targets: car,
      x: fromX - GAME_WIDTH * 1.8,
      duration: 4200,
      ease: 'Sine.easeInOut',
      onComplete: () => car.destroy(),
    });

    this.time.delayedCall(1500, () => {
      if (!this.cleared) this.dog.setCutscene(false);
    });
  }

  /* --------------------------------------------------------------- */

  update(time, delta) {
    const input = this.input_;
    input.update();

    if (this.dog) this.dog.update(time, delta, input);

    this.updateCamera(delta);
    this.updateParallax();
    this.hazards.forEach((hazard) => hazard.tick(time, delta));
    this.updateSavePoint(time);
    this.updateSigns();
    this.updateZones();
    this.updateGoal();
    this.updateSniff(time, delta);
    this.checkFall();
  }

  updateParallax() {
    const cam = this.cameras.main;

    // 세로로는 흘리지 않는다.
    //
    // 배경 그림은 가로로만 이어지도록 그려져 있어서, 세로로 밀면 위아래로 **반복되어**
    // 같은 건물이 층층이 쌓여 보인다. 위로 한참 올라가는 지도에서 특히 티가 난다.
    // 먼 배경은 원래 잘 안 움직이는 것이므로 가만히 두는 편이 자연스럽다.
    // 다만 **높이 올라가면 가까운 레이어는 발밑으로 내려간다.** 반복해 그리는 게 아니라
    // 통째로 화면 아래로 밀어내는 것이므로 같은 건물이 층층이 쌓이지 않는다.
    const rise = Math.max(0, this.floorScrollY - cam.scrollY);

    this.bgLayers.forEach(({ tile, factor, drop }) => {
      tile.tilePositionX = cam.scrollX * factor;
      if (drop) tile.y = Math.min(rise * drop * this.dropScale, GAME_HEIGHT);
    });
  }

  /**
   * 떨어지는 동안 카메라를 조인다.
   *
   * 낙하 속도가 빠를수록 추적을 빠르게, 세로 여유를 좁게 만든다. 평소 값 그대로 두면
   * 강아지가 화면 아래 끝에 걸린 채 덜컥거린다 (config.CAMERA 주석 참고).
   *
   * **여유 칸은 만들어 둔 것을 고쳐 쓴다.** `setDeadzone()` 은 추종 대상이 있으면
   * 스크롤을 그 자리로 **즉시 옮겨 놓는다**(Phaser Camera.setDeadzone). 매 프레임
   * 부르면 lerp 도 여유 칸도 통째로 무효가 되어, 강아지 좌표의 잔떨림이 1:1 로
   * 화면에 실린다 — 이동 중 카메라가 버벅이던 진짜 원인이다 (플레이 리뷰 4차 5).
   */
  updateCamera(delta) {
    if (!this.dog) return;
    const cam = this.cameras.main;
    const body = this.dog.body;

    const t = Phaser.Math.Clamp(
      (body.velocity.y - CAMERA.fallFrom) / (CAMERA.fallTo - CAMERA.fallFrom),
      0,
      1
    );

    cam.setLerp(CAMERA.lerp, Phaser.Math.Linear(CAMERA.lerp, CAMERA.fallLerp, t));
    if (cam.deadzone) {
      cam.deadzone.height = Phaser.Math.Linear(
        CAMERA.deadzoneHeight,
        CAMERA.fallDeadzoneHeight,
        t
      );
    }

    // 아래쪽 보기 — 서서 ↓ 를 쥐고 있으면 카메라가 스르륵 내려가 발밑을 비춘다.
    // 떨어지는 중에는 낙하 추적이 우선이므로 원래 자리로 돌아온다
    const onGround = body.blocked.down || body.touching.down;
    const looking =
      this.dog.isControllable && onGround && this.input_.down && Math.abs(body.velocity.x) < 30;
    this.lookDownHold = looking ? (this.lookDownHold ?? 0) + delta : 0;

    const target =
      this.lookDownHold >= CAMERA.lookDownHold ? CAMERA.lookDownOffset : CAMERA.followOffsetY;
    cam.followOffset.y = Phaser.Math.Linear(cam.followOffset.y, target, CAMERA.lookDownLerp);
  }

  updateSavePoint(time) {
    if (!this.savePoints?.length || !this.dog) return;

    // 여러 개 중 **지금 닿을 수 있는 것**을 활성으로 삼는다
    this.savePoint = null;
    this.savePoints.forEach((point) => {
      // 닿는 범위는 소품 크기에서 잰다 (SavePoint.reachX)
      const near =
        Math.abs(this.dog.x - point.x) < (point.reachX ?? 110) &&
        Math.abs(this.dog.y - point.y) < (point.reachY ?? 160);
      point.showPrompt(near && this.dog.isControllable);
      if (near) this.savePoint = point;
    });

    // 가까운 것이 있을 때만 상호작용을 받는다
    if (this.savePoint && this.input_.interactPressed) this.useSavePoint();
  }

  updateSigns() {
    if (!this.signs.length || !this.dog) return;
    this.signs.forEach((sign) => sign.highlight(Math.abs(this.dog.x - sign.x) < 130));
  }

  updateZones() {
    if (!this.dog) return;

    this.memories.forEach((memory) => {
      if (memory.fired) return;
      if (Math.abs(this.dog.x - memory.x) < 90) this.triggerMemory(memory);
    });

    this.events_.forEach((event) => {
      if (event.fired) return;
      if (Math.abs(this.dog.x - event.x) < (event.w ?? 120) / 2) this.triggerEvent(event);
    });
  }

  /**
   * 냄새 맡기 — E 를 쥐고 있으면 한다.
   *
   * 세이브 포인트 앞에서는 E 가 상호작용이므로 냄새를 맡지 않는다.
   * 냄새(길찾기)는 1초 이상 유지해야 켜지고, **쥐고 있는 동안만** 반짝인다.
   */
  updateSniff(time, delta) {
    if (!this.dog) return;

    const busy = this.savePoint || this.atGoal; // 그 앞에서는 E 가 상호작용이다
    const canSniff =
      this.dog.isControllable && !busy && Math.abs(this.dog.body.velocity.x) < 30;
    const sniffing = canSniff && this.input_.interactHeld;

    this.sniffHold = sniffing ? (this.sniffHold ?? 0) + delta : 0;
    this.dog.setSniffing(sniffing);

    if (this.sniffHold < SCENT.holdToShow) {
      this.scentTrail.hide();
      return;
    }

    // 맡고 있는 동안에도 자리가 바뀌므로 이따금 다시 찾는다
    if (time > (this.nextSniff ?? 0)) {
      this.nextSniff = time + 1600;
      this.scentTrail.showRoute(this.scentRoute());
      this.audio.play('sfx_sniff', { volume: 0.4 });
      return;
    }
    if (!this.scentTrail.active) this.scentTrail.showRoute(this.scentRoute());
  }

  /**
   * 도착 지점 — 닿는 것만으로는 넘어가지 않는다.
   *
   * 지나가다 끝나 버리면 "도착했다"가 아니라 "끝났다"가 된다. 여기서 상호작용해야
   * 다음으로 넘어간다 (플레이 리뷰 15).
   */
  updateGoal() {
    if (!this.dog || this.cleared || this.dying) return;

    // 도착 구역에 몸이 걸치면 된다. 구역은 움직이지 않으므로 한 번만 재 둔다
    if (!this.goalBounds) {
      this.goalBounds = this.goal.getBounds();
      Phaser.Geom.Rectangle.Inflate(this.goalBounds, 70, 40);
    }
    const near = Phaser.Geom.Rectangle.Overlaps(this.goalBounds, this.dog.getBounds());

    this.atGoal = near && this.dog.isControllable;
    this.goalMarker?.showPrompt(this.atGoal);

    if (this.atGoal && this.input_.interactPressed) this.onClear();
  }

  /**
   * 떨어져서 죽는 두 가지.
   *
   *   낙사선 아래로 나갔다        — 지도 밖으로 떨어진 것
   *   너무 높은 데서 떨어져 닿았다 — 착지하는 순간 판정한다 (플레이 리뷰 17)
   */
  checkFall() {
    if (!this.dog || this.dying || this.cleared) return;

    if (this.dog.y > this.def.killY) {
      this.killDog();
      return;
    }

    if (this.dog.justLanded && this.dog.landFallHeight > DOG.killFallHeight) this.killDog();
  }
}
