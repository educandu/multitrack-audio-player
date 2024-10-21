import PQueue from 'p-queue';
import { DEFAULT_MAX_CONCURRENCY } from './constants.js';

export class GlobalMediaQueue {
  static #mediaSourceQueue = new PQueue({ concurrency: DEFAULT_MAX_CONCURRENCY });
  static #downloadQueue = new PQueue({ concurrency: DEFAULT_MAX_CONCURRENCY });
  static #decodingQueue = new PQueue({ concurrency: DEFAULT_MAX_CONCURRENCY });

  static get maxMediaSourceConcurrency() {
    return GlobalMediaQueue.#mediaSourceQueue.concurrency;
  }

  static set maxMediaSourceConcurrency(newValue) {
    GlobalMediaQueue.#mediaSourceQueue.concurrency = newValue;
  }

  static get maxDownloadConcurrency() {
    return GlobalMediaQueue.#downloadQueue.concurrency;
  }

  static set maxDownloadConcurrency(newValue) {
    GlobalMediaQueue.#downloadQueue.concurrency = newValue;
  }

  static get maxDecodingConcurrency() {
    return GlobalMediaQueue.#decodingQueue.concurrency;
  }

  static set maxDecodingConcurrency(newValue) {
    GlobalMediaQueue.#decodingQueue.concurrency = newValue;
  }

  static downloadAndDecodeMedia({ sourceUrl, mediaDownloader, mediaDecoder, audioContextProvider }) {
    return GlobalMediaQueue.#mediaSourceQueue.add(async () => {
      const arrayBuffer = await GlobalMediaQueue.#downloadQueue.add(() => {
        return mediaDownloader.downloadMedia(sourceUrl);
      });

      const audioContext = await audioContextProvider.waitForAudioContext();

      const audioBuffer = await GlobalMediaQueue.#decodingQueue.add(() => {
        return mediaDecoder.decodeMedia(arrayBuffer, audioContext);
      });

      return audioBuffer;
    });
  }
}
