import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA, PARALLAX, MIX } from '../config.js';
import { getStage, LAST_STAGE } from '../data/stages.js';
import { Dog } from '../objects/Dog.js';
import { createGround, createLedge, MovingPlatform, CrumblePlatform } from '../objects/Platforms.js';
import { HAZARD_TYPES } from '../objects/Hazards.js';
import { SavePoint } from '../objects/SavePoint.js';
import { ScentTrail, SignBoard, placeProp, StageGoal } from '../objects/Decor.js';

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

    if (def.intro && this.textures.exists(def.intro.texture)) {
      this.playIntro(def.intro);
    } else {
      this.cameras.main.fadeIn(700, 0, 0, 0);
    }
  }

  /* --------------------------------------------------------------- */
  /* 구성                                                              */
  /* --------------------------------------------------------------- */

  buildBackground() {
    const { layers } = this.def;
    this.bgLayers = [];

    const add = (key, factor, depth) => {
      if (!key || !this.textures.exists(key)) return;
      const tile = this.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(depth);
      this.bgLayers.push({ tile, factor });
    };

    add(layers.sky, PARALLAX.sky, 0);
    add(layers.far, PARALLAX.far, 1);
    add(layers.mid, PARALLAX.mid, 2);
    add(layers.near, PARALLAX.near, 3);

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

    this.scentTrail = new ScentTrail(this, def.scent || []);

    if (def.savePoint) {
      this.savePoint = new SavePoint(this, def.savePoint);
      this.saved = this.save.data.checkpoint === def.savePoint.id;
    }

    this.goal = new StageGoal(this, def.goal);

    // 스테이지 4 의 회상 실루엣
    this.memories = (def.memories || []).map((m) => ({ ...m, fired: false }));
    this.events_ = (def.events || []).map((e) => ({ ...e, fired: false }));
  }

  buildPlayer() {
    const spawn = this.resolveSpawn();
    this.dog = new Dog(this, spawn.x, spawn.y);
    this.dog.setSurface(this.def.surface || 'soft');
  }

  resolveSpawn() {
    const def = this.def;
    if (this.fromCheckpoint && def.savePoint && this.save.data.checkpoint === def.savePoint.id) {
      return { x: def.savePoint.x, y: def.savePoint.y - 60 };
    }
    return def.start;
  }

  buildCollisions() {
    this.physics.add.collider(this.dog, this.groundGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
    });

    this.physics.add.collider(this.dog, this.movingGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
      // 발판을 따라 움직이도록 수평 이동분을 더해준다
      if (platform.body.velocity.x) dog.x += platform.body.velocity.x * (this.game.loop.delta / 1000);
    });

    this.physics.add.collider(this.dog, this.crumbleGroup, (dog, platform) => {
      if (platform.surface) dog.setSurface(platform.surface);
      if (dog.body.velocity.y >= 0) platform.trigger();
    });

    this.physics.add.overlap(this.dog, this.hazardGroup, (dog, hazard) => this.onHazard(hazard));
    this.physics.add.overlap(this.dog, this.staticHazardGroup, (dog, hazard) => this.onHazard(hazard));

    this.physics.add.overlap(this.dog, this.goal, () => this.onClear());
  }

  buildCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this.dog, true, CAMERA.lerp, CAMERA.lerp, 0, CAMERA.followOffsetY);
    cam.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
  }

  playIntro(intro) {
    const cover = this.add
      .image(0, 0, intro.texture)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(45);

    this.cameras.main.fadeIn(900, 0, 0, 0);
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
      if (hazard.blowing) this.dog.body.setVelocityY(hazard.liftPower);
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
    this.cameras.main.fadeOut(260, 0, 0, 0);
    await new Promise((resolve) => this.cameras.main.once('camerafadeoutcomplete', resolve));

    await this.dog.respawnAt(spawn.x, spawn.y);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.dying = false;
  }

  checkpointPosition() {
    const def = this.def;
    if (def.savePoint && this.save.data.checkpoint === def.savePoint.id) {
      return { x: def.savePoint.x, y: def.savePoint.y - 60 };
    }
    return { x: def.start.x, y: def.start.y };
  }

  async useSavePoint() {
    const point = this.savePoint;
    if (!point || point.busy || !this.dog.isControllable) return;
    point.busy = true;

    const isNew = this.save.saveCheckpoint(this.stageId, point.id);
    this.audio.duck(this, point.motionDuration + 400);
    if (this.def.savePoint.sfx) this.audio.play(this.def.savePoint.sfx, { volume: 0.5 });

    await this.dog.playMotion(point.motion, point.motionDuration);

    // 처음 저장할 때만 저장 이펙트가 난다. 재방문은 그냥 노는 것.
    if (isNew || !this.saved) {
      point.burst();
      this.audio.play('jingle_save', { volume: MIX.jingle });
      this.saved = true;
    }

    point.busy = false;
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

    this.cameras.main.fadeOut(1400, 0, 0, 0);
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

  /** 스테이지 2 — 주인의 차와 같은 색 차가 지나간다 */
  triggerEvent(event) {
    event.fired = true;
    if (event.type !== 'ownerCar') return;

    const car = this.add.image(event.carX, event.carY, 'prop_owner_car').setOrigin(0.5, 1).setDepth(19);
    this.audio.play('sfx_car_pass', { volume: 0.5 });

    this.dog.setCutscene(true);
    this.dog.body.setVelocityX(0);
    this.dog.anims.play('dog_idle', true);

    this.tweens.add({
      targets: car,
      x: event.carX - 2200,
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

    this.updateParallax();
    this.hazards.forEach((hazard) => hazard.tick(time, delta));
    this.updateSavePoint(time);
    this.updateSigns();
    this.updateZones();
    this.updateSniff(time);
    this.checkFall();
  }

  updateParallax() {
    const cam = this.cameras.main;
    this.bgLayers.forEach(({ tile, factor }) => {
      tile.tilePositionX = cam.scrollX * factor;
      tile.tilePositionY = cam.scrollY * factor * 0.5;
    });
  }

  updateSavePoint(time) {
    if (!this.savePoint || !this.dog) return;
    const near = Math.abs(this.dog.x - this.savePoint.x) < 110 && Math.abs(this.dog.y - this.savePoint.y) < 160;
    this.savePoint.showPrompt(near && this.dog.isControllable);

    if (near && this.input_.interactPressed) this.useSavePoint();
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

  updateSniff(time) {
    if (!this.dog || !this.dog.isControllable) return;
    const sniffing = this.input_.down && Math.abs(this.dog.body.velocity.x) < 30;
    this.dog.setSniffing(sniffing);

    if (sniffing && time > (this.nextSniff ?? 0)) {
      this.nextSniff = time + 3200;
      this.scentTrail.boost(time);
      this.audio.play('sfx_sniff', { volume: 0.4 });
    }
  }

  checkFall() {
    if (!this.dog || this.dying || this.cleared) return;
    if (this.dog.y > this.def.killY) this.killDog();
  }
}
