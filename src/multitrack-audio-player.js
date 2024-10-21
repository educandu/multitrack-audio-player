import { Clock } from './clock.js';
import { TrackGroup } from './track-group.js';
import { IdGenerator } from './id-generator.js';
import { MediaDecoder } from './media-decoder.js';
import { MediaDownloader } from './media-downloader.js';
import { AudioContextProvider } from './audio-context-provider.js';
import { DEFAULT_GAIN_PARAMS, IS_BROWSER, TRACK_PLAY_STATE, TRACK_STATE } from './constants.js';

export class MultitrackAudioPlayer {
  #id;
  #clock;
  #trackGroup;
  #onStateChanged;
  #onPositionChanged;
  #onPlayStateChanged;
  #lastReportedPosition;

  constructor({
    trackConfiguration,
    autoLoad = false,
    autoRewind = false,
    gainParams = DEFAULT_GAIN_PARAMS,
    idGenerator = new IdGenerator(),
    mediaDecoder = new MediaDecoder(),
    mediaDownloader = new MediaDownloader(),
    audioContextProvider = new AudioContextProvider(),
    onStateChanged = () => {},
    onPlayStateChanged = () => {},
    onPositionChanged = () => {}
  }) {
    this.#id = idGenerator.generateId();
    this.#clock = new Clock({ onTick: () => this.#handleClockTick() });
    this.#onStateChanged = onStateChanged;
    this.#onPlayStateChanged = onPlayStateChanged;
    this.#onPositionChanged = onPositionChanged;

    this.#trackGroup = new TrackGroup({
      trackConfiguration,
      autoRewind,
      gainParams,
      idGenerator,
      mediaDecoder,
      mediaDownloader,
      audioContextProvider,
      onStateChanged: (newState, error) => this.#handleTrackGroupStateChanged(newState, error),
      onPlayStateChanged: newPlayState => this.#handleTrackGroupPlayStateChanged(newPlayState)
    });

    this.#lastReportedPosition = this.#trackGroup.position;

    if (autoLoad && IS_BROWSER) {
      this.load();
    }
  }

  get id() {
    return this.#id;
  }

  get error() {
    return this.#trackGroup.error;
  }

  get trackConfiguration() {
    return this.#trackGroup.trackConfiguration;
  }

  get tracks() {
    return this.#trackGroup.tracks;
  }

  get state() {
    return this.#trackGroup.state;
  }

  get playState() {
    return this.#trackGroup.playState;
  }

  get duration() {
    return this.#trackGroup.duration;
  }

  get position() {
    return this.#trackGroup.position;
  }

  set position(newPosition) {
    this.#trackGroup.position = newPosition;
    this.#reportPosition();
  }

  get autoRewind() {
    return this.#trackGroup.autoRewind;
  }

  set autoRewind(newAutoRewind) {
    this.#trackGroup.autoRewind = newAutoRewind;
  }

  get gainParams() {
    return this.#trackGroup.gainParams;
  }

  set gainParams(newGainParams) {
    this.#trackGroup.gainParams = newGainParams;
  }

  get soloTrackIndex() {
    return this.#trackGroup.soloTrackIndex;
  }

  set soloTrackIndex(newSoloTrackIndex) {
    this.#trackGroup.soloTrackIndex = newSoloTrackIndex;
  }

  #handleClockTick() {
    this.#reportPosition();
  }

  #handleTrackGroupStateChanged(newState, error) {
    if (newState === TRACK_STATE.faulted) {
      this.#clock.stop();
    }

    this.#onStateChanged(newState, error);
  }

  #handleTrackGroupPlayStateChanged(newPlayState) {
    if (newPlayState === TRACK_PLAY_STATE.started) {
      this.#clock.start(true);
    } else {
      this.#clock.stop(true);
    }

    this.#onPlayStateChanged(newPlayState);
  }

  #reportPosition() {
    const newPosition = this.#trackGroup.position;
    if (newPosition !== this.#lastReportedPosition) {
      this.#lastReportedPosition = newPosition;
      this.#onPositionChanged(newPosition);
    }
  }

  load() {
    return this.#trackGroup.load();
  }

  start() {
    this.#trackGroup.start();
    this.#clock.start(true);
  }

  pause() {
    this.#trackGroup.pause();
    this.#clock.stop(true);
  }

  stop() {
    this.#trackGroup.stop();
    this.#clock.stop(true);
  }

  dispose() {
    this.#clock.dispose();
    this.#trackGroup.dispose();
    this.#lastReportedPosition = 0;
  }
}
