import PQueue from 'p-queue';
import { AudioContextProvider } from './audio-context-provider.js';

const MAX_CONCURRENCY = 2;

export class MediaLoader {
  #queue;
  #audioContextProvider;

  constructor(audioContextProvider = new AudioContextProvider()) {
    this.#audioContextProvider = audioContextProvider;
    this.#queue = new PQueue({ concurrency: MAX_CONCURRENCY });
  }

  async #loadArrayBuffer(sourceUrl) {
    const response = await fetch(sourceUrl);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  #decodeArrayBuffer(arrayBuffer, audioContext) {
    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(
        arrayBuffer,
        buffer => resolve(buffer),
        error => reject(error)
      );
    });
  }

  loadMedia(sourceUrl) {
    return this.#queue.add(async () => {
      const arrayBuffer = await this.#loadArrayBuffer(sourceUrl);
      const audioContext = await this.#audioContextProvider.waitForAudioContext();
      const audioBuffer = await this.#decodeArrayBuffer(arrayBuffer, audioContext);
      return audioBuffer;
    });
  }
}
