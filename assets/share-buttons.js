/* -------------------------------------------------------------------------- */
/*                                SHARE BUTTONS                               */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class ShareButtons extends HTMLElement {
    connectedCallback() {
      this.lifecycle = new AbortController();
      this.bindEvents();
    }

    disconnectedCallback() {
      if (this.lifecycle) this.lifecycle.abort();
    }

    bindEvents() {
      var self = this;
      var signal = this.lifecycle.signal;

      this.setupNativeShare();

      this.querySelectorAll('.share-buttons__copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var url = this.dataset.url;
          self.copyToClipboard(url, this);
        }, { signal: signal });
      });

      this.querySelectorAll('[data-native-share]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          self.openNativeShare(this);
        }, { signal: signal });
      });
    }

    setupNativeShare() {
      if (navigator.share) {
        this.classList.add('share-buttons--native');
      }
    }

    openNativeShare(button) {
      if (!navigator.share) return;

      var shareData = {
        title: button.dataset.title || document.title,
        url: button.dataset.url || window.location.href
      };

      navigator.share(shareData).catch(function() {});
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
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(input);
      if (ok) this.showCopiedState(button);
      else this.showCopyFailed(button);
    }

    showCopyFailed() {
      if (typeof showToast === 'function') {
        showToast((themeConfig.strings.share || {}).copyFailed, 'error');
      }
    }

    showCopiedState(button) {
      if (!button.dataset.copyLabel) button.dataset.copyLabel = button.getAttribute('aria-label');
      clearTimeout(button._copiedTimer);
      button.classList.add('copied');
      button.setAttribute('aria-label', (themeConfig.strings.share || {}).success);

      if (typeof showToast === 'function') {
        showToast((themeConfig.strings.share || {}).success, 'success');
      }
      button._copiedTimer = setTimeout(function() {
        button.classList.remove('copied');
        button.setAttribute('aria-label', button.dataset.copyLabel);
      }, 2000);
    }
  }
  if (!customElements.get('share-buttons')) customElements.define('share-buttons', ShareButtons);
})();
