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
  constructor() {
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
    this._audioContext = null;
    this._autoResumeHandler = null;
    this._setupAutoResume();
  }

  get audioContext() {
    return this._audioContext;
  }

  subscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.delete(callback);
  }

  async resume() {
    this._throwIfDisposed();
    if (!this._audioContext) {
      const ctx = new StandardizedAudioContext();
      await ctx.resume();
      this._audioContext = ctx;
      this._tearDownAutoResume();

      if (this._audioContext.state !== 'running') {
        this._audioContext.close();
        this._audioContext = null;
        this._setupAutoResume();
        throw new Error('AudioContext has to be resumed during a user interaction');
      }

      const listener = () => {
        if (this._audioContext.state !== 'running') {
          this._audioContext.removeEventListener('statechange', listener);
          this._audioContext.close();
          this._audioContext = null;
          this._setupAutoResume();
          this._notifySubscribers();
        }
      };

      this._audioContext.addEventListener('statechange', listener);
      this._notifySubscribers();
    }
  }

  _notifySubscribers() {
    for (const subscriber of this._subscribers) {
      subscriber();
    }
  }

  _setupAutoResume() {
    if (!this._autoResumeHandler) {
      this._autoResumeHandler = async () => {
        await this.resume();
        this._tearDownAutoResume();
      };
      window.addEventListener('click', this._autoResumeHandler);
      window.addEventListener('keydown', this._autoResumeHandler);
    }
  }

  _tearDownAutoResume() {
    if (this._autoResumeHandler) {
      window.removeEventListener('click', this._autoResumeHandler);
      window.removeEventListener('keydown', this._autoResumeHandler);
      this._autoResumeHandler = null;
    }
  }

  _throwIfDisposed() {
    if (this._isDisposed) {
      throw new Error('Cannot use a disposed instance');
    }
  }

  dispose() {
    this._entries.clear();
    this._subscribers.clear();
    this._isDisposed = true;
  }
}

export class AudioContextCache {
  constructor() {
    this._innerCache = typeof window === 'object' && typeof document === 'object' && document.nodeType === 9
      ? new BrowserAudioContextCache()
      : new ServerAudioContextCache();
  }

  get audioContext() {
    return this._innerCache._audioContext;
  }

  subscribe(callback) {
    return this._innerCache.subscribe(callback);
  }

  unsubscribe(callback) {
    return this._innerCache.unsubscribe(callback);
  }

  resume() {
    return this._innerCache.resume();
  }

  dispose() {
    return this._innerCache.dispose();
  }

  static _global = null;

  static get global() {
    if (!AudioContextCache._global) {
      AudioContextCache._global = new AudioContextCache({ useNativeAudioContext: false });
    }

    return AudioContextCache._global;
  }
}
