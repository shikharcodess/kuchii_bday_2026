/**
 * MessagePanel & Surprise Modal UI
 */
export class MessagePanel {
  constructor() {
    this.element = document.getElementById('message-panel');
    this.textElement = this.element.querySelector('.message-text');

    // Click anywhere on panel backdrop or close button to dismiss
    this.element.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close-btn') || e.target === this.element) {
        this.hide();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  show(text) {
    this.element.innerHTML = `
      <div class="message-card">
        <p class="message-text">${text}</p>
        <button class="modal-close-btn" aria-label="Close">Continue &times;</button>
      </div>
    `;
    this.element.classList.remove('hidden');
  }

  showSurprise(item, count, total) {
    this.element.innerHTML = `
      <div class="message-card surprise-modal">
        <div class="surprise-badge">
          <span class="surprise-icon">${item.icon || '✨'}</span>
          <span class="surprise-tag">${item.category || 'Special Memory'}</span>
          <span class="surprise-counter">Surprise ${count} of ${total}</span>
        </div>
        <h3 class="surprise-title">${item.title}</h3>
        <p class="surprise-text">${item.text}</p>
        <div class="modal-footer">
          <button class="modal-close-btn primary-btn">Keep Exploring &hearts;</button>
        </div>
      </div>
    `;
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
