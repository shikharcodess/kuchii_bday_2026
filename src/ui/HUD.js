/**
 * The on-screen prompt.
 *
 * One card, bottom centre: it names what she can do here and doubles as a
 * button, so the same moment works with a keypress or a click.
 */
export class HUD {
  constructor(input) {
    this.input = input;
    this.element = document.getElementById('interaction-prompt');
    this.keyElement = this.element.querySelector('.key-icon');
    this.textElement = this.element.querySelector('.prompt-text');
    this.visible = false;

    // Clicking the card is the same as pressing the key it shows
    this.element.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.visible) this.input.queueInteract();
    });

    this.counterText = document.getElementById('surprise-counter-text');
  }

  updateCounter(found, total) {
    if (this.counterText) {
      this.counterText.textContent = `Surprises: ${found} / ${total} ✨`;
    }
  }

  show(label, key = 'E') {
    if (this.visible && this.textElement.textContent === label) return;

    this.keyElement.textContent = key;
    this.textElement.textContent = label;
    this.element.classList.remove('hidden');
    this.visible = true;
  }

  hide() {
    if (!this.visible) return;
    this.element.classList.add('hidden');
    this.visible = false;
  }
}
