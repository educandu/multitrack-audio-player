import { AudioContextProvider } from './audio-context-provider.js';

export class MediaLoader {
  #audioContextProvider;

  constructor(audioContextProvider = new AudioContextProvider()) {
    this.#audioContextProvider = audioContextProvider;
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

  async loadMedia(sourceUrl) {
    const arrayBuffer = await this._loadArrayBuffer(sourceUrl);
    const audioContext = await this.#audioContextProvider.waitForAudioContext();
    const audioBuffer = await this._decodeArrayBuffer(arrayBuffer, audioContext);
    return audioBuffer;
  }
}
