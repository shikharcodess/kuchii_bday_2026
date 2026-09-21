/**
 * Proximity-based interactions.
 *
 * Anything in the world can register a zone: walk into it and the HUD offers
 * the action, press E (or click the prompt) to start it, press E again to end
 * it. This is the same mechanism the stations will use for their discovery
 * moments, so it lives in core rather than inside any one station.
 */
export class InteractionSystem {
  constructor(input, hud) {
    this.input = input;
    this.hud = hud;
    this.zones = [];
    this.active = null;
    this.nearby = null;
  }

  /**
   * @param {object} zone
   * @param {string} zone.id
   * @param {number} zone.x world position
   * @param {number} zone.z
   * @param {number} zone.radius how close she has to be
   * @param {string} zone.label prompt shown when in range
   * @param {string} [zone.activeLabel] prompt shown while the zone is active
   * @param {(character: Character) => void} zone.onEnter
   * @param {(character: Character) => void} [zone.onExit]
   */
  register(zone) {
    this.zones.push(zone);
    return zone;
  }

  update(character) {
    const pressed = this.input.consumeInteract();

    if (this.active) {
      if (!this.active.activeLabel) {
        this.hud.hide();
      } else {
        this.hud.show(this.active.activeLabel, 'E');
      }
      if (pressed) this._deactivate(character);
      return;
    }

    this.nearby = this._findNearest(character.position);

    if (!this.nearby) {
      this.hud.hide();
      return;
    }

    this.hud.show(this.nearby.label, 'E');
    if (pressed) this._activate(this.nearby, character);
  }

  _findNearest(position) {
    let best = null;
    let bestDistance = Infinity;

    for (const zone of this.zones) {
      const distance = Math.hypot(position.x - zone.x, position.z - zone.z);
      if (distance <= zone.radius && distance < bestDistance) {
        best = zone;
        bestDistance = distance;
      }
    }

    return best;
  }

  _activate(zone, character) {
    this.active = zone;
    zone.onEnter?.(character);
  }

  _deactivate(character) {
    const zone = this.active;
    this.active = null;
    zone.onExit?.(character);
    this.hud.hide();
  }
}
