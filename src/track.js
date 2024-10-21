import { IdGenerator } from './id-generator.js';
import { MediaDecoder } from './media-decoder.js';
import { MediaDownloader } from './media-downloader.js';
import { GlobalMediaQueue } from './global-media-queue.js';
import { AudioContextProvider } from './audio-context-provider.js';
import {
  DEFAULT_GAIN_PARAMS,
  DEFAULT_PLAYBACK_RANGE,
  GAIN_DECAY_DURATION,
  TRACK_PLAY_STATE,
  TRACK_STATE
} from './constants.js';

export class Track {
  // Mandatory fields:
  #sourceUrl;

  // Optional fields:
  #playbackRange;
  #gainParams;
  #masterGain;
  #idGenerator;
  #mediaDecoder;
  #mediaDownloader;
  #audioContextProvider;
  #onStateChanged;
  #onPlayStateChanged;

  // Internally assigned fields:
  #id;
  #name;
  #gain;
  #error;
  #sound;
  #buffer;
  #startTime;
  #audioContext;
  #trackDuration;
  #rangeDuration;
  #lastStopPositionInTrack;
  #rangeEndPositionInTrack;
  #rangeStartPositionInTrack;
  #state;
  #playState;

  constructor({
    sourceUrl,
    name = '',
    playbackRange = DEFAULT_PLAYBACK_RANGE,
    gainParams = DEFAULT_GAIN_PARAMS,
    masterGain = 1,
    idGenerator = new IdGenerator(),
    mediaDecoder = new MediaDecoder(),
    mediaDownloader = new MediaDownloader(),
    audioContextProvider = new AudioContextProvider(),
    onStateChanged = () => {},
    onPlayStateChanged = () => {}
  }) {
    this.#sourceUrl = sourceUrl;
    this.#name = name;
    this.#playbackRange = playbackRange;
    this.#gainParams = gainParams;
    this.#masterGain = masterGain;
    this.#idGenerator = idGenerator;
    this.#mediaDecoder = mediaDecoder;
    this.#mediaDownloader = mediaDownloader;
    this.#audioContextProvider = audioContextProvider;
    this.#onStateChanged = onStateChanged;
    this.#onPlayStateChanged = onPlayStateChanged;
    this.#id = this.#idGenerator.generateId(this.#sourceUrl);
    this.#gain = null;
    this.#error = null;
    this.#sound = null;
    this.#buffer = null;
    this.#startTime = null;
    this.#audioContext = null;
    this.#trackDuration = null;
    this.#rangeDuration = null;
    this.#lastStopPositionInTrack = null;
    this.#rangeEndPositionInTrack = null;
    this.#rangeStartPositionInTrack = null;
    this.#state = TRACK_STATE.created;
    this.#playState = TRACK_PLAY_STATE.stopped;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  get error() {
    return this.#error;
  }

  get sourceUrl() {
    return this.#sourceUrl;
  }

  get state() {
    return this.#state;
  }

  get playState() {
    return this.#playState;
  }

  get duration() {
    return this.#rangeDuration;
  }

  get playbackRange() {
    return this.#playbackRange;
  }

  get position() {
    return this.#calculateCurrentPositionInTrack() - (this.#rangeStartPositionInTrack ?? 0);
  }

  set position(newPosition) {
    if (this.#playState === TRACK_PLAY_STATE.started) {
      this.start(newPosition);
    } else {
      const newPositionInTrack = Math.min(this.#trackDuration, newPosition + this.#rangeStartPositionInTrack);
      this.#startTime = this.#audioContext.currentTime - newPositionInTrack;
      this.#lastStopPositionInTrack = newPositionInTrack;
    }
  }

  get gainParams() {
    return this.#gainParams;
  }

  set gainParams(newGainParams) {
    this.#gainParams = newGainParams;
    this.#applyGainParams();
  }

  get masterGain() {
    return this.#masterGain;
  }

  set masterGain(newMasterGain) {
    this.#masterGain = newMasterGain;
    this.#applyGainParams();
  }

  async load() {
    try {
      this.#changeState(TRACK_STATE.loading);
      const buffer = await GlobalMediaQueue.downloadAndDecodeMedia({
        sourceUrl: this.#sourceUrl,
        mediaDecoder: this.#mediaDecoder,
        mediaDownloader: this.#mediaDownloader,
        audioContextProvider: this.#audioContextProvider
      });
      if (this.#state === TRACK_STATE.disposed) {
        return;
      }
      this.#buffer = buffer;
      this.#trackDuration = this.#buffer.duration;
      this.#rangeStartPositionInTrack = this.#playbackRange[0] * this.#trackDuration;
      this.#rangeEndPositionInTrack = this.#playbackRange[1] * this.#trackDuration;
      this.#rangeDuration = this.#rangeEndPositionInTrack - this.#rangeStartPositionInTrack;
      const audioContext = await this.#audioContextProvider.waitForAudioContext();
      if (this.#state === TRACK_STATE.disposed) {
        return;
      }
      this.#audioContext = audioContext;
      this.#changeState(TRACK_STATE.ready);
    } catch (error) {
      if (this.#state !== TRACK_STATE.disposed) {
        this.#changeState(TRACK_STATE.faulted, error);
      }
    }
  }

  start(position = null) {
    if (this.#playState === TRACK_PLAY_STATE.started && position === null) {
      return;
    }

    let startPositionInTrack;
    if (position !== null) {
      startPositionInTrack = position + this.#rangeStartPositionInTrack;
    } else if (this.#lastStopPositionInTrack) {
      startPositionInTrack = this.#lastStopPositionInTrack;
    } else {
      startPositionInTrack = this.#rangeStartPositionInTrack;
    }

    if (startPositionInTrack >= this.#rangeEndPositionInTrack) {
      this.stop(true);
      return;
    }

    if (this.#sound) {
      this.#sound.onended = null;
    }

    if (this.#playState === TRACK_PLAY_STATE.started) {
      this.#sound.stop();
    }

    this.#sound = this.#audioContext.createBufferSource();
    this.#sound.buffer = this.#buffer;
    this.#sound.onended = () => this.#onSoundEnded();

    this.#gain = this.#audioContext.createGain();
    this.#applyGainParams();

    this.#sound.connect(this.#gain);
    this.#gain.connect(this.#audioContext.destination);

    const currentTime = this.#audioContext.currentTime;
    const remainingDurationInRange = this.#rangeEndPositionInTrack - startPositionInTrack;

    this.#lastStopPositionInTrack = null;
    this.#startTime = currentTime - startPositionInTrack;
    this.#sound.start(currentTime, startPositionInTrack, remainingDurationInRange);

    if (this.#playState !== TRACK_PLAY_STATE.started) {
      this.#changePlayState(TRACK_PLAY_STATE.started);
    }
  }

  pause() {
    if (this.#playState !== TRACK_PLAY_STATE.started) {
      return;
    }

    this.#sound.onended = null;
    this.#sound.stop();
    this.#lastStopPositionInTrack = this.#calculateCurrentPositionInTrack();
    this.#startTime = null;

    this.#changePlayState(TRACK_PLAY_STATE.pausing);
  }

  stop(moveToEnd = false) {
    this.#sound.onended = null;
    this.#sound.stop();
    this.#lastStopPositionInTrack = moveToEnd ? this.#rangeEndPositionInTrack : this.#calculateCurrentPositionInTrack();
    this.#startTime = null;

    if (this.#playState !== TRACK_PLAY_STATE.stopped) {
      this.#changePlayState(TRACK_PLAY_STATE.stopped);
    }
  }

  #calculateCurrentPositionInTrack() {
    return this.#playState === TRACK_PLAY_STATE.started
      ? this.#audioContext.currentTime - this.#startTime
      : this.#lastStopPositionInTrack ?? this.#rangeStartPositionInTrack ?? 0;
  }

  #onSoundEnded() {
    this.stop(true);
  }

  #applyGainParams() {
    if (!this.#gain) {
      return;
    }

    const trackValue = this.#gainParams.mute ? 0 : this.#gainParams.gain;
    const actualValue = this.#masterGain * trackValue;
    if (this.#gain.gain.value === actualValue) {
      return;
    }

    if (this.#playState === TRACK_PLAY_STATE.started) {
      // To avoid ugly clicking during playback when adjusting the volume
      // we have to switch to the new volume gradually (sample by sample):
      this.#gain.gain.setTargetAtTime(actualValue, this.#audioContext.currentTime, GAIN_DECAY_DURATION);
    } else {
      this.#gain.gain.value = actualValue;
    }
  }

  #changeState(newState, error = null) {
    this.#state = newState;
    this.#error = error;
    this.#onStateChanged(newState, error);
  }

  #changePlayState(newPlayState) {
    this.#playState = newPlayState;
    this.#onPlayStateChanged(newPlayState);
  }

  dispose() {
    if (this.#state === TRACK_STATE.disposed) {
      return;
    }

    if (this.#sound) {
      this.#sound.onended = null;
      this.#sound.stop();
    }

    this.#gain = null;
    this.#error = null;
    this.#sound = null;
    this.#buffer = null;
    this.#audioContext = null;
    this.#trackDuration = null;
    this.#startTime = null;
    this.#lastStopPositionInTrack = null;
    this.#state = TRACK_STATE.disposed;
    this.#playState = TRACK_PLAY_STATE.stopped;
    this.#idGenerator = null;
    this.#mediaDecoder = null;
    this.#mediaDownloader = null;
    this.#audioContextProvider = null;
    this.#onStateChanged = null;
    this.#onPlayStateChanged = null;
  }
}
