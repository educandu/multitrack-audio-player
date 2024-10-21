export class Clock {
  #currentTimeout;
  #interval;
  #onTick;

  constructor({ interval = 50, onTick = () => {} }) {
    this.#interval = interval;
    this.#onTick = onTick;
    this.#currentTimeout = null;
  }

  start(tickImmediately = false) {
    if (tickImmediately) {
      this.#onTick();
    }

    if (!this.#currentTimeout) {
      this.#currentTimeout = setTimeout(() => this.#handleTick(), this.#interval);
    }
  }

  stop(tickImmediately = false) {
    if (tickImmediately) {
      this.#onTick();
    }

    if (this.#currentTimeout) {
      clearTimeout(this.#currentTimeout);
      this.#currentTimeout = null;
    }
  }

  #handleTick() {
    this.#onTick();
    this.#currentTimeout = setTimeout(() => this.#handleTick(), this.#interval);
  }

  dispose() {
    this.stop();
  }
}
