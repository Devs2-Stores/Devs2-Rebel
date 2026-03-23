/* -------------------------------------------------------------------------- */
/*                                SHARE BUTTONS                               */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class ShareButtons extends HTMLElement {
    connectedCallback() {
      this.bindEvents();
    }

    bindEvents() {
      var self = this;

      this.querySelectorAll('.share-buttons__copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var url = this.dataset.url;
          self.copyToClipboard(url, this);
        });
      });
    }

    copyToClipboard(text, button) {
      var self = this;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(function() {
            self.showCopiedState(button);
          })
          .catch(function() {
            self.fallbackCopy(text, button);
          });
      } else {
        this.fallbackCopy(text, button);
      }
    }

    fallbackCopy(text, button) {
      var input = document.createElement('input');
      input.value = text;
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showCopiedState(button);
    }

    showCopiedState(button) {
      button.classList.add('copied');
      button.setAttribute('aria-label', (themeConfig.strings.share || {}).success || 'Link copied');

      if (typeof showToast === 'function') {
        showToast((themeConfig.strings.share || {}).success || 'Link copied', 'success');
      }
      setTimeout(function() {
        button.classList.remove('copied');
        button.setAttribute('aria-label', (themeConfig.strings.share || {}).copyArticleLink || 'Copy link');
      }, 2000);
    }
  }
  customElements.define('share-buttons', ShareButtons);
})();
