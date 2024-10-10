export class MediaLoader {
  constructor({ audioContext }) {
    this._audioContext = audioContext;
  }

  _loadArrayBuffer(mediaUrl) {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', mediaUrl, true);
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

  async loadMedia(mediaUrl) {
    const arrayBuffer = await this._loadArrayBuffer(mediaUrl);
    const audioBuffer = await this._decodeArrayBuffer(arrayBuffer, this._audioContext);
    return audioBuffer;
  }
}
