class ProductTemplateMedia extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.featuredEl = this.querySelector("product-template-media-featured");
    if (this.featuredEl) this.featuredImageEl = this.featuredEl.querySelector("img");

    this.thumbnailsEl = this.querySelector("product-template-media-thumbnails");
    if (!this.thumbnailsEl) return;
    this.sliderForThumbnails();

    this.thumbnailsItem = this.thumbnailsEl.querySelectorAll("product-template-media-thumbnails-item");
    if (!this.thumbnailsItem.length) return;
    this.thumbnailsItem.forEach(el => el.addEventListener("click", (e) => this.handleThumbnailsItemChange(e)));
  }
  sliderForThumbnails() {
    const swiperEl = this.thumbnailsEl.querySelector(".swiper");
    if (!swiperEl) return;
    const swiper = new Swiper(swiperEl, {
      spaceBetween: remToPx(1),
      loop: 1,
      navigation: {
        nextEl: swiperEl.querySelector(".swiper-button-next"),
        prevEl: swiperEl.querySelector(".swiper-button-prev"),
      },
      breakpoints: {
        640: { slidesPerView: 3 },
        991: { slidesPerView: 4 },
        1200: { slidesPerView: 5 },
      },
    });
  }
  handleThumbnailsItemChange(e) {
    const target = e.currentTarget;
    const source = target.dataset.source;
    if (!this.featuredImageEl) return;
    this.featuredImageEl.src = source;
  }
}
if (!customElements.get('product-template-media')) {
  customElements.define("product-template-media", ProductTemplateMedia);
}