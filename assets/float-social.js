/* -------------------------------------------------------------------------- */
/*                           FLOAT SOCIAL BUTTON                              */
/* -------------------------------------------------------------------------- */

customElements.define('float-social', class extends HTMLElement {
  connectedCallback() {
    this.toggle = this.querySelector('.float-social__toggle');
    this.panel = this.querySelector('.float-social__panel');
    this.isOpen = false;
    if (!this.toggle || !this.panel) return;
    this.toggle.addEventListener('click', () => this.handleToggle());
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.contains(e.target)) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }
  handleToggle() {
    this.isOpen ? this.close() : this.open();
  }
  open() {
    this.isOpen = true;
    this.classList.add('is-open');
    this.toggle.setAttribute('aria-expanded', 'true');
    this.panel.setAttribute('aria-hidden', 'false');
  }
  close() {
    this.isOpen = false;
    this.classList.remove('is-open');
    this.toggle.setAttribute('aria-expanded', 'false');
    this.panel.setAttribute('aria-hidden', 'true');
  }
});
