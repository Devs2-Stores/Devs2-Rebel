(function() {
'use strict';

// ProductTemplate Component
class ProductTemplate extends HTMLElement {
	constructor() {
		super();
		this.currentVariant = null;
		this.mainSwiper = null;
	}

	connectedCallback() {
		this.cacheElements();
		this.bindEvents();
		this.initTabs();
		this.initCurrentVariant();
		this.initVariantFromURL();
		this.initMedia();
		this.initVideoSlides();
		this.initSellingPlans();
	}

	cacheElements() {
		this.imageEl = this.querySelector('[data-product-featured]');
		this.mediaSliderEl = this.querySelector('.product-template__media-slider');
		this.mediaThumbsEl = this.querySelector('.product-template__media-thumbs');
		this.skuEl = this.querySelector('[data-product-sku]');
		this.barcodeEl = this.querySelector('[data-product-barcode]');
		this.availableEl = this.querySelector('[data-product-available]');
		this.addButtons = this.querySelector('[data-product-add]');
		this.buyButtons = this.querySelector('[data-product-buy]');
		this.priceEl = this.querySelector('[data-product-price]');
		this.compareEl = this.querySelector('[data-product-compare]');
		this.saleEl = this.querySelector('[data-product-sale]');
		this.variantInputs = this.querySelectorAll('[data-product-variant-id]');
		this.sellingPlanInputs = this.querySelectorAll('[data-product-selling-plan]');
		this.form = this.querySelector('form[id^="product-form-"]');
		this.quantitySelector = this.querySelector('quantity-selector');
		this.quantityInput = this.quantitySelector ? this.quantitySelector.querySelector('input') : null;
	}

	bindEvents() {
		if (this.form) this.form.addEventListener('submit', (e) => this.handleAddToCart(e));
		if (this.addButtons) this.addButtons.addEventListener('click', (e) => this.handleAddToCart(e));
		if (this.buyButtons) this.buyButtons.addEventListener('click', (e) => this.handleBuyNow(e));

		if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
			this.addEventListener(themeConfig.product.events.variant_change, (e) => {
				// Ignore events from quickview
				if (e.target.closest('[data-quickview-product]') || e.target.closest('quickview-modal')) {
					return;
				}
				this.currentVariant = e.detail;
				this.refreshUI(e.detail);
				this.updateURLWithVariant(e.detail);
			});
		}
	}

	initCurrentVariant() {
		if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
			const product = themeConfig.product.data;
			if (product && product.variants && product.variants.length > 0) {
				this.currentVariant = product.variants.find(v => v.selected) || 
					product.variants.find(v => v.available) || 
					product.variants[0];

				// Update buttons on initial load
				if (this.currentVariant) {
					this.updatePurchaseButtons(this.currentVariant.available);
				}
			}
		}
	}

	/**
	 * Initialize variant from URL parameter
	 * Enables deep linking - users can share URLs with specific variant selected
	 */
	initVariantFromURL() {
		var self = this;
		var variantId = new URLSearchParams(window.location.search).get('variant');
		if (!variantId) return;

		var product = (typeof themeConfig !== 'undefined' && themeConfig.product) ? themeConfig.product.data : null;
		if (!product || !product.variants) return;

		var variant = product.variants.find(function(v) {
			return String(v.id) === String(variantId);
		});
		if (!variant) return;

		this.currentVariant = variant;
		// Wait for variant picker to be ready (custom elements may not be connected yet)
		setTimeout(function() {
			self.selectVariantOptions(variant);
			self.refreshUI(variant);
		}, 100);
	}

	/**
	 * Select variant options in the picker based on variant data
	 */
	selectVariantOptions(variant) {
		var picker = this.querySelector('product-variant-picker');
		if (!picker) return;

		var optionKeys = ['option1', 'option2', 'option3'];
		optionKeys.forEach(function(optionKey) {
			var value = variant[optionKey];
			if (!value) return;

			// Find and check the matching radio input
			var inputs = picker.querySelectorAll('input[type="radio"]');
			inputs.forEach(function(input) {
				if (input.value === value && !input.checked) {
					input.checked = true;
					// Dispatch change event to update UI
					input.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});
		});
	}

	/**
	 * Update URL with current variant ID
	 * Uses replaceState to avoid polluting browser history
	 */
	updateURLWithVariant(variant) {
		if (!variant || !variant.id) return;

		try {
			var url = new URL(window.location.href);
			url.searchParams.set('variant', variant.id);
			window.history.replaceState({}, '', url.toString());
		} catch (e) {
			// Silently fail for older browsers
		}
	}

	initTabs() {
		// Re-rendered tabs (theme editor) arrive with their nav buttons still in templates.
		this.querySelectorAll('template[data-tab-nav]').forEach(function(tpl) {
			var tabsRoot = tpl.closest('.product-template__tabs');
			var nav = tabsRoot ? tabsRoot.querySelector('[data-tabs-nav]') : null;
			if (nav) nav.appendChild(tpl.content.cloneNode(true));
			tpl.remove();
		});

		const tabButtons = this.querySelectorAll('.product-template__tab-btn');
		const tabPanels = this.querySelectorAll('.product-template__tab-panel');

		if (tabButtons.length === 0) return;

		// Activate the first tab when none is marked active.
		if (!this.querySelector('.product-template__tab-btn.active')) {
			tabButtons[0].classList.add('active');
			tabButtons[0].setAttribute('aria-selected', 'true');
			const firstPanel = this.querySelector('[data-panel="' + tabButtons[0].getAttribute('data-tab') + '"]');
			if (firstPanel) firstPanel.classList.add('active');
		}

		tabButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				const targetTab = btn.getAttribute('data-tab');

				tabButtons.forEach(b => {
					b.classList.remove('active');
					b.setAttribute('aria-selected', 'false');
				});
				tabPanels.forEach(p => p.classList.remove('active'));

				btn.classList.add('active');
				btn.setAttribute('aria-selected', 'true');
				const targetPanel = this.querySelector('[data-panel="' + targetTab + '"]');
				if (targetPanel) targetPanel.classList.add('active');
			});
		});
		if (window.ThemeUtils) ThemeUtils.bindTablistKeys(tabButtons);

		this.initDescriptionToggle();
	}

	initDescriptionToggle() {
		this.querySelectorAll('[data-description-wrapper]').forEach(function(wrapper) {
			var toggleBtn = wrapper.querySelector('[data-description-toggle]');
			var descContent = wrapper.querySelector('[data-description-content]');
			if (!toggleBtn || !descContent) return;

			var maxHeight = parseInt(toggleBtn.getAttribute('data-max-height'), 10) || 300;
			var moreText = toggleBtn.querySelector('[data-toggle-text-more]');
			var lessText = toggleBtn.querySelector('[data-toggle-text-less]');
			var expanded = false;
			var toggleFootprint = 0;

			var render = function() {
				if (!descContent.getClientRects().length) return;
				if (!toggleBtn.classList.contains('hidden')) {
					toggleFootprint = toggleBtn.offsetHeight + (parseFloat(getComputedStyle(toggleBtn).marginTop) || 0);
				}
				var overflows = descContent.scrollHeight > maxHeight + toggleFootprint;
				var collapsed = overflows && !expanded;
				descContent.classList.toggle('is-collapsed', collapsed);
				wrapper.classList.toggle('is-collapsed', collapsed);
				toggleBtn.classList.toggle('hidden', !overflows);
				toggleBtn.classList.toggle('is-expanded', expanded);
				toggleBtn.setAttribute('aria-expanded', String(expanded));
				if (moreText) moreText.classList.toggle('hidden', expanded);
				if (lessText) lessText.classList.toggle('hidden', !expanded);
			};

			toggleBtn.addEventListener('click', function() {
				expanded = !expanded;
				render();
			});

			if ('ResizeObserver' in window) new ResizeObserver(render).observe(descContent);
			else render();
		});
	}

	initMedia() {
		if (!this.mediaSliderEl) return;

		var self = this;
		var initSwiper = function() {
			var thumbsSwiper = null;
			if (self.mediaThumbsEl) {
				thumbsSwiper = new Swiper(self.mediaThumbsEl, {
					spaceBetween: 8,
					slidesPerView: 4.5,
					freeMode: true,
					watchSlidesProgress: true,
					slideToClickedSlide: true,
					direction: 'horizontal',
					breakpoints: {
						768: { slidesPerView: 4.5, spaceBetween: 15 },
						1024: { slidesPerView: 4.5, spaceBetween: 15 }
					}
				});
			}

			self.mainSwiper = new Swiper(self.mediaSliderEl, {
				initialSlide: self._pendingSlide || 0,
				spaceBetween: 10,
				speed: 300,
				loop: false,
        autoHeight: true,
				navigation: {
					nextEl: self.mediaSliderEl.querySelector('.swiper-button-next'),
					prevEl: self.mediaSliderEl.querySelector('.swiper-button-prev')
				},
				thumbs: {
					swiper: thumbsSwiper
				}
			});
		};

		if (self.mediaThumbsEl) {
			self.mediaThumbsEl.addEventListener('click', function(e) {
				if (self.mainSwiper) return;
				var slide = e.target.closest('.swiper-slide');
				if (!slide) return;
				self._pendingSlide = Array.prototype.indexOf.call(slide.parentElement.children, slide);
			});
		}

		(window.swiperReady || function(cb){ cb(); })(initSwiper, self.mediaSliderEl);
	}

	refreshUI(variant) {
		this.updateVariantInputs(variant);
		if (variant) {
			this.updateFeaturedImage(variant.featured_media || variant.featured_image);
			this.updateSku(variant.sku);
			this.updateBarcode(variant.barcode);
			this.updateAvailable(variant.available);
			this.updatePrice(variant.price, variant.compare_at_price);
			this.updatePurchaseButtons(variant.available);
			this.updateStockCounter(variant);
			this.updatePickupAvailability(variant);
			this.updateQuantityRules(variant);
		} else {
			this.updateFeaturedImage(null);
			this.updateSku(null);
			this.updateBarcode(null);
			this.updateAvailable(null);
			this.updatePrice(null);
			this.updatePurchaseButtons(null);
			this.updatePickupAvailability(null);
			this.updateQuantityRules(null);
		}
	}

	updateVariantInputs(variant) {
		this.variantInputs.forEach(function(input) {
			input.value = variant && variant.id ? variant.id : '';
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
		this.sellingPlanInputs.forEach(function(input) {
			var form = input.closest('form');
			var subRadio = form ? form.querySelector('[data-purchase-option-toggle="subscription"]') : null;
			var isSub = subRadio && subRadio.checked;
			var allocations = variant && variant.selling_plan_allocations ? variant.selling_plan_allocations : [];
			var allocatedIds = allocations.map(function(allocation) {
				return String(allocation.selling_plan ? allocation.selling_plan.id : allocation.selling_plan_id);
			});
			if (input.options) {
				Array.prototype.forEach.call(input.options, function(option) {
					var allocated = allocatedIds.indexOf(option.value) !== -1;
					option.disabled = !allocated;
					option.hidden = !allocated;
				});
			}
			var planId = allocatedIds.indexOf(String(input.value)) !== -1 ? String(input.value) : (allocatedIds[0] || '');
			input.value = planId;
			input.disabled = !isSub || !planId;
		});
	}

	updatePickupAvailability(variant) {
		var pickupAvailability = this.querySelector('pickup-availability');
		if (pickupAvailability && typeof pickupAvailability.update === 'function') {
			pickupAvailability.update(variant);
		}
	}

	updateFeaturedImage(image) {
		if (!image) return;

		const mediaId = image.id ? String(image.id) : null;
		const imageSrc = typeof image === 'string' ? image : (image.src || image.url || (image.preview_image && image.preview_image.src));
		if (!imageSrc && !mediaId) return;

		const slides = this.mediaSliderEl.querySelectorAll('.swiper-slide');
		const getFilename = (url) => (url || '').split('/').pop().split('?')[0].replace(/(_\d+x\d+)/, '');

		for (let i = 0; i < slides.length; i++) {
			if (mediaId && slides[i].dataset.mediaId === mediaId) {
				this._showSlide(i);
				break;
			}
			const slideImg = slides[i].querySelector('img');
			if (imageSrc && slideImg && getFilename(slideImg.src) === getFilename(imageSrc)) {
				this._showSlide(i);
				break;
			}
		}
	}

	_showSlide(index) {
		if (this.mainSwiper) this.mainSwiper.slideTo(index);
		else this._pendingSlide = index;
	}

	metaUnavailableText() {
		var strings = typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant;
		return strings && strings.metaUnavailable ? strings.metaUnavailable : '';
	}

	updateSku(sku) {
		if (!this.skuEl) return;
		this.skuEl.textContent = sku && sku.trim() ? sku.trim() : this.metaUnavailableText();
	}

	updateBarcode(barcode) {
		if (!this.barcodeEl) return;
		this.barcodeEl.textContent = barcode && barcode.trim() ? barcode.trim() : this.metaUnavailableText();
	}

	updateAvailable(available) {
		if (!this.availableEl) return;

		var strings = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant) ? themeConfig.strings.variant : {};
		const states = {
			null: { class: 'product-template__status--unavailable', text: strings.contact },
			true: { class: 'product-template__status--available', text: strings.inStock },
			false: { class: 'product-template__status--unavailable', text: strings.soldOut }
		};

		const state = states[available == null ? 'null' : available];
		this.availableEl.classList.remove('product-template__status--available', 'product-template__status--unavailable');
		this.availableEl.classList.add(state.class);
		this.availableEl.textContent = state.text;
	}

	updatePurchaseButtons(available) {
		var isAvailable = available === true;
		var strings = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant) ? themeConfig.strings.variant : {};

		if (this.addButtons) {
			var addBtnContent = this.addButtons.querySelector('.button-content span:last-child');
			if (isAvailable) {
				this.addButtons.disabled = false;
				this.addButtons.classList.remove('sold-out');
				if (addBtnContent) addBtnContent.textContent = strings.addToCart;
			} else if (available === false) {
				this.addButtons.disabled = true;
				this.addButtons.classList.add('sold-out');
				if (addBtnContent) addBtnContent.textContent = strings.soldOut;
			} else {
				this.addButtons.disabled = true;
				this.addButtons.classList.remove('sold-out');
				if (addBtnContent) addBtnContent.textContent = strings.unavailable;
			}
		}
		var dynamicCheckout = this.querySelector('[data-dynamic-checkout]');
		if (dynamicCheckout) {
			dynamicCheckout.hidden = !isAvailable;
		}

		if (this.buyButtons) {
			var buyBtnContent = this.buyButtons.querySelector('.button-content');
			if (isAvailable) {
				this.buyButtons.disabled = false;
				this.buyButtons.classList.remove('sold-out');
				this.buyButtons.classList.remove('contact-link');
				this.buyButtons.onclick = null;
				if (buyBtnContent) buyBtnContent.textContent = strings.buyNow;
			} else {
				this.buyButtons.disabled = false;
				this.buyButtons.classList.add('sold-out');
				this.buyButtons.classList.add('contact-link');
				if (buyBtnContent) buyBtnContent.textContent = strings.contact;

				// Get contact link from data attribute (set by Liquid)
				var storeRoot = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
				var contactLink = this.buyButtons.getAttribute('data-contact-link') || storeRoot + 'pages/contact';

				this.buyButtons.onclick = function() {
					window.location.href = contactLink;
				};
			}
		}
	}

	updatePrice(price, compare) {
		if (!this.priceEl) return;
		var strings = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant) ? themeConfig.strings.variant : {};

		if (price == 0 || price == null) {
			this.priceEl.textContent = strings.contact;
			this.priceEl.classList.remove('product-template__price-current--sale');
			if (this.compareEl) this.compareEl.hidden = true;
			if (this.saleEl) this.saleEl.hidden = true;
		} else {
			this.priceEl.textContent = ThemeUtils.formatMoney(price, themeConfig.priceFormat);

			if (compare && compare > price) {
				this.priceEl.classList.add('product-template__price-current--sale');
				if (this.compareEl) {
					this.compareEl.hidden = false;
					this.compareEl.textContent = ThemeUtils.formatMoney(compare);
				}
				if (this.saleEl) {
					const percent = Math.round(((compare - price) / compare) * 100);
					this.saleEl.textContent = '-' + percent + '%';
					this.saleEl.hidden = false;
				}
			} else {
				this.priceEl.classList.remove('product-template__price-current--sale');
				if (this.compareEl) this.compareEl.hidden = true;
				if (this.saleEl) this.saleEl.hidden = true;
			}
		}
	}

	async handleAddToCart(e) {
		e.preventDefault();

		var form = this.form || (this.addButtons && this.addButtons.form);
		if (!form) return;
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		if (!this.validateVariant()) return;

		this.setButtonLoading(this.addButtons, true);

		try {
			var formData = new FormData(form);
			formData.append('sections', 'main-cart-items,cart-modal');

			var data = await this.postCartAdd(formData);
			await ThemeUtils.updateCartData(data);
			document.dispatchEvent(new CustomEvent('cart:item_added', { detail: data }));
		} catch (error) {
			if (typeof showToast === 'function') showToast(error.message, 'error');
		} finally {
			this.setButtonLoading(this.addButtons, false);
		}
	}

	async handleBuyNow(e) {
		if (e) e.preventDefault();

		// If button is contact link, let onclick handler take over
		if (this.buyButtons && this.buyButtons.classList.contains('contact-link')) {
			return;
		}

		var form = this.form || (this.buyButtons && this.buyButtons.form);
		if (!form) return;
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		if (!this.validateVariant()) return;

		this.setButtonLoading(this.buyButtons, true);

		try {
			var formData = new FormData(form);

			var data = await this.postCartAdd(formData);
			await ThemeUtils.updateCartData(data);
			this.setButtonLoading(this.buyButtons, false);
			window.location.href = themeConfig.routes.checkout_url || '/checkout';
		} catch (error) {
			if (typeof showToast === 'function') showToast(error.message, 'error');
			this.setButtonLoading(this.buyButtons, false);
		}
	}

	async postCartAdd(formData) {
		var strings = themeConfig.strings.cart || {};
		var fallback = strings.itemError || strings.error;
		var response;
		var data = null;
		try {
			response = await fetch(themeConfig.routes.cart_add_url, {
				method: 'POST',
				headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
				body: formData
			});
			data = await response.json();
		} catch (requestError) {
			throw new Error(fallback);
		}
		if (!response.ok || !data) {
			throw new Error((data && typeof data.description === 'string' && data.description) || fallback);
		}
		return data;
	}

	validateVariant() {
		var strings = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant) ? themeConfig.strings.variant : {};
		if (!this.currentVariant) {
			if (typeof showToast === 'function') showToast(strings.unavailable, 'warning');
			return false;
		}
		if (!this.currentVariant.available) {
			if (typeof showToast === 'function') showToast(strings.soldOut, 'warning');
			return false;
		}
		return true;
	}

	setButtonLoading(button, isLoading) {
		if (!button) return;

		if (isLoading) {
			button.classList.add('loading');
			button.disabled = true;
		} else {
			button.classList.remove('loading');
			button.disabled = false;
		}
	}

	// ── Stock Counter ─────────────────────────────────────────────
	updateStockCounter(variant) {
		var counter = this.querySelector('[data-stock-counter]');
		if (!counter) return;

		if (!this._stockLevels) {
			var levelsEl = counter.querySelector('[data-stock-levels]');
			try {
				this._stockLevels = levelsEl ? JSON.parse(levelsEl.textContent) : {};
			} catch (e) {
				this._stockLevels = {};
			}
		}

		var qty = variant ? this._stockLevels[String(variant.id)] : null;
		var textEl = counter.querySelector('[data-stock-text]');
		if (!qty || !textEl || !textEl.getAttribute('data-template')) {
			counter.classList.remove('is-visible');
			return;
		}
		textEl.textContent = textEl.getAttribute('data-template').replace('[qty]', qty);
		counter.classList.add('is-visible');
	}
	updateQuantityRules(variant) {
		if (!this.quantityInput) return;
		var rule = variant && variant.quantity_rule ? variant.quantity_rule : {};

		this.quantityInput.min = rule.min || 1;
		this.quantityInput.step = rule.increment || 1;
		if (rule.max) this.quantityInput.max = rule.max;
		else this.quantityInput.removeAttribute('max');

		if (this.quantitySelector && typeof this.quantitySelector.syncRules === 'function') {
			this.quantitySelector.syncRules();
		}
	}

	// ── Product Video Slides ─────────────────────────────────────
	initVideoSlides() {
		var self = this;
		var videoSlides = this.querySelectorAll('.product-template__media-slide--external_video');
		if (!videoSlides.length) return;

		this._videoFrames = [];
		videoSlides.forEach(function(slide) {
			var iframe = slide.querySelector('.product-template__video-iframe');
			if (!iframe || slide.getAttribute('data-video-host') !== 'youtube') return;
			if (iframe.src && iframe.src.indexOf('enablejsapi=1') === -1) {
				iframe.src = iframe.src + (iframe.src.indexOf('?') === -1 ? '?' : '&') + 'enablejsapi=1';
			}
			self._videoFrames.push({ slide: slide, iframe: iframe });
		});
		if (!this._videoFrames.length) return;

		var checkSwiper = setInterval(function() {
			if (self.mainSwiper) {
				clearInterval(checkSwiper);
				self.mainSwiper.on('slideChange', function() {
					self._handleVideoSlideChange();
				});
			}
		}, 200);
	}

	_postVideoCommand(iframe, func) {
		if (!iframe.contentWindow) return;
		iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: '' }), '*');
	}

	_handleVideoSlideChange() {
		if (!this._videoFrames || !this._videoFrames.length) return;
		var slides = this.querySelectorAll('.product-template__media-slide');
		var activeIndex = this.mainSwiper ? this.mainSwiper.activeIndex : 0;
		var activeSlide = slides[activeIndex];
		var self = this;

		this._videoFrames.forEach(function(entry) {
			if (entry.slide === activeSlide) {
				self._postVideoCommand(entry.iframe, 'mute');
				self._postVideoCommand(entry.iframe, 'playVideo');
			} else {
				self._postVideoCommand(entry.iframe, 'pauseVideo');
			}
		});
	}
	initSellingPlans() {
		const sellingPlansWrapper = this.querySelector('[data-selling-plans-wrapper]');
		if (!sellingPlansWrapper) return;

		const radios = sellingPlansWrapper.querySelectorAll('[data-purchase-option-toggle]');
		const plansSelectWrapper = sellingPlansWrapper.querySelector('[data-subscription-plans]');
		const selectEl = sellingPlansWrapper.querySelector('[data-product-selling-plan]');

		radios.forEach((radio) => {
			radio.addEventListener('change', () => {
				const isSub = radio.value === 'subscription' && radio.checked;
				if (plansSelectWrapper) plansSelectWrapper.hidden = !isSub;
				if (selectEl) selectEl.disabled = !isSub || !selectEl.value;
			});
		});
	}
}

if (!customElements.get('product-template')) customElements.define('product-template', ProductTemplate);

// ProductStickyAdd Component
class ProductStickyAdd extends HTMLElement {
	constructor() {
		super();
		this.triggerElement = null;
		this.isVisible = false;
		this.scrollThreshold = 0;
		this.headerHeight = 80;
	}

	connectedCallback() {
		this.init();
		if (!this.triggerElement) return;
		this.bindScrollEvents();
		this.listenToVariantChanges();
		this.observeHeight();
	}

	observeHeight() {
		if (!('ResizeObserver' in window)) return;
		var self = this;
		this._heightObserver = new ResizeObserver(function() {
			document.documentElement.style.setProperty('--product-sticky-add-height', self.offsetHeight + 'px');
		});
		this._heightObserver.observe(this);
	}

	init() {
		this.productTemplate = document.querySelector('product-template');
		this.triggerElement = document.querySelector('[data-product-buy]') || document.querySelector('[data-product-add]');
		if (!this.triggerElement) return;
		this.calculateThreshold();
		this.bindEvents();
	}

	bindScrollEvents() {
		var self = this;
		this._scrollHandler = debounce(function() { self.handleScroll(); }, 10);
		this._resizeHandler = debounce(function() { self.calculateThreshold(); }, 150);

		window.addEventListener('scroll', this._scrollHandler);
		window.addEventListener('resize', this._resizeHandler);
	}

	disconnectedCallback() {
		if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler);
		if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
		if (this._heightObserver) {
			this._heightObserver.disconnect();
			document.documentElement.style.removeProperty('--product-sticky-add-height');
		}
	}

	listenToVariantChanges() {
		var self = this;
		var productTemplate = document.querySelector('product-template');
		if (productTemplate && typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.events) {
			productTemplate.addEventListener(themeConfig.product.events.variant_change, function(e) {
				self.updateVariant(e.detail);
			});
		}
	}

	calculateThreshold() {
		if (!this.triggerElement) return;
		const rect = this.triggerElement.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		this.scrollThreshold = rect.bottom + scrollTop;
	}

	handleScroll() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const shouldShow = scrollTop > this.scrollThreshold;

		if (shouldShow && !this.isVisible) this.show();
		else if (!shouldShow && this.isVisible) this.hide();
	}

	show() {
		this.isVisible = true;
		this.classList.add('is-visible');
	}

	hide() {
		this.isVisible = false;
		this.classList.remove('is-visible');
	}

	bindEvents() {
		const self = this;
		const addBtn = this.querySelector('[data-action="sticky-add-to-cart"]');
		const buyBtn = this.querySelector('[data-action="sticky-buy-now"]');
		const productInfo = this.querySelector('[data-sticky-product-info]');
		if (addBtn) {
			addBtn.addEventListener('click', function() {
				const mainAddBtn = document.querySelector('[data-product-add]');
				if (mainAddBtn) mainAddBtn.click();
			});
		}

		if (buyBtn) {
			buyBtn.addEventListener('click', function() {
				const mainBuyBtn = document.querySelector('[data-product-buy]');
				if (mainBuyBtn) {
					mainBuyBtn.click();
				} else if (self.productTemplate && typeof self.productTemplate.handleBuyNow === 'function') {
					self.productTemplate.handleBuyNow();
				}
			});
		}

		if (productInfo) {
			productInfo.addEventListener('click', function() {
				const variantPicker = document.querySelector('.variant-picker');
				if (variantPicker) {
					const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
					const offset = variantPicker.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
					window.scrollTo({ top: offset, behavior: 'smooth' });
				}
			});
			productInfo.style.cursor = 'pointer';
		}
	}

	updateVariant(variant) {
		if (!variant) return;

		const imageEl = this.querySelector('[data-sticky-image]');
		const variantEl = this.querySelector('[data-sticky-variant]');
		const priceEl = this.querySelector('[data-sticky-price] .price-current');
		const compareEl = this.querySelector('[data-sticky-price] .price-compare');
		const addBtn = this.querySelector('[data-action="sticky-add-to-cart"]');
		const buyBtn = this.querySelector('[data-action="sticky-buy-now"]');

		if (imageEl && variant.image) {
			var imageSrc = typeof variant.image === 'string' ? variant.image : (variant.image.src || variant.image.url);
			if (imageSrc) {
				if (window.ThemeUtils && typeof window.ThemeUtils.resizeImage === 'function') {
					imageEl.src = window.ThemeUtils.resizeImage(imageSrc);
					imageEl.srcset = '';
				} else {
					imageEl.src = imageSrc;
					imageEl.srcset = '';
				}
			}
		}

		if (variantEl) {
			variantEl.textContent = variant.title || '';
		}

		if (priceEl) {
			var strings = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.variant) ? themeConfig.strings.variant : {};
			priceEl.textContent = (variant.price == 0 || variant.price == null) 
				? strings.contact
			: ThemeUtils.formatMoney(variant.price, themeConfig.priceFormat);
		}

		if (compareEl) {
			var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
			compareEl.textContent = onSale ? ThemeUtils.formatMoney(variant.compare_at_price) : '';
			compareEl.hidden = !onSale;
			if (priceEl) priceEl.classList.toggle('price-current--sale', !!onSale);
		}

		if (addBtn) addBtn.disabled = !variant.available;
		if (buyBtn) buyBtn.disabled = !variant.available;
	}
}
if (!customElements.get('product-sticky-add')) customElements.define('product-sticky-add', ProductStickyAdd);

// ProductLightbox Component
class ProductLightbox extends HTMLElement {
	constructor() {
		super();
		this.images = [];
		this.currentIndex = 0;
	}

	connectedCallback() {
		this.bindEvents();
		this.bindKeyboardEvents();
	}

	bindEvents() {
		var self = this;
		var closeBtn = this.querySelector('.lightbox-close');
		var prevBtn = this.querySelector('.lightbox-prev');
		var nextBtn = this.querySelector('.lightbox-next');
		var overlay = this.querySelector('.lightbox-overlay');

		if (closeBtn) closeBtn.addEventListener('click', function() { self.close(); });
		if (prevBtn) prevBtn.addEventListener('click', function() { self.showImage(self.currentIndex - 1); });
		if (nextBtn) nextBtn.addEventListener('click', function() { self.showImage(self.currentIndex + 1); });
		if (overlay) overlay.addEventListener('click', function(e) {
			if (e.target === overlay) self.close();
		});
	}

	bindKeyboardEvents() {
		this._keydownHandler = (e) => {
			if (!this.classList.contains('is-active')) return;

			const actions = {
				'Escape': () => this.close(),
				'ArrowLeft': () => this.showImage(this.currentIndex - 1),
				'ArrowRight': () => this.showImage(this.currentIndex + 1)
			};

			if (actions[e.key]) actions[e.key]();
		};
		document.addEventListener('keydown', this._keydownHandler);
	}

	disconnectedCallback() {
		if (this._keydownHandler) {
			document.removeEventListener('keydown', this._keydownHandler);
		}
	}

	open(images, index = 0, trigger) {
		this.images = images;
		this.showImage(index);
		this.classList.add('is-active');
		if (window.ThemeUtils) {
			ThemeUtils.lockScroll();
			ThemeUtils.trapFocus(this, trigger);
		}
	}

	close() {
		if (!this.classList.contains('is-active')) return;
		this.classList.remove('is-active');
		if (window.ThemeUtils) {
			ThemeUtils.unlockScroll();
			ThemeUtils.releaseFocus(this);
		}
	}

	showImage(index) {
		if (index < 0) index = this.images.length - 1;
		if (index >= this.images.length) index = 0;
		this.currentIndex = index;

		const entry = this.images[index];
		if (!entry) return;
		let img = this.querySelector('.lightbox-image');
		if (!img) {
			img = document.createElement('img');
			img.className = 'lightbox-image';
			this.querySelector('.lightbox-next').before(img);
		}
		let src = entry.src;
		if (/_compact|_small|_medium/.test(src)) {
			src = src.replace(/_compact|_small|_medium|_large|_grande/g, '_1024x1024');
		}
		img.src = src;
		img.alt = entry.alt;
	}
}
if (!customElements.get('product-lightbox')) customElements.define('product-lightbox', ProductLightbox);

function initProductLightbox() {
	const productTemplate = document.querySelector('product-template');
	const lightbox = document.querySelector('product-lightbox');

	if (!productTemplate || !lightbox) return;

	const images = Array.from(productTemplate.querySelectorAll('img.product-template__media-image'));
	const entries = images.map(img => ({ src: img.dataset.zoomSrc || img.currentSrc || img.src, alt: img.alt || '' }));

	images.forEach((img, index) => {
		if (img.dataset.lightboxBound) return;
		img.dataset.lightboxBound = '1';
		img.style.cursor = 'pointer';
		img.addEventListener('click', () => lightbox.open(entries, index));
		const button = img.closest('.product-template__media-slide')?.querySelector('[data-lightbox-open]');
		if (button) button.addEventListener('click', () => lightbox.open(entries, index, button));
	});
}

document.addEventListener('DOMContentLoaded', initProductLightbox);
document.addEventListener('shopify:section:load', initProductLightbox);

// SizeGuideModal Component
class SizeGuideModal extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		if (this.hasAttribute('data-initialized')) return;
		this.setAttribute('data-initialized', 'true');
		this.bindEvents();
	}

	bindEvents() {
		var self = this;
		var triggers = document.querySelectorAll('[data-size-guide-trigger]');
		var closeButtons = this.querySelectorAll('[data-action="close"]');

		triggers.forEach(function(trigger) {
			trigger.addEventListener('click', function(e) {
				e.preventDefault();
				self.open();
			});
		});

		closeButtons.forEach(function(btn) {
			btn.addEventListener('click', function() {
				self.close();
			});
		});

		this._keydownHandler = function(e) {
			if (e.key === 'Escape' && !self.classList.contains('hidden')) {
				self.close();
			}
		};
		document.addEventListener('keydown', this._keydownHandler);
	}

	disconnectedCallback() {
		if (this._keydownHandler) {
			document.removeEventListener('keydown', this._keydownHandler);
		}
	}

	open() {
		this.classList.remove('hidden');
		if (window.ThemeUtils) ThemeUtils.lockScroll();
		if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this);
	}

	close() {
		this.classList.add('hidden');
		if (window.ThemeUtils) ThemeUtils.unlockScroll();
		if (window.ThemeUtils && ThemeUtils.releaseFocus) ThemeUtils.releaseFocus(this);
	}
}
if (!customElements.get('size-guide-modal')) customElements.define('size-guide-modal', SizeGuideModal);


// Product Template Relate Component
class ProductTemplateRelate extends HTMLElement {
	connectedCallback() {
		this.initSwiper();
	}

	initSwiper() {
		var swiperEl = this.querySelector('.swiper');
		if (!swiperEl) return;

		var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
		if (slideCount === 0) return;

		(window.swiperReady || function(cb){ cb(); })(function(){
		new Swiper(swiperEl, {
			slidesPerView: 1.2,
			spaceBetween: 16,
			loop: slideCount > 4,
			a11y: { slideRole: 'listitem' },
			pagination: {
				el: '.swiper-pagination',
				clickable: true
			},
			navigation: {
				nextEl: '.swiper-button-next',
				prevEl: '.swiper-button-prev'
			},
			breakpoints: {
				576: {
					slidesPerView: 2,
					spaceBetween: 16
				},
				768: {
					slidesPerView: 3,
					spaceBetween: 20
				},
				992: {
					slidesPerView: 4,
					spaceBetween: 24
				}
			}
		});
		}, swiperEl);
	}
}
if (!customElements.get('product-template-relate')) customElements.define('product-template-relate', ProductTemplateRelate);

// ProductViewed Component
class ProductViewed extends HTMLElement {
	constructor() {
		super();
		this.storageKey = 'product_viewed';
		this.limit = parseInt(this.getAttribute('data-limit')) || 12;
	}

	connectedCallback() {
		this.listEl = this.querySelector('.product-viewed__grids');
		this.emptyEl = this.querySelector('.product-viewed__empty');
		this.swiperWrap = this.querySelector('.product-viewed__wrap');

		if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
			this.saveCurrentProduct();
		}

		this.loadProducts();
	}

	loadProducts() {
		var self = this;
		if (!this.listEl) return;

		try {
			var viewedProducts = ThemeUtils.storage.getJSON(this.storageKey) || [];
			var currentHandle = (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data)
				? themeConfig.product.data.handle
				: null;

			var filteredProducts = viewedProducts.filter(function (p) {
				return p.handle !== currentHandle;
			}).slice(0, this.limit);

			if (filteredProducts.length === 0) {
				this.showEmpty();
				return;
			}

			var productPromises = filteredProducts.map(function (p) {
				return self.fetchProductHTML(p.handle);
			});

			Promise.all(productPromises)
				.then(function (productHTMLs) {
					var validHTMLs = productHTMLs.filter(function (html) {
						return html && html.trim();
					});

					if (validHTMLs.length === 0) {
						self.showEmpty();
						return;
					}

					self.listEl.innerHTML = validHTMLs.map(function (html) {
						return '<li class="product-cards__item swiper-slide">' + html + '</li>';
					}).join('');
					self.hidden = false;
					self.initSwiper();
				})
				.catch(function () {
					self.showEmpty();
				});
		} catch (error) {
			this.showEmpty();
		}
	}

	fetchProductHTML(handle) {
		var rootUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
		return fetch(rootUrl + 'products/' + encodeURIComponent(handle) + '?section_id=product-card-ajax')
			.then(function (response) {
				if (!response.ok) return null;
				return response.text();
			})
			.then(function (html) {
				if (!html) return null;
				var card = new DOMParser().parseFromString(html, 'text/html').querySelector('product-card');
				return card ? card.outerHTML : null;
			})
			.catch(function () {
				return null;
			});
	}

	saveCurrentProduct() {
		if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) return;

		var product = themeConfig.product.data;
		if (!product || !product.handle) return;

		var stored = ThemeUtils.storage.getJSON(this.storageKey);
		var viewedProducts = Array.isArray(stored) ? stored : [];

		viewedProducts = viewedProducts.filter(function (p) {
			return p.handle !== product.handle;
		});

		var productImage = product.featured_image;
		if (!productImage && product.images && product.images[0]) {
			productImage = product.images[0].src;
		}

		viewedProducts.unshift({
			handle: product.handle,
			title: product.title,
			image: productImage || null,
			price: product.price,
			compare_at_price: product.compare_at_price,
			url: product.url || ((themeConfig.routes && themeConfig.routes.all_products_url) ? themeConfig.routes.all_products_url.replace('/collections/all', '/products/') : '/products/') + product.handle
		});

		ThemeUtils.storage.set(this.storageKey, JSON.stringify(viewedProducts.slice(0, this.limit)));
	}

	initSwiper() {
		var swiperEl = this.swiperWrap;
		if (!swiperEl) return;

		var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
		if (slideCount === 0) return;

		(window.swiperReady || function(cb){ cb(); })(function(){
		new Swiper(swiperEl, {
			slidesPerView: 1.2,
			spaceBetween: 16,
			loop: slideCount > 4,
			a11y: { slideRole: 'listitem' },
			navigation: {
				nextEl: swiperEl.querySelector('.swiper-button-next'),
				prevEl: swiperEl.querySelector('.swiper-button-prev')
			},
			breakpoints: {
				576: { slidesPerView: 2, spaceBetween: 16 },
				768: { slidesPerView: 3, spaceBetween: 20 },
				992: { slidesPerView: 4, spaceBetween: 24 }
			}
		});
		}, swiperEl);
	}

	showEmpty() {
		this.hidden = true;
	}
}
if (!customElements.get('product-viewed')) customElements.define('product-viewed', ProductViewed);

// GiftCardRecipient controller — enables recipient fields only when the
// disclosure checkbox is active so blank properties never reach the server.
class GiftCardRecipient {
	constructor(container) {
		this.container = container;
		this.toggle = container.querySelector('input[name="properties[__shopify_send_gift_card_to_recipient]"]');
		this.offset = container.querySelector('[data-gift-card-offset]');
		this.fields = container.querySelectorAll('[data-gift-card-field]');
		if (!this.toggle) return;
		this.toggle.addEventListener('change', () => this.sync());
		this.sync();
	}

	sync() {
		var active = this.toggle.checked;
		this.fields.forEach(function(field) {
			field.disabled = !active;
		});
		if (this.offset) {
			this.offset.disabled = !active;
			if (active) this.offset.value = new Date().getTimezoneOffset().toString();
		}
	}
}

function initGiftCardRecipients() {
	document.querySelectorAll('.product-template__gift-card-recipient').forEach(function(el) {
		if (el.dataset.recipientBound) return;
		el.dataset.recipientBound = '1';
		new GiftCardRecipient(el);
	});
}

document.addEventListener('DOMContentLoaded', initGiftCardRecipients);
document.addEventListener('shopify:section:load', initGiftCardRecipients);

})();
