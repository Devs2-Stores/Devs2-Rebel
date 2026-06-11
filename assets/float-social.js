/* -------------------------------------------------------------------------- */
/*                           FLOAT SOCIAL BUTTON                              */
/* -------------------------------------------------------------------------- */

if (!customElements.get('float-social')) customElements.define('float-social', class extends HTMLElement {
  connectedCallback() {
    this.toggle = this.querySelector('.float-social__toggle');
    this.panel = this.querySelector('.float-social__panel');
    this.isOpen = false;
    if (!this.toggle || !this.panel) return;
    this.toggle.addEventListener('click', () => this.handleToggle());
    this._boundDocClick = (e) => {
      if (this.isOpen && !this.contains(e.target)) this.close();
    };
    this._boundDocEsc = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('click', this._boundDocClick);
    document.addEventListener('keydown', this._boundDocEsc);
  }
  disconnectedCallback() {
    if (this._boundDocClick) document.removeEventListener('click', this._boundDocClick);
    if (this._boundDocEsc) document.removeEventListener('keydown', this._boundDocEsc);
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
