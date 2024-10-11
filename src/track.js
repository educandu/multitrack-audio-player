import { IdGenerator } from './id-generator.js';
import { MediaLoader } from './media-loader.js';
import { AudioContextProvider } from './audio-context-provider.js';

export const TRACK_STATE = {
  created: 'created',
  loading: 'loading',
  ready: 'ready',
  faulted: 'faulted',
  disposed: 'disposed'
};

export const TRACK_PLAY_STATE = {
  started: 'started',
  pausing: 'pausing',
  stopped: 'stopped'
};

const GAIN_DECAY_DURATION = 0.015;
const DEFAULT_PLAYBACK_RANGE = [0, 1];
const DEFAULT_GAIN_PARAMS = { gain: 1, solo: false, mute: false };

export class Track {
  // Mandatory fields:
  #mediaUrl;

  // Optional fields:
  #playbackRange;
  #gainParams;
  #autoRewind;
  #idGenerator;
  #mediaLoader;
  #audioContextProvider;
  #onStateChanged;
  #onPlayStateChanged;

  // Internally assigned fields:
  #id;
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
    mediaUrl,
    playbackRange = DEFAULT_PLAYBACK_RANGE,
    gainParams = DEFAULT_GAIN_PARAMS,
    autoRewind = false,
    idGenerator = new IdGenerator(),
    mediaLoader = new MediaLoader(),
    audioContextProvider = new AudioContextProvider(),
    onStateChanged = () => {},
    onPlayStateChanged = () => {}
  }) {
    this.#mediaUrl = mediaUrl;
    this.#playbackRange = playbackRange;
    this.#gainParams = gainParams;
    this.#autoRewind = autoRewind;
    this.#idGenerator = idGenerator;
    this.#mediaLoader = mediaLoader;
    this.#audioContextProvider = audioContextProvider;
    this.#onStateChanged = onStateChanged;
    this.#onPlayStateChanged = onPlayStateChanged;
    this.#id = this.#idGenerator.generateId(this.#mediaUrl);
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

  get error() {
    return this.#error;
  }

  get mediaUrl() {
    return this.#mediaUrl;
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
      const newPositionInTrack = newPosition + this.#rangeStartPositionInTrack;
      this.#startTime = this.#audioContext.currentTime - newPositionInTrack;
      this.#lastStopPositionInTrack = newPositionInTrack;
    }
  }

  get autoRewind() {
    return this.#autoRewind;
  }

  set autoRewind(newAutoRewind) {
    this.#autoRewind = newAutoRewind;
  }

  get gainParams() {
    return this.#gainParams;
  }

  set gainParams(newGainParams) {
    this.#gainParams = newGainParams;
    this.#applyGainParams();
  }

  async load() {
    try {
      this.#changeState(TRACK_STATE.loading);
      this.#buffer = await this.#mediaLoader.loadMedia(this.#mediaUrl);
      this.#trackDuration = this.#buffer.duration;
      this.#rangeStartPositionInTrack = this.#playbackRange[0] * this.#trackDuration;
      this.#rangeEndPositionInTrack = this.#playbackRange[1] * this.#trackDuration;
      this.#rangeDuration = this.#rangeEndPositionInTrack - this.#rangeStartPositionInTrack;
      this.#audioContext = await this.#audioContextProvider.waitForAudioContext();
      this.#changeState(TRACK_STATE.ready);
    } catch (error) {
      this.#changeState(TRACK_STATE.faulted, error);
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
      if (this.#autoRewind) {
        startPositionInTrack = this.#rangeStartPositionInTrack;
      } else {
        return;
      }
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

    this.#changePlayState(TRACK_PLAY_STATE.started);
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
    if (this.#playState === TRACK_PLAY_STATE.stopped) {
      return;
    }

    this.#sound.onended = null;
    this.#sound.stop();
    this.#lastStopPositionInTrack = moveToEnd ? this.#rangeEndPositionInTrack : this.#calculateCurrentPositionInTrack();
    this.#startTime = null;

    this.#changePlayState(TRACK_PLAY_STATE.stopped);
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

    const newValue = this.#gainParams.mute ? 0 : this.#gainParams.gain;
    if (this.#gain.gain.value === newValue) {
      return;
    }

    if (this.#playState === TRACK_PLAY_STATE.started) {
      // To avoid ugly clicking during playback when adjusting the volume
      // we have to switch to the new volume gradually (sample by sample):
      this.#gain.gain.setTargetAtTime(newValue, this.#audioContext.currentTime, GAIN_DECAY_DURATION);
    } else {
      this.#gain.gain.value = newValue;
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
    this.stop();

    this.#gain = null;
    this.#error = null;
    this.#sound = null;
    this.#buffer = null;
    this.#trackDuration = null;
    this.#startTime = null;
    this.#lastStopPositionInTrack = null;
    this.#state = TRACK_STATE.disposed;
    this.#playState = TRACK_PLAY_STATE.stopped;
    this.#idGenerator = null;
    this.#mediaLoader = null;
    this.#audioContext = null;
    this.#onStateChanged = null;
    this.#onPlayStateChanged = null;
  }
}
