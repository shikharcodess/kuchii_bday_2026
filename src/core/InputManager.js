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
    this.timeSinceDrag = Infinity;

    // Latched presses, consumed once by whoever handles them
    this.interactQueued = false;
    this.jumpQueued = false;

    this._bind();
  }

  _bind() {
    this._onKeyDown = (event) => {
      const code = event.code;
      if (MOVE_CODES.has(code)) event.preventDefault();
      // Repeat events fire while a key is held; only the first press counts.
      const isRepeat = event.repeat || this.keys.has(code);
      this.keys.add(code);
      if (isRepeat) return;

      if (code === 'KeyE' || code === 'Enter') this.interactQueued = true;
      if (code === 'Space') this.jumpQueued = true;
    };

    this._onKeyUp = (event) => this.keys.delete(event.code);

    // If the tab loses focus mid-walk, drop every held key so she doesn't drift.
    this._onBlur = () => {
      this.keys.clear();
      this.dragging = false;
      this.jumpQueued = false;
    };

    this._onPointerDown = (event) => {
      this.dragging = true;
      this.lastPointerX = event.clientX;
    };

    this._onPointerMove = (event) => {
      if (!this.dragging) return;
      this.dragDeltaX += event.clientX - this.lastPointerX;
      this.lastPointerX = event.clientX;
      this.timeSinceDrag = 0;
    };

    this._onPointerUp = () => {
      this.dragging = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  /** Call once per frame, before reading `move`. */
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

  /** Pixels the pointer was dragged since the last read (and resets it). */
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

  /** Fired by UI buttons, so a click does the same thing as pressing E. */
  queueInteract() {
    this.interactQueued = true;
  }

  get isMoving() {
    return this.move.x !== 0 || this.move.z !== 0;
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
  'Space'
]);
