/**
 * 볼륨 조절 — **글자도 숫자도 쓰지 않는다.**
 *
 * 왼쪽이 낮고 오른쪽이 높은 계단 막대다. 소리가 커지는 모양 그대로라 무엇을 하는
 * 물건인지 설명이 필요 없고, 켜진 칸 수가 곧 지금 크기다. 전부 꺼지면 무음이다.
 *
 * 타이틀의 작은 아이콘과 일시정지 패널의 큰 조절기가 **같은 그림**이라, 아이콘을
 * 누르면 무엇이 나오는지 눌러 보기 전에 알 수 있다.
 */

import Phaser from 'phaser';
import { PALETTE } from '../config.js';

/** 칸 수. 너무 잘게 나누면 손끝으로 맞추기 어렵다 */
const STEPS = 10;

/** 막대 하나가 제 칸에서 차지하는 폭 */
const BAR_FILL = 0.62;

/** 가장 낮은 칸의 높이 비율 — 0 이면 첫 칸이 보이지 않는다 */
const MIN_BAR = 0.26;

/**
 * 계단 막대를 그린다. 켜진 칸까지 밝고 나머지는 흐리다.
 *
 * 꺼진 칸도 **같은 색으로 흐리게** 남긴다. 아예 안 보이게 지우면 오른쪽에 더 올릴
 * 자리가 있다는 것을 알 수 없어, 다 줄여 놓으면 되돌릴 곳이 사라진다.
 */
function drawBars(bars, level) {
  bars.forEach((bar, i) => {
    bar.setFillStyle(PALETTE.ui, i < level ? 0.95 : 0.28);
  });
}

/** 칸마다 하나씩, 오른쪽으로 갈수록 높아지는 막대를 만든다 */
function buildBars(scene, width, height) {
  const cell = width / STEPS;
  const bars = [];

  for (let i = 0; i < STEPS; i += 1) {
    const h = height * (MIN_BAR + (1 - MIN_BAR) * ((i + 1) / STEPS));
    const bar = scene.add
      .rectangle(-width / 2 + cell * (i + 0.5), height / 2 - h / 2, cell * BAR_FILL, h, PALETTE.ui, 0.28)
      .setOrigin(0.5);
    bars.push(bar);
  }
  return bars;
}

/**
 * 눌러서 · 끌어서 맞추는 볼륨 조절기.
 *
 * @param onChange 0~1 값을 돌려준다. 끄는 동안 계속 불린다
 */
export class VolumeSlider extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { width = 260, height = 46, value = 1, onChange } = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.trackWidth = width;
    this.onChange = onChange;
    this.bars = buildBars(scene, width, height);
    this.add(this.bars);

    // 막대 사이 틈에서도 받아야 하므로 판 하나를 통째로 덮는다.
    // 컨테이너 안에 들어갈 수 있으므로 화면 좌표가 아니라 **판 안의 좌표**로 잰다
    this.grip = 12;
    const pad = scene.add.rectangle(0, 0, width + this.grip * 2, height + 24, 0x000000, 0).setOrigin(0.5);
    pad.setInteractive({ useHandCursor: true });
    this.add(pad);

    pad.on('pointerdown', (pointer, localX) => {
      this.dragging = true;
      this.pick(localX);
    });
    pad.on('pointermove', (pointer, localX) => {
      if (this.dragging) this.pick(localX);
    });
    // 판 밖에서 손을 떼도 끌기가 끝나야 한다
    pad.on('pointerup', () => (this.dragging = false));
    pad.on('pointerout', () => (this.dragging = false));
    pad.on('pointerupoutside', () => (this.dragging = false));

    this.setValue(value);
  }

  /** 짚은 자리를 칸 수로 옮긴다. 왼쪽 끝보다 왼쪽이면 무음이다 */
  pick(localX) {
    const ratio = (localX - this.grip) / this.trackWidth;
    this.setValue(Phaser.Math.Clamp(Math.round(ratio * STEPS), 0, STEPS) / STEPS);
  }

  setValue(value) {
    const next = Phaser.Math.Clamp(value, 0, 1);
    const level = Math.round(next * STEPS);
    if (level === this.level) return;

    // 처음 세울 때는 지금 값을 그리기만 한다. 그때도 알리면 만들자마자 저장을 건드린다
    const started = this.level !== undefined;
    this.level = level;
    drawBars(this.bars, level);
    if (started) this.onChange?.(level / STEPS);
  }
}

/**
 * 조절기와 같은 그림의 작은 아이콘 — 누르면 조절기가 나온다.
 *
 * 켜진 칸을 따로 세지 않는다. 여기서 알려 줄 것은 "소리 크기"라는 뜻 하나뿐이다.
 */
export function volumeIcon(scene, x, y, size = 34) {
  const icon = scene.add.container(x, y);
  const bars = buildBars(scene, size, size * 0.72);
  drawBars(bars, STEPS);
  icon.add(bars);
  // 컨테이너는 크기를 알려 줘야 눌리는 자리가 생긴다
  icon.setSize(size + 16, size * 0.72 + 16);
  return icon;
}
