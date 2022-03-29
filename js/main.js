class Controller {
  constructor() {
    this._starting = false;
    this._started = false;
    this._paused = false;
    this._pauseChanging = false;
    this._staleTimer = null;
    this._staleTimerDuration = 5000; // 5 seconds
    this._onStaleTimeoutBind = this._onStaleTimeout.bind(this);
    this._beatTimer = null;
    this._heartRateMonitor = null;
    this._heartRate = 60;
    this._onBeatTimeoutBind = this._onBeatTimeout.bind(this);
    this._heartElement = document.querySelector('.heart');
    this._heartIconElement = this._heartElement.querySelector('.heart-icon');
    this._heartRateTextElements = this._heartElement.querySelectorAll('#heart-rate-text-container .heart-rate-value-text');
    this._heartRateTextContainerElement = this._heartElement.querySelector('#heart-rate-text-container');
    this._heartStartTextContainerElement = document.querySelector('#heart-start-text-container');
    this._heartConnectingTextContainerElement = document.querySelector('#heart-connecting-text-container');
    this._heartPausedTextContainerElement = document.querySelector('#heart-paused-text-container');
  }

  prepare() {
    const button = document.querySelector('.heart');
    button.addEventListener('mousedown', this._onStartMouseDown.bind(this));
    button.addEventListener('click', this._onStartClick.bind(this));
  }

  _onStartMouseDown(e) {
    e.preventDefault();
  }

  _onStartClick(e) {
    e.preventDefault();
    if (this._starting) { return; }
    if (!this._started) {
      this._start();
    } else if (!this._pauseChanging) {
      this._setPaused(!this._paused);
    }
  }

  _onHeartRateChanged(value) {
    const {heartRate} = value;
    this._heartRate = heartRate;
    const heartRateString = `${heartRate}`;
    this._heartRateTextContainerElement.hidden = false;
    this._heartElement.style.setProperty('--heart-rate', heartRateString);
    this._heartElement.dataset.state = 'active';
    this._heartElement.dataset.animate = 'true';
    for (const element of this._heartRateTextElements) {
      element.textContent = heartRateString;
    }
    if (this._staleTimer !== null) {
      clearTimeout(this._staleTimer);
    }
    this._staleTimer = setTimeout(this._onStaleTimeoutBind, this._staleTimerDuration);
    this._startBeatTimer();
  }

  _onStaleTimeout() {
    this._staleTimer = null;
    this._heartElement.dataset.state = 'stale';
    this._heartElement.dataset.animate = 'false';
    if (this._beatTimer !== null) {
      clearTimeout(this._beatTimer);
      this._beatTimer = null;
    }
  }

  _onBeatTimeout() {
    this._beatTimer = null;
    this._heartIconElement.style.animationName = 'none';
    const computedStyle = getComputedStyle(this._heartIconElement);
    void computedStyle.animationName; // Force animation update by reading property
    this._heartIconElement.style.animationName = '';
    this._startBeatTimer();
  }

  async _start() {
    try {
      this._starting = true;
      this._heartConnectingTextContainerElement.hidden = false;
      this._heartStartTextContainerElement.hidden = true;
      this._heartRateMonitor = new HeartRateMonitor(this._onHeartRateChanged.bind(this));
      await this._heartRateMonitor.connect();
      const location = await this._heartRateMonitor.getBodySensorLocation();
      this._heartElement.dataset.location = location;
      await this._heartRateMonitor.start();
      this._started = true;
    } catch (e) {
      if (this._heartRateMonitor !== null) {
        this._heartRateMonitor.disconnect();
        this._heartRateMonitor = null;
      }
      this._heartStartTextContainerElement.hidden = false;
      console.error(e);
    } finally {
      this._heartConnectingTextContainerElement.hidden = true;
      this._starting = false;
    }
  }

  async _setPaused(value) {
    try {
      this._pauseChanging = true;
      if (this._paused === value) { return; }
      this._paused = value;
      this._heartPausedTextContainerElement.hidden = !value;
      if (value) {
        this._heartRateTextContainerElement.hidden = true;
        this._heartElement.dataset.state = 'paused';
        this._heartElement.dataset.animate = 'false';
        this._heartRateMonitor.stop();
        if (this._staleTimer !== null) {
          clearTimeout(this._staleTimer);
          this._staleTimer = null;
        }
        if (this._beatTimer !== null) {
          clearTimeout(this._beatTimer);
          this._beatTimer = null;
        }
      } else {
        this._heartElement.dataset.state = 'stale';
        await this._heartRateMonitor.start();
      }
    } finally {
      this._pauseChanging = false;
    }
  }

  _startBeatTimer() {
    if (this._beatTimer !== null || this._staleTimer === null) { return; }
    this._beatTimer = setTimeout(this._onBeatTimeoutBind, 60 / Math.max(30, Math.min(240, this._heartRate)) * 1000);
  }
}

(() => {
  const {hash} = location;
  if (hash.startsWith('#!')) {
    const params = new URLSearchParams(hash.substring(2));
    const css = params.get('css');
    if (css !== null) {
      const style = document.createElement('style');
      style.id = "custom-css";
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new Controller().prepare();
  });
})();
