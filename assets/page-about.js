(function() {
'use strict';

function revealElements(elements) {
	if (!('IntersectionObserver' in window) || !elements.length) return;
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('is-visible');
			observer.unobserve(entry.target);
		});
	}, {
		threshold: 0.08,
		rootMargin: '0px 0px -40px 0px'
	});

	elements.forEach((element) => {
		element.classList.add('about-reveal-item');
		observer.observe(element);
	});
}

function initComposedAboutPage() {
	const selectors = [
		'.section-rich-text-wrapper',
		'.section-iwt-wrapper',
		'.section-team-wrapper',
		'.section-stats-wrapper',
		'.section-timeline-wrapper',
		'.section-testimonials-wrapper',
		'.section-page-content-wrapper'
	];
	revealElements(Array.from(document.querySelectorAll(selectors.join(','))));
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initComposedAboutPage, { once: true });
} else {
	initComposedAboutPage();
}

})();
