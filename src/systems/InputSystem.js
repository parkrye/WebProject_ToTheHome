/**
 * 키보드와 터치를 하나의 상태로 합치는 입력 시스템.
 *
 * 게임 전체에서 하나만 존재하며 game.registry 에 'input' 으로 등록된다.
 * 터치 버튼(HudScene)은 setTouch() 로 상태만 넘긴다.
 */

export class InputSystem {
  constructor() {
    this.touch = { left: false, right: false, down: false, jump: false, interact: false };
    this.keys = null;
    this.enabled = true;

    this._prevJump = false;
    this._prevInteract = false;
    this._prevAny = false;

    this.jumpPressed = false;
    this.jumpReleased = false;
    this.interactPressed = false;
    this.anyPressed = false;
  }

  /** 씬이 바뀔 때마다 그 씬의 키보드 플러그인에 다시 붙인다 */
  attach(scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    this.keys = kb.addKeys(
      {
        left: 'LEFT',
        right: 'RIGHT',
        up: 'UP',
        down: 'DOWN',
        a: 'A',
        d: 'D',
        w: 'W',
        s: 'S',
        space: 'SPACE',
        shift: 'SHIFT',
        enter: 'ENTER',
        e: 'E',
        esc: 'ESC',
      },
      false
    );
  }

  setTouch(name, value) {
    if (name in this.touch) this.touch[name] = value;
  }

  clearTouch() {
    Object.keys(this.touch).forEach((k) => (this.touch[k] = false));
  }

  get left() {
    if (!this.enabled) return false;
    const k = this.keys;
    return this.touch.left || !!(k && (k.left.isDown || k.a.isDown));
  }

  get right() {
    if (!this.enabled) return false;
    const k = this.keys;
    return this.touch.right || !!(k && (k.right.isDown || k.d.isDown));
  }

  get down() {
    if (!this.enabled) return false;
    const k = this.keys;
    return this.touch.down || !!(k && (k.down.isDown || k.s.isDown));
  }

  get jumpHeld() {
    if (!this.enabled) return false;
    const k = this.keys;
    return this.touch.jump || !!(k && (k.space.isDown || k.up.isDown || k.w.isDown));
  }

  /** Shift 는 도움닫기 즉시 진입. 터치에서는 방향 홀드로 자동 진입한다 */
  get runModifier() {
    if (!this.enabled) return false;
    const k = this.keys;
    return !!(k && k.shift.isDown);
  }

  get interactHeld() {
    if (!this.enabled) return false;
    const k = this.keys;
    return this.touch.interact || !!(k && (k.e.isDown || k.enter.isDown));
  }

  get pauseHeld() {
    const k = this.keys;
    return !!(k && k.esc.isDown);
  }

  /** 매 프레임 씬의 update() 앞부분에서 호출 */
  update() {
    const jump = this.jumpHeld;
    this.jumpPressed = jump && !this._prevJump;
    this.jumpReleased = !jump && this._prevJump;
    this._prevJump = jump;

    const interact = this.interactHeld;
    this.interactPressed = interact && !this._prevInteract;
    this._prevInteract = interact;

    const any = jump || interact || this.left || this.right || this.down;
    this.anyPressed = any && !this._prevAny;
    this._prevAny = any;
  }
}
