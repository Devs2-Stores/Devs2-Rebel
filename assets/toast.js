/* -------------------------------------------------------------------------- */
/*                               TOAST MANAGER                                */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  var ToastManager = {
    container: null,
    toasts: [],
    maxToasts: 5,
    defaultDuration: 3000,

    init: function() {
      if (!document.querySelector('.toast-container')) {
        var container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        this.container = container;
      } else {
        this.container = document.querySelector('.toast-container');
      }
    },

    show: function(message, type, duration) {
      var self = this;
      type = type || 'default';
      duration = duration || this.defaultDuration;

      if (!this.container) this.init();

      if (this.toasts.length >= this.maxToasts) {
        this.remove(this.toasts[0]);
      }

      var toast = this.createToast(message, type);
      this.container.appendChild(toast);
      this.toasts.push(toast);

      requestAnimationFrame(function() {
        toast.classList.add('toast-show');
      });

      if (duration > 0) {
        setTimeout(function() {
          self.remove(toast);
        }, duration);
      }

      return toast;
    },

    createToast: function(message, type) {
      var self = this;
      var wrapper = document.createElement('div');
      wrapper.className = 'toast-wrapper';

      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;

      var messageEl = document.createElement('div');
      messageEl.className = 'toast-message';
      messageEl.textContent = message;

      var closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.accessibility) ? themeConfig.strings.accessibility.close : 'Close');
      closeBtn.textContent = '\u00d7';
      closeBtn.addEventListener('click', function() {
        self.remove(wrapper);
      });

      toast.appendChild(messageEl);
      toast.appendChild(closeBtn);
      wrapper.appendChild(toast);

      return wrapper;
    },

    remove: function(toast) {
      var self = this;
      if (!toast || !toast.parentNode) return;

      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');

      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        var index = self.toasts.indexOf(toast);
        if (index > -1) {
          self.toasts.splice(index, 1);
        }
      }, 300);
    }
  };

  // Global showToast helper
  window.showToast = function(message, type, duration) {
    return ToastManager.show(message, type, duration);
  };

  window.Toast = ToastManager;
})();
