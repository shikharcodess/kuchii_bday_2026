/**
 * Keyboard + pointer input.
 *
 * WASD / arrow keys drive movement, dragging with the mouse orbits the
 * chase camera, and `E` is reserved for the Phase 3 discovery prompt.
 */
export class InputManager {
  constructor(domElement) {
    this.domElement = domElement || window;
    this.keys = new Set();
    this.move = { x: 0, z: 0 };

    // Camera drag state
    this.dragging = false;
    this.dragDeltaX = 0;
    this.lastPointerX = 0;
    this.pointerDownPos = { x: 0, y: 0 };
    this.timeSinceDrag = Infinity;

    // Latched presses & clicks
    this.interactQueued = false;
    this.jumpQueued = false;
    this.escapeQueued = false;
    this.clickQueued = null; // { x, y } in client pixels

    this._bind();
  }

  _bind() {
    this._onKeyDown = (event) => {
      const code = event.code;
      if (MOVE_CODES.has(code)) event.preventDefault();
      const isRepeat = event.repeat || this.keys.has(code);
      this.keys.add(code);
      if (isRepeat) return;

      if (code === 'KeyE' || code === 'Enter') this.interactQueued = true;
      if (code === 'Space') this.jumpQueued = true;
      if (code === 'Escape') this.escapeQueued = true;
    };

    this._onKeyUp = (event) => this.keys.delete(event.code);

    this._onBlur = () => {
      this.keys.clear();
      this.dragging = false;
      this.jumpQueued = false;
    };

    this._onPointerDown = (event) => {
      this.dragging = true;
      this.lastPointerX = event.clientX;
      this.pointerDownPos.x = event.clientX;
      this.pointerDownPos.y = event.clientY;
    };

    this._onPointerMove = (event) => {
      if (!this.dragging) return;
      this.dragDeltaX += event.clientX - this.lastPointerX;
      this.lastPointerX = event.clientX;
      this.timeSinceDrag = 0;
    };

    this._onPointerUp = (event) => {
      this.dragging = false;
      // Check if it was a quick click rather than a camera drag
      const dist = Math.hypot(event.clientX - this.pointerDownPos.x, event.clientY - this.pointerDownPos.y);
      if (dist < 8) {
        this.clickQueued = { x: event.clientX, y: event.clientY };
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  update(dt) {
    let x = 0;
    let z = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    const length = Math.hypot(x, z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    this.move.x = x;
    this.move.z = z;
    this.timeSinceDrag += dt;
  }

  consumeDragDelta() {
    const delta = this.dragDeltaX;
    this.dragDeltaX = 0;
    return delta;
  }

  consumeInteract() {
    const queued = this.interactQueued;
    this.interactQueued = false;
    return queued;
  }

  consumeJump() {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  consumeClick() {
    const click = this.clickQueued;
    this.clickQueued = null;
    return click;
  }

  consumeEscape() {
    const queued = this.escapeQueued;
    this.escapeQueued = false;
    return queued;
  }

  queueEscape() {
    this.escapeQueued = true;
  }

  queueInteract() {
    this.interactQueued = true;
  }

  get isMoving() {
    return this.move.x !== 0 || this.move.z !== 0;
  }

  get isSprinting() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
}

const MOVE_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'ShiftLeft',
  'ShiftRight'
]);
