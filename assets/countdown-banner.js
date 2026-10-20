(function() {
  if (customElements.get('countdown-banner')) return;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function parseTarget(endDate, endTime, tzOffset) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return NaN;
    var time = /^(\d{1,2}):(\d{2})$/.exec(endTime || '23:59');
    if (!time) return NaN;
    var iso = endDate + 'T' + pad(Number(time[1])) + ':' + time[2] + ':00';
    var tz = /^([+-])(\d{2}):?(\d{2})$/.exec(tzOffset || '');
    if (tz) iso += tz[1] + tz[2] + ':' + tz[3];
    return new Date(iso).getTime();
  }

  class CountdownBanner extends HTMLElement {
    connectedCallback() {
      this.stop();
      var target = parseTarget(this.dataset.endDate, this.dataset.endTime, this.dataset.tzOffset);
      if (isNaN(target)) { this.hidden = true; return; }
      this.target = target;
      this.showAfterExpired = this.dataset.showAfterExpired === 'true';
      this.units = {
        days: this.querySelector('[data-countdown-days]'),
        hours: this.querySelector('[data-countdown-hours]'),
        minutes: this.querySelector('[data-countdown-minutes]'),
        seconds: this.querySelector('[data-countdown-seconds]')
      };
      this.tick();
    }

    disconnectedCallback() {
      this.stop();
    }

    stop() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }

    render(values) {
      var units = this.units;
      Object.keys(units).forEach(function(key) {
        if (units[key]) units[key].textContent = pad(values[key]);
      });
    }

    tick() {
      var diff = this.target - Date.now();
      if (diff <= 0) {
        this.timer = null;
        this.render({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!this.showAfterExpired) this.hidden = true;
        return;
      }
      this.render({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      });
      this.timer = setTimeout(this.tick.bind(this), (diff % 1000) || 1000);
    }
  }

  customElements.define('countdown-banner', CountdownBanner);
})();
