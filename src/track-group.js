import { Track } from './track.js';
import { IdGenerator } from './id-generator.js';
import { MediaLoader } from './media-loader.js';
import { AudioContextProvider } from './audio-context-provider.js';
import { DEFAULT_GAIN_PARAMS, TRACK_PLAY_STATE, TRACK_STATE } from './constants.js';

export class TrackGroup {
  // Mandatory fields:
  #trackConfiguration;

  // Optional fields:
  #autoRewind;
  #gainParams;
  #soloTrackIndex;
  #onStateChanged;
  #onPlayStateChanged;

  // Internally assigned fields:
  #id;
  #tracks;
  #state;
  #playState;
  #masterTrack;
  #error;

  constructor({
    trackConfiguration,
    autoRewind = false,
    gainParams = DEFAULT_GAIN_PARAMS,
    idGenerator = new IdGenerator(),
    mediaLoader = new MediaLoader(),
    audioContextProvider = new AudioContextProvider(),
    onStateChanged = () => {},
    onPlayStateChanged = () => {}
  }) {
    this.#id = idGenerator.generateId();
    this.#trackConfiguration = trackConfiguration;
    this.#autoRewind = autoRewind;
    this.#gainParams = gainParams;
    this.#soloTrackIndex = trackConfiguration.soloTrackIndex;
    this.#state = TRACK_STATE.created;
    this.#playState = TRACK_PLAY_STATE.stopped;
    this.#error = null;
    this.#onStateChanged = onStateChanged;
    this.#onPlayStateChanged = onPlayStateChanged;

    this.#tracks = trackConfiguration.tracks.map(config => new Track({
      name: config.name,
      sourceUrl: config.sourceUrl,
      playbackRange: config.playbackRange,
      gainParams: config.gainParams,
      autoRewind: false,
      idGenerator,
      mediaLoader,
      audioContextProvider,
      onStateChanged: () => this.#handleTrackStateChanged(),
      onPlayStateChanged: () => this.#handleTrackPlayStateChanged(),
    }));

    this.#masterTrack = this.#tracks[0] ?? null;

    // This will ensure all tracks have the correct initial gainParams,
    // as we do not set the value when calling the track constructor above:
    this.#applyGainParams();
  }

  get id() {
    return this.#id;
  }

  get error() {
    return this.#error;
  }

  get trackConfiguration() {
    return this.#trackConfiguration;
  }

  get tracks() {
    return this.#tracks;
  }

  get state() {
    return this.#state;
  }

  get playState() {
    return this.#playState;
  }

  get duration() {
    return this.#state === TRACK_STATE.ready
      ? this.#masterTrack?.duration
      : null;
  }

  get position() {
    return this.#masterTrack?.position ?? 0;
  }

  set position(newPosition) {
    for (const track of this.#tracks) {
      track.position = newPosition;
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

  get soloTrackIndex() {
    return this.#soloTrackIndex;
  }

  set soloTrackIndex(newSoloTrackIndex) {
    this.#soloTrackIndex = newSoloTrackIndex;
    this.#applyGainParams();
  }

  #applyGainParams() {
    const masterGain = this.#gainParams.mute ? 0 : this.#gainParams.gain;
    for (let i = 0; i < this.#tracks.length; i += 1) {
      this.#tracks[i].masterGain = this.#soloTrackIndex !== -1 && i !== this.#soloTrackIndex
        ? 0
        : masterGain;
    }
  }

  #handleTrackStateChanged() {
    const allStates = new Set(this.#tracks.map(track => track.state));
    const firstError = this.#tracks.find(track => track.error)?.error ?? null;

    if (allStates.has(TRACK_STATE.disposed)) {
      this.dispose();
    } else if (allStates.has(TRACK_STATE.faulted)) {
      this.#tryChangeState(TRACK_STATE.faulted, firstError);
    } else if (allStates.has(TRACK_STATE.loading)) {
      this.#tryChangeState(TRACK_STATE.loading);
    } else if (allStates.has(TRACK_STATE.created)) {
      this.#tryChangeState(TRACK_STATE.created);
    } else {
      this.#tryChangeState(TRACK_STATE.ready);
    }
  }

  #handleTrackPlayStateChanged() {
    this.#tryChangePlayState(this.#masterTrack.playState);
  }

  #tryChangeState(newState, error = null) {
    if (this.#state !== newState || this.#error !== error) {
      this.#state = newState;
      this.#error = error;
      this.#onStateChanged(newState, error);
    }
  }

  #tryChangePlayState(newPlayState) {
    if (this.#playState !== newPlayState) {
      this.#playState = newPlayState;
      this.#onPlayStateChanged(newPlayState);
    }
  }

  load() {
    return Promise.all(this.#tracks.map(track => track.load()));
  }

  start(position = null) {
    const playFromBeginning
      = this.#playState === TRACK_PLAY_STATE.stopped
      && this.#autoRewind
      && (position ?? this.position) >= this.duration;

    for (const track of this.#tracks) {
      track.start(playFromBeginning ? 0 : position);
    }
  }

  pause() {
    for (const track of this.#tracks) {
      track.pause();
    }
  }

  stop(moveToEnd = false) {
    for (const track of this.#tracks) {
      track.stop(moveToEnd);
    }
  }

  dispose() {
    if (this.#state === TRACK_STATE.disposed) {
      return;
    }

    this.stop();

    for (const track of this.#tracks) {
      track.dispose();
    }

    this.#trackConfiguration = null;
    this.#soloTrackIndex = -1;
    this.#state = TRACK_STATE.disposed;
    this.#playState = TRACK_PLAY_STATE.stopped;
    this.#error = null;
    this.#onStateChanged = null;
    this.#onPlayStateChanged = null;
    this.#masterTrack = null;
  }
}
