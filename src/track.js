import { IdProvider } from './id-provider.js';
import { MediaLoader } from './media-loader.js';

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

export class Track {
  constructor({ mediaUrl, audioContext, mediaLoader, idProvider, autoReplay, onStateChanged, onPlayStateChanged }) {
    // Mandatory fields:
    this._mediaUrl = mediaUrl;
    this._audioContext = audioContext;

    // Optional fields:
    this._autoReplay = autoReplay ?? false;
    this._onStateChanged = onStateChanged ?? (() => {});
    this._onPlayStateChanged = onPlayStateChanged ?? (() => {});
    this._idProvider = idProvider ?? new IdProvider();
    this._mediaLoader = mediaLoader ?? new MediaLoader({ audioContext });

    // Internally assigned fields:
    this._id = this._idProvider.createId(this._mediaUrl);
    this._error = null;
    this._sound = null;
    this._buffer = null;
    this._duration = null;
    this._startTime = null;
    this._pauseOrStopPosition = null;
    this._state = TRACK_STATE.created;
    this._playState = TRACK_PLAY_STATE.stopped;
  }

  get id() {
    return this._id;
  }

  get error() {
    return this._error;
  }

  get mediaUrl() {
    return this._mediaUrl;
  }

  get state() {
    return this._state;
  }

  get playState() {
    return this._playState;
  }

  get duration() {
    return this._duration;
  }

  get position() {
    return this._calculateCurrentPosition();
  }

  set position(newPosition) {
    if (this._playState === TRACK_PLAY_STATE.started) {
      this.start(newPosition, true);
    } else {
      this._startTime = this._audioContext.currentTime - newPosition;
      this._pauseOrStopPosition = newPosition;
    }
  }

  get autoReplay() {
    return this._autoReplay;
  }

  set autoReplay(newAutoReplay) {
    this._autoReplay = newAutoReplay;
  }

  async load() {
    try {
      this._changeState(TRACK_STATE.loading);
      this._buffer = await this._mediaLoader.loadMedia(this._mediaUrl);
      this._duration = this._buffer.duration;
      this._changeState(TRACK_STATE.ready);
    } catch (error) {
      this._changeState(TRACK_STATE.faulted, error);
    }
  }

  start(position = null, forceRestart = false) {
    if (this._playState === TRACK_PLAY_STATE.started && !forceRestart) {
      return;
    }

    let startPosition = position ?? this._pauseOrStopPosition ?? 0;
    if (startPosition >= this._duration) {
      if (this._autoReplay) {
        startPosition = 0;
      } else {
        return;
      }
    }

    if (this._sound) {
      this._sound.onended = null;
    }

    if (this._playState === TRACK_PLAY_STATE.started) {
      this._sound.stop();
    }

    this._sound = new AudioBufferSourceNode(this._audioContext, { buffer: this._buffer });
    this._sound.onended = () => this._onSoundEnded();
    this._sound.connect(this._audioContext.destination);

    this._position = startPosition;
    this._startTime = this._audioContext.currentTime - this._position;
    this._sound.start(this._audioContext.currentTime, this._position);

    this._changePlayState(TRACK_PLAY_STATE.started);
    this._pauseOrStopPosition = null;
  }

  pause() {
    if (this._playState !== TRACK_PLAY_STATE.started) {
      return;
    }

    this._sound.onended = null;
    this._sound.stop();
    this._pauseOrStopPosition = this._audioContext.currentTime - this._startTime;
    this._changePlayState(TRACK_PLAY_STATE.pausing);
  }

  stop(moveToEnd = false) {
    if (this._playState === TRACK_PLAY_STATE.stopped) {
      return;
    }

    this._sound.onended = null;
    this._sound.stop();
    this._pauseOrStopPosition = moveToEnd
      ? this._duration
      : this._audioContext.currentTime - this._startTime;
    this._changePlayState(TRACK_PLAY_STATE.stopped);
  }

  _calculateCurrentPosition() {
    return this._playState === TRACK_PLAY_STATE.started
      ? this._audioContext.currentTime - this._startTime
      : this._pauseOrStopPosition ?? 0;
  }

  _onSoundEnded() {
    this.stop(true);
  }

  _changeState(newState, error = null) {
    this._state = newState;
    this._error = error;
    this._onStateChanged(newState, error);
  }
  _changePlayState(newPlayState) {
    this._playState = newPlayState;
    this._onPlayStateChanged(newPlayState);
  }

  dispose() {
    this.stop();

    this._error = null;
    this._sound = null;
    this._buffer = null;
    this._duration = null;
    this._startTime = null;
    this._pauseOrStopPosition = null;
    this._state = TRACK_STATE.disposed;
    this._playState = TRACK_PLAY_STATE.stopped;
    this._idProvider = null;
    this._mediaLoader = null;
    this._audioContext = null;
    this._onStateChanged = null;
    this._onPlayStateChanged = null;
  }
}