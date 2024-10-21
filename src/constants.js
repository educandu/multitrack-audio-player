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

export const GAIN_DECAY_DURATION = 0.015;

export const DEFAULT_MAX_CONCURRENCY = 2;

export const DEFAULT_PLAYBACK_RANGE = [0, 1];

export const DEFAULT_GAIN_PARAMS = { gain: 1, mute: false };

export const IS_BROWSER = typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
