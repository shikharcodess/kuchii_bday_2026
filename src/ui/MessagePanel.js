/**
 * The written-content panel: a station's message, shown while an interaction
 * is active and dismissed when it ends.
 */
export class MessagePanel {
  constructor() {
    this.element = document.getElementById('message-panel');
    this.textElement = this.element.querySelector('.message-text');
  }

  show(text) {
    this.textElement.textContent = text;
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
