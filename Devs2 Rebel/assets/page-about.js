class AboutPage extends HTMLElement {
	constructor() {
		super();
		this.observerOptions = {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		};
	}

	connectedCallback() {
		this.initAnimations();
	}

	initAnimations() {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		}, this.observerOptions);

		const animatedElements = this.querySelectorAll('.about-features__item, .about-gallery__item');
		animatedElements.forEach((el) => {
			el.style.opacity = '0';
			el.style.transform = 'translateY(30px)';
			el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
			observer.observe(el);
		});

		if (!document.getElementById('about-page-animation-style')) {
			const style = document.createElement('style');
			style.id = 'about-page-animation-style';
			style.textContent = '.is-visible { opacity: 1 !important; transform: translateY(0) !important; }';
			document.head.appendChild(style);
		}
	}
}

if (typeof customElements !== 'undefined' && !customElements.get('about-page')) {
	customElements.define('about-page', AboutPage);
}