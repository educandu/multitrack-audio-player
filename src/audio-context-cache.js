import { AudioContext as StandardizedAudioContext } from 'standardized-audio-context';

class ServerAudioContextCache {
  get audioContext() {
    return null;
  }

  subscribe() {}
  unsubscribe() {}
  resume() {}
  dispose() {}
}

class BrowserAudioContextCache {
  #isDisposed;
  #entries;
  #subscribers;
  #audioContext;
  #autoResumeHandler;

  constructor() {
    this.#isDisposed = false;
    this.#entries = new Map();
    this.#subscribers = new Set();
    this.#audioContext = null;
    this.#autoResumeHandler = null;
    this.#setupAutoResume();
  }

  get audioContext() {
    return this.#audioContext;
  }

  subscribe(callback) {
    this.#throwIfDisposed();
    this.#subscribers.add(callback);
  }

  unsubscribe(callback) {
    this.#throwIfDisposed();
    this.#subscribers.delete(callback);
  }

  async resume() {
    this.#throwIfDisposed();
    if (!this.#audioContext) {
      const ctx = new StandardizedAudioContext();
      await ctx.resume();
      this.#audioContext = ctx;
      this.#tearDownAutoResume();

      if (this.#audioContext.state !== 'running') {
        this.#audioContext.close();
        this.#audioContext = null;
        this.#setupAutoResume();
        throw new Error('AudioContext has to be resumed during a user interaction');
      }

      const listener = () => {
        if (this.#audioContext.state !== 'running') {
          this.#audioContext.removeEventListener('statechange', listener);
          this.#audioContext.close();
          this.#audioContext = null;
          this.#setupAutoResume();
          this.#notifySubscribers();
        }
      };

      this.#audioContext.addEventListener('statechange', listener);
      this.#notifySubscribers();
    }
  }

  #notifySubscribers() {
    for (const subscriber of this.#subscribers) {
      subscriber();
    }
  }

  #setupAutoResume() {
    if (!this.#autoResumeHandler) {
      this.#autoResumeHandler = async () => {
        await this.resume();
        this.#tearDownAutoResume();
      };
      window.addEventListener('click', this.#autoResumeHandler);
      window.addEventListener('keydown', this.#autoResumeHandler);
    }
  }

  #tearDownAutoResume() {
    if (this.#autoResumeHandler) {
      window.removeEventListener('click', this.#autoResumeHandler);
      window.removeEventListener('keydown', this.#autoResumeHandler);
      this.#autoResumeHandler = null;
    }
  }

  #throwIfDisposed() {
    if (this.#isDisposed) {
      throw new Error('Cannot use a disposed instance');
    }
  }

  dispose() {
    this.#entries.clear();
    this.#subscribers.clear();
    this.#isDisposed = true;
  }
}

export class AudioContextCache {
  #innerCache;

  constructor() {
    this.#innerCache = typeof window === 'object' && typeof document === 'object' && document.nodeType === 9
      ? new BrowserAudioContextCache()
      : new ServerAudioContextCache();
  }

  get audioContext() {
    return this.#innerCache.audioContext;
  }

  subscribe(callback) {
    return this.#innerCache.subscribe(callback);
  }

  unsubscribe(callback) {
    return this.#innerCache.unsubscribe(callback);
  }

  resume() {
    return this.#innerCache.resume();
  }

  dispose() {
    return this.#innerCache.dispose();
  }

  static #global = null;

  static get global() {
    if (!AudioContextCache.#global) {
      AudioContextCache.#global = new AudioContextCache({ useNativeAudioContext: false });
    }

    return AudioContextCache.#global;
  }
}
