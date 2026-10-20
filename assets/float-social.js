/* -------------------------------------------------------------------------- */
/*                           FLOAT SOCIAL BUTTON                              */
/* -------------------------------------------------------------------------- */

if (!customElements.get('float-social')) customElements.define('float-social', class extends HTMLElement {
	connectedCallback() {
		this.toggle = this.querySelector('.float-social__toggle');
		this.panel = this.querySelector('.float-social__panel');
		this.isOpen = false;
		if (!this.toggle || !this.panel) return;
		this._onToggleClick = () => (this.isOpen ? this.close() : this.open());
		this._onDocClick = (e) => {
			if (this.isOpen && !this.contains(e.target)) this.close();
		};
		this._onDocKeydown = (e) => {
			if (e.key !== 'Escape' || !this.isOpen) return;
			const focusWasInside = this.contains(document.activeElement);
			this.close();
			if (focusWasInside) this.toggle.focus();
		};
		this.toggle.addEventListener('click', this._onToggleClick);
		document.addEventListener('click', this._onDocClick);
		document.addEventListener('keydown', this._onDocKeydown);
	}
	disconnectedCallback() {
		if (!this._onToggleClick) return;
		this.toggle.removeEventListener('click', this._onToggleClick);
		document.removeEventListener('click', this._onDocClick);
		document.removeEventListener('keydown', this._onDocKeydown);
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
