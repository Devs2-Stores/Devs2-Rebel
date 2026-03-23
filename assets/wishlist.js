class WishlistManager extends HTMLElement {
	constructor() {
		super();
		this.storageKey = 'devs2_wishlist';
	}

	connectedCallback() {
		this.migrateOldFormat();
		this.initEventListeners();
		this.updateAllWishlistStates();
		this.updateWishlistCount();
	}

	initEventListeners() {
		document.addEventListener('click', (e) => {
			const btn = e.target.closest('[data-action="add-wishlist"]');
			if (!btn) return;
			e.preventDefault();
			const productId = btn.dataset.productId;
			const productHandle = btn.dataset.productHandle || '';
			if (!productId) return;
			this.toggleWishlist(productId, productHandle, btn);
		});
	}

	/**
	 * Migrate old format (array of ids) to new format (array of {id, handle})
	 */
	migrateOldFormat() {
		try {
			var raw = localStorage.getItem(this.storageKey);
			if (!raw) return;
			var data = JSON.parse(raw);
			if (!Array.isArray(data) || data.length === 0) return;
			// If first item is a string/number (old format), migrate
			if (typeof data[0] === 'string' || typeof data[0] === 'number') {
				var migrated = data.map(function(id) {
					return { id: String(id), handle: '' };
				});
				this.saveWishlist(migrated);
			}
		} catch (e) {
			// ignore
		}
	}

	getWishlist() {
		try {
			return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
		} catch {
			return [];
		}
	}

	saveWishlist(items) {
		localStorage.setItem(this.storageKey, JSON.stringify(items));
	}

	isInWishlist(productId) {
		return this.getWishlist().some(function(item) {
			if (typeof item === 'string') return item === String(productId);
			return item.id === String(productId);
		});
	}

	getProductIds() {
		return this.getWishlist().map(function(item) {
			if (typeof item === 'string') return item;
			return item.id;
		});
	}

	getProductHandles() {
		return this.getWishlist()
			.filter(function(item) { return item.handle; })
			.map(function(item) { return item.handle; });
	}

	addToWishlist(productId, handle) {
		var wishlist = this.getWishlist();
		var exists = wishlist.some(function(item) {
			var itemId = typeof item === 'string' ? item : item.id;
			return itemId === String(productId);
		});
		if (!exists) {
			wishlist.push({ id: String(productId), handle: handle || '' });
			this.saveWishlist(wishlist);
			return true;
		}
		return false;
	}

	removeFromWishlist(productId) {
		var wishlist = this.getWishlist();
		var newList = wishlist.filter(function(item) {
			var itemId = typeof item === 'string' ? item : item.id;
			return itemId !== String(productId);
		});
		if (newList.length !== wishlist.length) {
			this.saveWishlist(newList);
			return true;
		}
		return false;
	}

	toggleWishlist(productId, handle, btn) {
		const isInWishlist = this.isInWishlist(productId);
		if (isInWishlist) {
			this.removeFromWishlist(productId);
			this.showToast((themeConfig.strings.wishlist || {}).removed || 'Removed from wishlist');
		} else {
			this.addToWishlist(productId, handle);
			this.showToast((themeConfig.strings.wishlist || {}).added || 'Added to wishlist');
		}
		this.updateButtonState(btn, !isInWishlist);
		this.updateWishlistCount();
		this.dispatchWishlistChangeEvent(productId);
	}

	updateButtonState(btn, isActive) {
		const iconUse = btn.querySelector('use');
		if (isActive) {
			btn.classList.add('active');
			btn.setAttribute('title', (themeConfig.strings.wishlist || {}).remove || 'Remove from wishlist');
			btn.setAttribute('aria-label', (themeConfig.strings.wishlist || {}).remove || 'Remove from wishlist');
			if (iconUse) {
				iconUse.setAttribute('href', '#icon-heart-filled');
				iconUse.setAttribute('xlink:href', '#icon-heart-filled');
			}
		} else {
			btn.classList.remove('active');
			btn.setAttribute('title', (themeConfig.strings.wishlist || {}).add || 'Add to wishlist');
			btn.setAttribute('aria-label', (themeConfig.strings.wishlist || {}).add || 'Add to wishlist');
			if (iconUse) {
				iconUse.setAttribute('href', '#icon-heart');
				iconUse.setAttribute('xlink:href', '#icon-heart');
			}
		}
	}

	updateAllWishlistStates() {
		var self = this;
		document.querySelectorAll('[data-action="add-wishlist"]').forEach(btn => {
			const productId = btn.dataset.productId;
			if (productId && self.isInWishlist(productId)) {
				self.updateButtonState(btn, true);
			}
		});
	}

	updateWishlistCount() {
		const count = this.getWishlist().length;
		const badges = document.querySelectorAll('.wishlist-count');
		badges.forEach(badge => {
			badge.textContent = count;
			badge.style.display = count > 0 ? '' : 'none';
		});
		const icons = document.querySelectorAll('.wishlist-icon-wrapper');
		icons.forEach(icon => {
			if (count === 0) {
				icon.classList.add('empty');
			} else {
				icon.classList.remove('empty');
			}
		});
	}

	showToast(message) {
		if (typeof window.showToast === 'function') {
			window.showToast(message, 'success');
			return;
		}
		const toast = document.createElement('div');
		toast.className = 'toast-wrapper';
		const toastInner = document.createElement('div');
		toastInner.className = 'toast toast-success';
		const toastMsg = document.createElement('div');
		toastMsg.className = 'toast-message';
		toastMsg.textContent = message;
		toastInner.appendChild(toastMsg);
		toast.appendChild(toastInner);
		const container = document.querySelector('.toast-container') || this.createToastContainer();
		container.appendChild(toast);
		setTimeout(() => toast.classList.add('toast-show'), 10);
		setTimeout(() => {
			toast.classList.remove('toast-show');
			toast.classList.add('toast-hide');
			setTimeout(() => toast.remove(), 300);
		}, 3000);
	}

	createToastContainer() {
		const container = document.createElement('div');
		container.className = 'toast-container';
		document.body.appendChild(container);
		return container;
	}

	dispatchWishlistChangeEvent(productId) {
		window.dispatchEvent(new CustomEvent('wishlist-changed', {
			detail: { 
				wishlist: this.getWishlist(),
				productId: productId
			}
		}));
	}
}

if (!customElements.get('wishlist-manager')) customElements.define('wishlist-manager', WishlistManager);