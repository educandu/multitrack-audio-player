import { AudioContextCache } from './audio-context-cache.js';

export class AudioContextProvider {
  waitForAudioContext() {
    const globalCache = AudioContextCache.global;
    if (globalCache.audioContext) {
      return Promise.resolve(globalCache.audioContext);
    }

    return new Promise(resolve => {
      const handler = () => {
        if (globalCache.audioContext) {
          globalCache.unsubscribe(handler);
          resolve(globalCache.audioContext);
        }
      };
      globalCache.subscribe(handler);
    });
  }
}
