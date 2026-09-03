/**
 * 플레이어 — 강아지.
 *
 * 코요테 타임 / 점프 버퍼 / 가변 점프 높이 / 홀드 도움닫기를 갖춘 플랫포머 컨트롤러.
 * 수치는 config.js 의 DOG 에서 온다.
 */

import Phaser from 'phaser';
import { DOG } from '../config.js';

export const DogState = {
  NORMAL: 'normal',
  MOTION: 'motion', // 세이브 모션 등 조작 잠금
  DEAD: 'dead',
  CUTSCENE: 'cutscene',
};

export class Dog extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dog_idle', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 충돌 박스는 "화면에서 몇 px 인지"로 정한다.
    // 스프라이트 프레임 크기는 에셋마다 다를 수 있으므로 실제 프레임에서 역산한다.
    this.setDisplaySize(DOG.displaySize, DOG.displaySize);
    const frameSize = this.frame.realWidth || this.frame.width || DOG.displaySize;
    const toFrame = frameSize / DOG.displaySize; // 화면 px → 프레임 px
    const bw = DOG.bodyWidth * toFrame;
    const bh = DOG.bodyHeight * toFrame;
    this.body.setSize(bw, bh);
    this.body.setOffset((frameSize - bw) / 2, frameSize - bh - DOG.footPadding * toFrame);
    this.body.setMaxVelocity(DOG.runSpeed * 1.6, 1200);
    // 중력은 월드(main.js 의 arcade.gravity)에서만 받는다.
    // 여기서 setGravityY 를 또 걸면 두 배가 되어 점프 높이가 절반으로 줄어든다.
    this.setDepth(20);

    this.state_ = DogState.NORMAL;
    this.facing = 1;
    this.lastGroundedAt = 0;
    this.jumpBufferedAt = -9999;
    this.holdDirTime = 0;
    this.holdDir = 0;
    this.running = false;
    this.wasOnGround = false;
    this.stepTimer = 0;
    this.surface = 'soft'; // soft | hard | water — 발소리 결정
    this.motionResolve = null;
  }

  get isControllable() {
    return this.state_ === DogState.NORMAL;
  }

  setSurface(kind) {
    this.surface = kind;
  }

  /* ------------------------------------------------------------- */

  update(time, delta, input) {
    const body = this.body;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) this.lastGroundedAt = time;

    if (this.state_ === DogState.NORMAL) {
      this.handleMove(time, delta, input, onGround);
      this.handleJump(time, input, onGround);
    } else if (this.state_ !== DogState.CUTSCENE) {
      body.setVelocityX(0);
    }

    this.updateAnimation(onGround);
    this.updateFootsteps(delta, onGround);
    this.wasOnGround = onGround;
  }

  handleMove(time, delta, input, onGround) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const body = this.body;

    // 같은 방향을 계속 누르면 도움닫기로 넘어간다
    if (dir !== 0 && dir === this.holdDir) {
      this.holdDirTime += delta;
    } else {
      this.holdDir = dir;
      this.holdDirTime = 0;
    }
    this.running = dir !== 0 && (input.runModifier || this.holdDirTime >= DOG.runHoldTime);

    const targetSpeed = this.running ? DOG.runSpeed : DOG.walkSpeed;

    if (dir !== 0) {
      this.facing = dir;
      this.setFlipX(dir < 0);
      const accel = DOG.accel * (onGround ? 1 : 0.7);
      body.setAccelerationX(accel * dir);
      // 목표 속도를 넘어가면 즉시 잘라준다 (감속감이 더 명확해진다)
      if (Math.abs(body.velocity.x) > targetSpeed) {
        body.setVelocityX(targetSpeed * Math.sign(body.velocity.x));
      }
    } else {
      body.setAccelerationX(0);
      body.setDragX(onGround ? DOG.drag : DOG.drag * DOG.airDragScale);
    }
  }

  handleJump(time, input, onGround) {
    const body = this.body;
    if (input.jumpPressed) this.jumpBufferedAt = time;

    const coyoteOk = time - this.lastGroundedAt <= DOG.coyoteTime;
    const bufferOk = time - this.jumpBufferedAt <= DOG.jumpBuffer;

    if (bufferOk && coyoteOk && body.velocity.y >= -50) {
      const fast = Math.abs(body.velocity.x) >= DOG.runJumpThreshold;
      body.setVelocityY(fast ? DOG.runJumpVelocity : DOG.jumpVelocity);
      this.jumpBufferedAt = -9999;
      this.lastGroundedAt = -9999;
      this.anims.play('dog_jump', true);
      this.scene.audio?.play('sfx_jump');
    }

    // 버튼을 떼면 상승을 잘라 점프 높이를 조절한다
    if (input.jumpReleased && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * DOG.jumpCutScale);
    }
  }

  updateAnimation(onGround) {
    if (this.state_ !== DogState.NORMAL) return;

    const body = this.body;
    const speed = Math.abs(body.velocity.x);

    if (!onGround) {
      const frame = body.velocity.y < -40 ? 2 : body.velocity.y > 120 ? 5 : 3;
      if (this.anims.currentAnim?.key !== 'dog_jump') this.anims.play('dog_jump', true);
      this.anims.pause(this.anims.currentAnim.frames[frame]);
      return;
    }

    if (this.anims.isPaused) this.anims.resume();

    if (this.sniffing) {
      this.anims.play('dog_sniff', true);
      return;
    }
    if (speed > DOG.walkSpeed + 30) {
      this.anims.play('dog_run', true);
      return;
    }
    if (speed > 12) {
      this.anims.play('dog_walk', true);
      return;
    }
    this.anims.play('dog_idle', true);
  }

  updateFootsteps(delta, onGround) {
    if (!onGround || this.state_ !== DogState.NORMAL) return;
    const speed = Math.abs(this.body.velocity.x);
    if (speed < 20) return;

    this.stepTimer -= delta * (speed / DOG.walkSpeed);
    if (this.stepTimer > 0) return;
    this.stepTimer = 260;

    const key = this.surface === 'hard' ? 'sfx_step_hard' : this.surface === 'water' ? 'sfx_step_water' : 'sfx_step_soft';
    this.scene.audio?.play(key, { volume: 0.35, rate: 0.9 + Math.random() * 0.2 });
  }

  /* ------------------------------------------------------------- */

  setSniffing(on) {
    this.sniffing = on;
  }

  /** 세이브 모션 등 — 재생이 끝나면 resolve 되는 프라미스 */
  /**
   * 세이브 포인트에서 노는 모션.
   *
   * 시트에 따라 **들어가는 동작 → 고리 → 마무리 동작** 으로 나뉘어 있다.
   * 예를 들어 땅파기는 1칸이 서 있는 자세, 2~3칸이 파는 고리, 4~8칸이 털고 일어서는
   * 마무리다. 고리만 돌리면 파다 말고 끝나고, 전체를 돌리면 한 바퀴마다 일어선다.
   *
   * 마무리는 **끝나기 전에 미리 시작해야** 주어진 시간 안에 맞아떨어진다.
   */
  playMotion(animKey, durationMs) {
    if (this.state_ === DogState.DEAD) return Promise.resolve();
    this.state_ = DogState.MOTION;
    this.body.setVelocity(0, this.body.velocity.y);
    this.body.setAccelerationX(0);

    const bank = this.scene.anims;
    const inKey = `${animKey}_in`;
    const outKey = `${animKey}_out`;
    const outMs = bank.exists(outKey) ? bank.get(outKey).duration : 0;

    if (bank.exists(inKey)) {
      this.anims.play(inKey, true);
      this.anims.chain(animKey);
    } else {
      this.anims.play(animKey, true);
    }

    if (outMs) {
      this.scene.time.delayedCall(Math.max(0, durationMs - outMs), () => {
        if (this.state_ === DogState.MOTION) this.anims.play(outKey, true);
      });
    }

    return new Promise((resolve) => {
      this.scene.time.delayedCall(durationMs, () => {
        if (this.state_ === DogState.MOTION) this.state_ = DogState.NORMAL;
        resolve();
      });
    });
  }

  /** 빛으로 흩어졌다가 체크포인트에서 다시 모인다 */
  die() {
    if (this.state_ === DogState.DEAD) return Promise.resolve();
    this.state_ = DogState.DEAD;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.setEnable(false);
    this.anims.play('dog_dispel', true);
    this.scene.audio?.play('sfx_dispel');

    return new Promise((resolve) => {
      this.scene.time.delayedCall(800, resolve);
    });
  }

  respawnAt(x, y) {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setEnable(true);
    this.body.setAllowGravity(true);
    this.setAlpha(1);
    this.anims.play('dog_respawn', true);
    this.scene.audio?.play('sfx_respawn');

    return new Promise((resolve) => {
      this.scene.time.delayedCall(700, () => {
        this.state_ = DogState.NORMAL;
        this.holdDirTime = 0;
        resolve();
      });
    });
  }

  setCutscene(on) {
    this.state_ = on ? DogState.CUTSCENE : DogState.NORMAL;
  }
}
