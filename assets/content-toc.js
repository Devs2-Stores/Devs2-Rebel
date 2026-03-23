/* -------------------------------------------------------------------------- */
/*                                 CONTENT TOC                                */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class ContentToc extends HTMLElement {
    connectedCallback() {
      this.contentSelector = this.getAttribute('content-selector') || '[itemprop="articleBody"]';
      this.headingLevels = this.getAttribute('data-heading-levels') || 'h2h3';
      this.showNumbers = this.hasAttribute('data-show-numbers');
      this.collapsible = this.hasAttribute('data-collapsible');
      this.headings = [];
      this.buildToc();
      this.bindEvents();
      if (this.collapsible) this.setupCollapse();
    }

    getHeadingSelector() {
      switch (this.headingLevels) {
        case 'h2':
          return 'h2';
        default:
          return 'h2, h3';
      }
    }

    buildToc() {
      var self = this;
      var content = document.querySelector(this.contentSelector);
      if (!content) return;

      var headings = content.querySelectorAll(this.getHeadingSelector());
      if (headings.length === 0) {
        this.style.display = 'none';
        return;
      }

      var tocList = document.createElement('ul');
      tocList.className = 'toc__list';

      var h2Count = 0;
      var h3Count = 0;
      var h4Count = 0;

      headings.forEach(function(heading, index) {
        var id = heading.id || 'toc-' + index;
        heading.id = id;
        self.headings.push(heading);

        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + id;
        link.className = 'toc__link';

        var text = heading.textContent;
        if (self.showNumbers) {
          var num = '';
          if (heading.tagName === 'H2') {
            h2Count++;
            h3Count = 0;
            h4Count = 0;
            num = h2Count + '. ';
          } else if (heading.tagName === 'H3') {
            h3Count++;
            h4Count = 0;
            num = h2Count + '.' + h3Count + '. ';
          } else {
            h4Count++;
            num = h2Count + '.' + h3Count + '.' + h4Count + '. ';
          }
          text = num + text;
        }
        link.textContent = text;

        if (heading.tagName === 'H2') {
          li.className = 'toc__item toc__item--h2';
        } else if (heading.tagName === 'H3') {
          li.className = 'toc__item toc__item--h3';
        } else {
          li.className = 'toc__item toc__item--h4';
        }

        li.appendChild(link);
        tocList.appendChild(li);
      });

      var title = this.querySelector('.toc__title');
      if (title) {
        title.insertAdjacentElement('afterend', tocList);
      } else {
        this.appendChild(tocList);
      }
    }

    bindEvents() {
      var self = this;

      this.querySelectorAll('.toc__link').forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var targetId = this.getAttribute('href').substring(1);
          var target = document.getElementById(targetId);
          if (target) {
            var offset = 100;
            var top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
              top: top,
              behavior: 'smooth'
            });
            history.pushState(null, null, '#' + targetId);
          }
        });
      });

      this._throttledUpdate = ThemeUtils.debounce(function() {
        self.updateActiveState();
      }, 100);
      window.addEventListener('scroll', this._throttledUpdate);
    }

    disconnectedCallback() {
      if (this._throttledUpdate) {
        window.removeEventListener('scroll', this._throttledUpdate);
      }
    }

    updateActiveState() {
      var self = this;
      var scrollPos = window.scrollY + 120;
      var activeIndex = -1;

      this.headings.forEach(function(heading, index) {
        if (heading.offsetTop <= scrollPos) {
          activeIndex = index;
        }
      });

      this.querySelectorAll('.toc__item').forEach(function(item, index) {
        if (index === activeIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    setupCollapse() {
      var self = this;
      var title = this.querySelector('.toc__title');
      var list = this.querySelector('.toc__list');
      if (!title || !list) return;

      title.classList.add('toc__title--collapsible');

      title.addEventListener('click', function() {
        if (self.classList.contains('collapsed')) {
          list.style.display = '';
          self.classList.remove('collapsed');
        } else {
          list.style.display = 'none';
          self.classList.add('collapsed');
        }
      });
    }
  }
  customElements.define('content-toc', ContentToc);

  /* -------------------------------------------------------------------------- */
  /*                                TOC FLOATING                                */
  /* -------------------------------------------------------------------------- */

  class TocFloating extends HTMLElement {
    connectedCallback() {
      var self = this;
      // Wait for content-toc build
      setTimeout(function() {
        self.inlineToc = document.querySelector('content-toc:not([floating])');
        self.isOpen = false;
        self.buildFloating();
        self.bindEvents();
      }, 100);
    }

    buildFloating() {
      var self = this;
      if (!this.inlineToc) {
        this.style.display = 'none';
        return;
      }

      this.trigger = this.querySelector('.toc-floating__trigger');
      this.panel = this.querySelector('.toc-floating__panel');
      this.overlay = this.querySelector('.toc-floating__overlay');

      if (!this.trigger || !this.panel) return;

      var tocContent = this.inlineToc.querySelector('.toc__list');
      if (tocContent) {
        var clonedList = tocContent.cloneNode(true);
        clonedList.style.display = '';
        this.panel.appendChild(clonedList);
      }
    }

    bindEvents() {
      var self = this;

      if (this.trigger) {
        this.trigger.addEventListener('click', function() {
          self.toggle();
        });
      }

      if (this.overlay) {
        this.overlay.addEventListener('click', function() {
          self.close();
        });
      }

      var closeBtn = this.querySelector('.toc-floating__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          self.close();
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });

      this._scrollCheck = ThemeUtils.debounce(function() {
        self.checkVisibility();
      }, 100);
      window.addEventListener('scroll', this._scrollCheck);

      if (this.panel) {
        this.panel.querySelectorAll('.toc__link').forEach(function(link) {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('href').substring(1);
            var target = document.getElementById(targetId);
            if (target) {
              self.close();
              var offset = 100;
              var top = target.getBoundingClientRect().top + window.scrollY - offset;
              window.scrollTo({
                top: top,
                behavior: 'smooth'
              });
              history.pushState(null, null, '#' + targetId);
            }
          });
        });
      }
    }

    checkVisibility() {
      if (!this.inlineToc) return;
      var tocBottom = this.inlineToc.offsetTop + this.inlineToc.offsetHeight;
      if (window.scrollY > tocBottom) {
        this.classList.add('visible');
      } else {
        this.classList.remove('visible');
        this.close();
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.classList.add('open');
      ThemeUtils.lockScroll();
    }

    close() {
      this.isOpen = false;
      this.classList.remove('open');
      ThemeUtils.unlockScroll();
    }
  }
  customElements.define('toc-floating', TocFloating);
})();
