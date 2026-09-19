if (!customElements.get('pickup-availability')) {
	customElements.define(
		'pickup-availability',
		class PickupAvailability extends HTMLElement {
			constructor() {
				super();

				if (!this.hasAttribute('available')) return;

				this.errorHtml = this.querySelector('template').content.firstElementChild.cloneNode(true);
				this.onClickRefreshList = this.onClickRefreshList.bind(this);
				this.fetchAvailability(this.dataset.variantId);
			}

			fetchAvailability(variantId) {
				if (!variantId) return;

				var rootUrl = this.dataset.rootUrl || '/';
				if (!rootUrl.endsWith('/')) rootUrl = rootUrl + '/';
				var variantSectionUrl = rootUrl + 'variants/' + variantId + '/?section_id=pickup-availability';

				var self = this;
				fetch(variantSectionUrl)
					.then(function (response) { return response.text(); })
					.then(function (text) {
						var sectionInnerHTML = new DOMParser()
							.parseFromString(text, 'text/html')
							.querySelector('.shopify-section');
						self.renderPreview(sectionInnerHTML);
					})
					.catch(function () {
						var button = self.querySelector('button');
						if (button) button.removeEventListener('click', self.onClickRefreshList);
						self.renderError();
					});
			}

			onClickRefreshList() {
				this.fetchAvailability(this.dataset.variantId);
			}

			update(variant) {
				if (variant && variant.available) {
					this.dataset.variantId = variant.id;
					this.fetchAvailability(variant.id);
				} else {
					this.removeAttribute('available');
					this.innerHTML = '';
				}
			}

			renderError() {
				this.innerHTML = '';
				this.appendChild(this.errorHtml);
				this.querySelector('button').addEventListener('click', this.onClickRefreshList);
			}

			renderPreview(sectionInnerHTML) {
				var drawer = document.querySelector('pickup-availability-drawer');
				if (drawer) drawer.remove();
				if (!sectionInnerHTML || !sectionInnerHTML.querySelector('pickup-availability-preview')) {
					this.innerHTML = '';
					this.removeAttribute('available');
					return;
				}

				this.innerHTML = sectionInnerHTML.querySelector('pickup-availability-preview').outerHTML;
				this.setAttribute('available', '');

				var newDrawer = sectionInnerHTML.querySelector('pickup-availability-drawer');
				if (newDrawer) {
					document.body.appendChild(newDrawer);
					var colorClasses = (this.dataset.productPageColorScheme || '').split(' ');
					colorClasses.forEach(function (colorClass) {
						if (colorClass) newDrawer.classList.add(colorClass);
					});
				}

				var button = this.querySelector('button');
				if (button) {
					button.addEventListener('click', function (evt) {
						var activeDrawer = document.querySelector('pickup-availability-drawer');
						if (activeDrawer) activeDrawer.show(evt.target);
					});
				}
			}
		}
	);
}

if (!customElements.get('pickup-availability-drawer')) {
	customElements.define(
		'pickup-availability-drawer',
		class PickupAvailabilityDrawer extends HTMLElement {
			constructor() {
				super();
				this.onBodyClick = this.handleBodyClick.bind(this);
			}

			handleBodyClick(evt) {
				var target = evt.target;
				if (
					target != this &&
					!target.closest('pickup-availability-drawer') &&
					target.id != 'ShowPickupAvailabilityDrawer'
				) {
					this.hide();
				}
			}

			hide() {
				this.removeAttribute('open');
				document.body.removeEventListener('click', this.onBodyClick);
				if (window.ThemeUtils && ThemeUtils.unlockScroll) ThemeUtils.unlockScroll();
				if (window.ThemeUtils && ThemeUtils.releaseFocus) ThemeUtils.releaseFocus(this);
			}

			show(focusElement) {
				this.focusElement = focusElement;
				this.setAttribute('open', '');
				document.body.addEventListener('click', this.onBodyClick);
				if (window.ThemeUtils && ThemeUtils.lockScroll) ThemeUtils.lockScroll();
				if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this, focusElement);

				var self = this;
				var closeButton = this.querySelector('.pickup-availability-drawer-button');
				if (closeButton) {
					closeButton.addEventListener('click', function () {
						self.hide();
					});
				}

				this.addEventListener('keyup', function (event) {
					if (event.code && event.code.toUpperCase() === 'ESCAPE') self.hide();
				});
			}
		}
	);
}
