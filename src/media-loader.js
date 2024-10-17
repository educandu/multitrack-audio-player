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

  _loadArrayBuffer(sourceUrl) {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', sourceUrl, true);
      xhr.responseType = 'arraybuffer';
      xhr.onreadystatechange = () => {
        if (xhr.readyState === xhr.DONE) {
          resolve(xhr.response);
        }
      };
      xhr.send();
    });
  }

  _decodeArrayBuffer(arrayBuffer, audioContext) {
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
      const arrayBuffer = await this._loadArrayBuffer(sourceUrl);
      const audioContext = await this.#audioContextProvider.waitForAudioContext();
      const audioBuffer = await this._decodeArrayBuffer(arrayBuffer, audioContext);
      return audioBuffer;
    });
  }
}
