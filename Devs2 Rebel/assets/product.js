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
		this.initWishlist();
		this.initVideoSlides();
		this.initBackInStock();
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
		this.quantitySelector = this.querySelector('quantity-selector');
		this.quantityInput = this.quantitySelector ? this.quantitySelector.querySelector('input') : null;
	}

	bindEvents() {
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
		try {
			var url = new URL(window.location.href);
			var variantId = url.searchParams.get('variant');

			if (!variantId) return;

			var product = (typeof themeConfig !== 'undefined' && themeConfig.product) ? themeConfig.product.data : null;
			if (!product || !product.variants) return;

			var variant = product.variants.find(function(v) {
				return String(v.id) === String(variantId);
			});

			if (variant) {
				this.currentVariant = variant;
				// Wait for variant picker to be ready (custom elements may not be connected yet)
				setTimeout(function() {
					self.selectVariantOptions(variant);
					self.refreshUI(variant);
				}, 100);
			}
		} catch (e) {
			console.error('Error initializing variant from URL:', e);
		}
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
		const tabButtons = this.querySelectorAll('.product-template__tab-btn');
		const tabPanels = this.querySelectorAll('.product-template__tab-panel');

		if (tabButtons.length === 0) return;

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

		this.initDescriptionToggle();
	}

	initDescriptionToggle() {
		var self = this;

		var initToggle = function(wrapper) {
			if (!wrapper) return;

			var toggleBtn = wrapper.querySelector('[data-description-toggle]');
			var descContent = wrapper.querySelector('[data-description-content]');

			if (!toggleBtn || !descContent) return;

			var readmoreEnabled = toggleBtn.getAttribute('data-readmore-enabled') !== 'false';
			var maxHeight = parseInt(toggleBtn.getAttribute('data-max-height')) || 300;
			var moreText = toggleBtn.querySelector('[data-toggle-text-more]');
			var lessText = toggleBtn.querySelector('[data-toggle-text-less]');

			if (!readmoreEnabled) {
				descContent.classList.remove('is-collapsed');
				wrapper.classList.remove('is-collapsed');
				toggleBtn.classList.add('hidden');
				return;
			}

			var checkHeight = function() {
				if (descContent.scrollHeight > maxHeight) {
					descContent.classList.add('is-collapsed');
					wrapper.classList.add('is-collapsed');
					toggleBtn.classList.remove('hidden');
				} else {
					descContent.classList.remove('is-collapsed');
					wrapper.classList.remove('is-collapsed');
					toggleBtn.classList.add('hidden');
				}
			};

			checkHeight();

			toggleBtn.onclick = function() {
				var isCollapsed = descContent.classList.contains('is-collapsed');

				if (isCollapsed) {
					descContent.classList.remove('is-collapsed');
					wrapper.classList.remove('is-collapsed');
					toggleBtn.classList.add('is-expanded');
					if (moreText) moreText.classList.add('hidden');
					if (lessText) lessText.classList.remove('hidden');
				} else {
					descContent.classList.add('is-collapsed');
					wrapper.classList.add('is-collapsed');
					toggleBtn.classList.remove('is-expanded');
					if (moreText) moreText.classList.remove('hidden');
					if (lessText) lessText.classList.add('hidden');
				}
			};
		};

		// Initialize all description wrappers
		var wrappers = this.querySelectorAll('[data-description-wrapper]');
		for (var i = 0; i < wrappers.length; i++) {
			initToggle(wrappers[i]);
		}

		// Re-initialize when tab changes
		var tabBtns = this.querySelectorAll('[data-tab]');
		for (var j = 0; j < tabBtns.length; j++) {
			tabBtns[j].addEventListener('click', function() {
				setTimeout(function() {
					var activePanel = self.querySelector('.product-template__tab-panel.active');
					if (activePanel) {
						var wrapper = activePanel.querySelector('[data-description-wrapper]');
						if (wrapper) {
							initToggle(wrapper);
						}
					}
				}, 100);
			});
		}
	}

	initMedia() {
		if (!this.mediaSliderEl) return;

		var self = this;
		var initSwiper = function() {
			if (typeof Swiper === 'undefined') return;

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

		if (typeof Swiper !== 'undefined') {
			initSwiper();
		} else {
			window.addEventListener('load', initSwiper);
		}
	}

	initWishlist() {
		const wishlistBtn = this.querySelector('[data-product-wishlist]');
		if (!wishlistBtn) return;

		const productId = wishlistBtn.getAttribute('data-product-id');
		if (!productId) return;

		const wishlist = this.getWishlist();
		var isExisting = wishlist.some(function(item) {
			var itemId = typeof item === 'string' ? item : item.id;
			return itemId === String(productId);
		});
		if (isExisting) {
			wishlistBtn.classList.add('is-active');
			this.updateWishlistIcon(wishlistBtn, true);
		}

		var self = this;
		wishlistBtn.addEventListener('click', function() {
			var isActive = wishlistBtn.classList.contains('is-active');

			if (isActive) {
				self.removeFromWishlist(productId);
				wishlistBtn.classList.remove('is-active');
				self.updateWishlistIcon(wishlistBtn, false);
				if (typeof showToast === 'function') showToast('Đã xóa khỏi yêu thích', 'info');
			} else {
				self.addToWishlist(productId);
				wishlistBtn.classList.add('is-active');
				self.updateWishlistIcon(wishlistBtn, true);
				if (typeof showToast === 'function') showToast('Đã thêm vào yêu thích', 'success');
			}

			self.updateWishlistCount();
		});
	}

	getWishlist() {
		try {
			const wishlist = localStorage.getItem('devs2_wishlist');
			return wishlist ? JSON.parse(wishlist) : [];
		} catch (e) {
			return [];
		}
	}

	addToWishlist(productId) {
		var wishlist = this.getWishlist();
		var exists = wishlist.some(function(item) {
			var itemId = typeof item === 'string' ? item : item.id;
			return itemId === String(productId);
		});
		if (!exists) {
			var handle = '';
			if (typeof themeConfig !== 'undefined' && themeConfig.product && themeConfig.product.data) {
				handle = themeConfig.product.data.handle || '';
			}
			wishlist.push({ id: String(productId), handle: handle });
			localStorage.setItem('devs2_wishlist', JSON.stringify(wishlist));
			window.dispatchEvent(new CustomEvent('wishlist-changed', {
				detail: { 
					wishlist: wishlist,
					productId: productId
				}
			}));
		}
	}

	removeFromWishlist(productId) {
		var wishlist = this.getWishlist();
		var newList = wishlist.filter(function(item) {
			var itemId = typeof item === 'string' ? item : item.id;
			return itemId !== String(productId);
		});
		if (newList.length !== wishlist.length) {
			localStorage.setItem('devs2_wishlist', JSON.stringify(newList));
			window.dispatchEvent(new CustomEvent('wishlist-changed', {
				detail: { 
					wishlist: newList,
					productId: productId
				}
			}));
		}
	}

	updateWishlistIcon(button, isFilled) {
		const icon = button.querySelector('.icon use');
		if (icon) {
			icon.setAttribute('href', isFilled ? '#icon-heart-filled' : '#icon-heart');
		}
	}

	updateWishlistCount() {
		const count = this.getWishlist().length;
		const badges = document.querySelectorAll('.wishlist-count');
		badges.forEach(badge => {
			badge.textContent = count;
			badge.style.display = count > 0 ? '' : 'none';
		});
	}

	refreshUI(variant) {
		if (variant) {
			this.updateFeaturedImage(variant.image);
			this.updateSku(variant.sku);
			this.updateBarcode(variant.barcode);
			this.updateAvailable(variant.available);
			this.updatePrice(variant.price, variant.compare_at_price);
			this.updatePurchaseButtons(variant.available);
			this.updateStockCounter(variant);
			this.updateBackInStock(variant);
		} else {
			this.updateFeaturedImage(null);
			this.updateSku(null);
			this.updateBarcode(null);
			this.updateAvailable(null);
			this.updatePrice(null);
			this.updatePurchaseButtons(null);
		}
	}

	updateFeaturedImage(image) {
		if (!image || !this.mainSwiper) return;

		const imageSrc = typeof image === 'string' ? image : (image.src || image.url);
		if (!imageSrc) return;

		const slides = this.mediaSliderEl.querySelectorAll('.swiper-slide img');
		const getFilename = (url) => url.split('/').pop().split('?')[0].replace(/(_\d+x\d+)/, '');

		for (let i = 0; i < slides.length; i++) {
			if (getFilename(slides[i].src) === getFilename(imageSrc)) {
				this.mainSwiper.slideTo(i);
				break;
			}
		}
	}

	updateSku(sku) {
		if (!this.skuEl) return;
		this.skuEl.textContent = sku ? sku.trim() : 'Đang cập nhật';
	}

	updateBarcode(barcode) {
		if (!this.barcodeEl) return;
		this.barcodeEl.textContent = barcode ? barcode.trim() : 'Đang cập nhật';
	}

	updateAvailable(available) {
		if (!this.availableEl) return;

		const states = {
			null: { class: 'product-template__status--unavailable', text: 'Liên hệ ngay' },
			true: { class: 'product-template__status--available', text: 'Còn hàng' },
			false: { class: 'product-template__status--unavailable', text: 'Hết hàng' }
		};

		const state = states[available == null ? 'null' : available];
		this.availableEl.classList.remove('product-template__status--available', 'product-template__status--unavailable');
		this.availableEl.classList.add(state.class);
		this.availableEl.textContent = state.text;
	}

updatePurchaseButtons(available) {
	var isAvailable = available === true;

	if (this.addButtons) {
		var addBtnContent = this.addButtons.querySelector('.button-content span:last-child');
		if (isAvailable) {
			this.addButtons.disabled = false;
			this.addButtons.classList.remove('sold-out');
			if (addBtnContent) addBtnContent.textContent = 'Thêm vào giỏ';
		} else {
			this.addButtons.disabled = true;
			this.addButtons.classList.add('sold-out');
			if (addBtnContent) addBtnContent.textContent = 'Hết hàng';
		}
	}

	if (this.buyButtons) {
		var buyBtnContent = this.buyButtons.querySelector('.button-content');
		if (isAvailable) {
			this.buyButtons.disabled = false;
			this.buyButtons.classList.remove('sold-out');
			this.buyButtons.classList.remove('contact-link');
			this.buyButtons.onclick = null;
			if (buyBtnContent) buyBtnContent.textContent = 'Mua ngay';
		} else {
			this.buyButtons.disabled = false;
			this.buyButtons.classList.add('sold-out');
			this.buyButtons.classList.add('contact-link');
			if (buyBtnContent) buyBtnContent.textContent = 'Liên hệ';

			// Get contact link from data attribute (set by Liquid)
			var contactLink = this.buyButtons.getAttribute('data-contact-link') || '/lien-he';

			this.buyButtons.onclick = function() {
				window.location.href = contactLink;
			};
		}
	}
}

updatePrice(price, compare) {
	if (!this.priceEl) return;

	if (price == 0 || price == null) {
		this.priceEl.textContent = 'Liên hệ';
		if (this.compareEl) this.compareEl.style.display = 'none';
		if (this.saleEl) this.saleEl.style.display = 'none';
	} else {
		this.priceEl.textContent = ThemeUtils.formatMoney(price);

		if (compare && compare > price) {
			if (this.compareEl) {
				this.compareEl.style.display = 'block';
				this.compareEl.textContent = ThemeUtils.formatMoney(compare);
			}
			if (this.saleEl) {
				const percent = Math.round(((compare - price) / compare) * 100);
				this.saleEl.textContent = '-' + percent + '%';
				this.saleEl.style.display = 'block';
			}
		} else {
			if (this.compareEl) this.compareEl.style.display = 'none';
			if (this.saleEl) this.saleEl.style.display = 'none';
		}
	}
}

async handleAddToCart(e) {
	e.preventDefault();

	if (!this.validateVariant()) return;

	const quantity = parseInt(this.quantityInput ? this.quantityInput.value : 1) || 1;
	const variantId = this.currentVariant.id;

	this.setButtonLoading(this.addButtons, true, 'Đang thêm...');

	try {
		const data = await ThemeUtils.request({
			url: themeConfig.routes.add_cart_url,
			method: 'POST',
			body: { id: variantId, quantity }
		});

		if (data) {
			await ThemeUtils.updateCartData(data);
			document.dispatchEvent(new CustomEvent('cart:item_added', { detail: data }));
			if (typeof openCartModal === 'function') openCartModal();
		}
	} catch (error) {
		console.error('Add to cart error:', error);
		window.showToast('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.', 'error');
	} finally {
		this.setButtonLoading(this.addButtons, false);
	}
}

async handleBuyNow(e) {
	e.preventDefault();

	// If button is contact link, let onclick handler take over
	if (this.buyButtons && this.buyButtons.classList.contains('contact-link')) {
		return;
	}

	if (!this.validateVariant()) return;

	const quantity = parseInt(this.quantityInput ? this.quantityInput.value : 1) || 1;
	const variantId = this.currentVariant.id;

	this.setButtonLoading(this.buyButtons, true, 'Đang xử lý...');

	try {
		const data = await ThemeUtils.request({
			url: themeConfig.routes.add_cart_url,
			method: 'POST',
			body: { id: variantId, quantity }
		});

		if (data) {
			await ThemeUtils.updateCartData(data);
			this.setButtonLoading(this.buyButtons, false);
			window.location.href = '/checkout';
		}
	} catch (error) {
		console.error('Buy now error:', error);
		window.showToast('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.', 'error');
		this.setButtonLoading(this.buyButtons, false);
	}
}

validateVariant() {
	if (!this.currentVariant) {
		window.showToast('Vui lòng chọn biến thể sản phẩm', 'warning');
		return false;
	}
	if (!this.currentVariant.available) {
		window.showToast('Sản phẩm hiện không còn hàng', 'warning');
		return false;
	}
	return true;
}

setButtonLoading(button, isLoading, loadingText = '') {
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

		var threshold = parseInt(counter.getAttribute('data-threshold')) || 10;
		var qty = variant ? (variant.inventory_quantity || 0) : 0;
		var qtyEl = counter.querySelector('[data-stock-qty]');

		// Ẩn stock counter nếu không quản lý tồn kho hoặc cho phép đặt khi hết hàng
		var mgmt = variant ? variant.inventory_management : null;
		var policy = variant ? (variant.inventory_policy || 'deny') : 'deny';
		if (!mgmt || policy === 'continue') {
			counter.classList.remove('is-visible');
			return;
		}

		if (qty > 0 && qty <= threshold) {
			counter.classList.add('is-visible');
			if (qtyEl) qtyEl.textContent = qty;
		} else {
			counter.classList.remove('is-visible');
		}
	}

	// ── Back-in-stock Alert ──────────────────────────────────────
	initBackInStock() {}

	updateBackInStock(variant) {
		var bisContainer = this.querySelector('[data-back-in-stock]');
		if (!bisContainer) return;

		// Update body field với variant hiện tại
		var bisBody = bisContainer.querySelector('[data-bis-body]');
		if (bisBody && variant) {
			var product = this._productData || {};
			bisBody.value = '[Back-in-stock] ' + (product.title || '') + ' - ' + (variant.title || '') + ' | ' + window.location.href;
		}

		if (variant && !variant.available) {
			bisContainer.style.display = '';
		} else {
			bisContainer.style.display = 'none';
		}
	}

	// ── Product Video Slides ─────────────────────────────────────
	initVideoSlides() {
		var self = this;
		var videoSlides = this.querySelectorAll('.product-template__media-slide--video');
		if (!videoSlides.length) return;

		this._ytPlayers = [];

		// Load YouTube IFrame API if not already loaded
		if (!window.YT || !window.YT.Player) {
			var tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(tag);
		}

		function initPlayers() {
			videoSlides.forEach(function(slide) {
				var iframe = slide.querySelector('.product-template__video-iframe');
				if (!iframe || slide.getAttribute('data-video-host') !== 'youtube') return;

				// Give iframe a unique ID
				if (!iframe.id) iframe.id = 'yt-player-' + Math.random().toString(36).substr(2, 9);

				var player = new YT.Player(iframe.id, {
					events: {
						onReady: function(e) {
							player._ready = true;
							e.target.mute();
						}
					}
				});
				self._ytPlayers.push({ slide: slide, player: player });
			});

			// Hook into Swiper slideChange
			var checkSwiper = setInterval(function() {
				if (self.mainSwiper) {
					clearInterval(checkSwiper);
					self.mainSwiper.on('slideChange', function() {
						self._handleVideoSlideChange();
					});
				}
			}, 200);
		}

		if (window.YT && window.YT.Player) {
			initPlayers();
		} else {
			var prevCallback = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = function() {
				if (prevCallback) prevCallback();
				initPlayers();
			};
		}
	}

	_handleVideoSlideChange() {
		if (!this._ytPlayers || !this._ytPlayers.length) return;
		var slides = this.querySelectorAll('.product-template__media-slide');
		var activeIndex = this.mainSwiper ? this.mainSwiper.activeIndex : 0;
		var activeSlide = slides[activeIndex];

		this._ytPlayers.forEach(function(entry) {
			if (!entry.player || !entry.player._ready) return;
			try {
				if (entry.slide === activeSlide) {
					entry.player.playVideo();
				} else {
					entry.player.pauseVideo();
				}
			} catch (e) {}
		});
	}
}

customElements.define('product-template', ProductTemplate);

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
		this.bindScrollEvents();
		this.listenToVariantChanges();
	}

	init() {
		this.triggerElement = document.querySelector('[data-product-buy]');
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
				if (mainBuyBtn) mainBuyBtn.click();
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
			priceEl.textContent = (variant.price == 0 || variant.price == null) 
				? 'Liên hệ' 
			: ThemeUtils.formatMoney(variant.price);
		}

		if (compareEl) {
			if (variant.compare_at_price && variant.compare_at_price > variant.price) {
				compareEl.style.display = 'inline';
				compareEl.textContent = ThemeUtils.formatMoney(variant.compare_at_price);
			} else {
				compareEl.style.display = 'none';
			}
		}

		if (addBtn) addBtn.disabled = !variant.available;
		if (buyBtn) buyBtn.disabled = !variant.available;
	}
}
customElements.define('product-sticky-add', ProductStickyAdd);

// ProductLightbox Component
class ProductLightbox extends HTMLElement {
	constructor() {
		super();
		this.images = [];
		this.currentIndex = 0;
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.bindKeyboardEvents();
	}

	render() {
		this.innerHTML = '<div class="lightbox-overlay"></div>' +
			'<div class="lightbox-content">' +
			'<button class="lightbox-close" aria-label="Đóng">' +
			'<svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>' +
			'</button>' +
			'<div class="lightbox-image-wrapper">' +
			'<button class="lightbox-prev swiper-button-prev" aria-label="Ảnh trước"></button>' +
			'<img class="lightbox-image" src="" alt="">' +
			'<button class="lightbox-next swiper-button-next" aria-label="Ảnh tiếp"></button>' +
			'</div>' +
			'</div>';
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

	open(images, index = 0) {
		this.images = images;
		this.currentIndex = index;
		this.showImage(this.currentIndex);
		this.classList.add('is-active');
		document.body.style.overflow = 'hidden';
	}

	close() {
		this.classList.remove('is-active');
		document.body.style.overflow = '';
	}

	showImage(index) {
		if (index < 0) index = this.images.length - 1;
		if (index >= this.images.length) index = 0;
		this.currentIndex = index;

		const img = this.querySelector('.lightbox-image');
		if (img && this.images[index]) {
			let src = this.images[index];
			if (/_compact|_small|_medium/.test(src)) {
				src = src.replace(/_compact|_small|_medium|_large|_grande/g, '_1024x1024');
			}
			img.src = src;
		}
	}
}
customElements.define('product-lightbox', ProductLightbox);

// Initialize lightbox for product images
(() => {
	document.addEventListener('DOMContentLoaded', () => {
		const productTemplate = document.querySelector('product-template');
		const lightbox = document.querySelector('product-lightbox');

		if (!productTemplate || !lightbox) return;

		const images = productTemplate.querySelectorAll('.product-template__media-image');
		const imageUrls = Array.from(images).map(img => img.src);

		images.forEach((img, index) => {
			img.style.cursor = 'pointer';
			img.addEventListener('click', () => lightbox.open(imageUrls, index));
		});
	});
})();

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
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		this.classList.remove('hidden');
		document.body.style.overflow = 'hidden';
		if (scrollbarWidth > 0) {
			document.body.style.paddingRight = scrollbarWidth + 'px';
		}
		if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this);
	}

	close() {
		this.classList.add('hidden');
		document.body.style.overflow = '';
		document.body.style.paddingRight = '';
		if (window.ThemeUtils && ThemeUtils.releaseFocus) ThemeUtils.releaseFocus(this);
	}
}
customElements.define('size-guide-modal', SizeGuideModal);

// CouponPreview Component
class CouponPreview extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.bindEvents();
	}

	bindEvents() {
		const modal = document.querySelector('coupon-modal');

		this.addEventListener('click', function() {
			if (modal) modal.open();
		});

		this.style.cursor = 'pointer';
	}
}
customElements.define('coupon-preview', CouponPreview);

// CouponModal Component
class CouponModal extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.bindEvents();
	}

	bindEvents() {
		const triggers = document.querySelectorAll('[data-coupon-trigger]');
		const closeButtons = this.querySelectorAll('[data-action="close"]');
		const copyButtons = this.querySelectorAll('.coupon-modal-copy');

		const self = this;

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

		copyButtons.forEach(function(btn) {
			btn.addEventListener('click', function() {
				const code = this.getAttribute('data-code');
				if (code) {
					self.copyToClipboard(code, this);
				}
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
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		this.classList.remove('hidden');
		document.body.style.overflow = 'hidden';
		if (scrollbarWidth > 0) {
			document.body.style.paddingRight = scrollbarWidth + 'px';
		}
		if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this);
	}

	close() {
		this.classList.add('hidden');
		document.body.style.overflow = '';
		document.body.style.paddingRight = '';
		if (window.ThemeUtils && ThemeUtils.releaseFocus) ThemeUtils.releaseFocus(this);
	}

	copyToClipboard(text, button) {
		const self = this;

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(function() {
				self.showCopyFeedback(button);
			}).catch(function(err) {
				console.error('Copy failed:', err);
				self.fallbackCopy(text, button);
			});
		} else {
			self.fallbackCopy(text, button);
		}
	}

	fallbackCopy(text, button) {
		const self = this;
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-9999px';
		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			self.showCopyFeedback(button);
		} catch (err) {
			console.error('Fallback copy failed:', err);
			window.showToast('Sao chép thất bại', 'error');
		}

		document.body.removeChild(textArea);
	}

	showCopyFeedback(button) {
		var originalText = button.textContent;
		button.textContent = 'Đã sao chép!';
		button.classList.add('copied');

		if (typeof showToast === 'function') {
			showToast('Đã sao chép mã giảm giá', 'success');
		}

		setTimeout(function() {
			button.textContent = originalText;
			button.classList.remove('copied');
		}, 2000);
	}
}
customElements.define('coupon-modal', CouponModal);

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

		if (typeof Swiper === 'undefined') {
			setTimeout(function() { this.initSwiper(); }.bind(this), 100);
			return;
		}

		new Swiper(swiperEl, {
			slidesPerView: 1.2,
			spaceBetween: 16,
			loop: slideCount > 4,
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
	}
}
customElements.define('product-template-relate', ProductTemplateRelate);

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
			var viewedProducts = JSON.parse(localStorage.getItem(this.storageKey)) || [];
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
					self.style.display = 'block';
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
		return fetch('/search?q=filter=(handle:product=' + encodeURIComponent(handle) + ')&view=product')
			.then(function (response) {
				if (!response.ok) return null;
				return response.text();
			})
			.then(function (html) {
				if (html && html.includes('product-card')) return html.trim();
				return null;
			})
			.catch(function () {
				return null;
			});
	}

	saveCurrentProduct() {
		if (typeof themeConfig === 'undefined' || !themeConfig.product || !themeConfig.product.data) return;

		var product = themeConfig.product.data;
		if (!product || !product.handle) return;

		try {
			var viewedProducts = JSON.parse(localStorage.getItem(this.storageKey)) || [];

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
				url: product.url || '/products/' + product.handle
			});

			if (viewedProducts.length > this.limit) {
				viewedProducts = viewedProducts.slice(0, this.limit);
			}

			localStorage.setItem(this.storageKey, JSON.stringify(viewedProducts));
		} catch (error) {
			console.error('Error saving viewed product:', error);
		}
	}

	initSwiper() {
		var swiperEl = this.swiperWrap;
		if (!swiperEl) return;

		var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
		if (slideCount === 0) return;

		if (typeof Swiper === 'undefined') {
			setTimeout(function() { this.initSwiper(); }.bind(this), 100);
			return;
		}

		new Swiper(swiperEl, {
			slidesPerView: 1.2,
			spaceBetween: 16,
			loop: slideCount > 4,
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
	}

	showEmpty() {
		this.style.display = 'none';
	}
}
customElements.define('product-viewed', ProductViewed);
