import { AudioContextCache, Track } from '../../src/index.js';

const EXAMPLE_MEDIA_URL = 'https://cdn.openmusic.academy/media-library/oma-hkm-00-tutti-uhZ6Reh4ttWXcKKigyXzBa.mp3';

let track = null;

const getElementsByDataAttribute = attributeName => {
  return Object.fromEntries(
    [...window.document.querySelectorAll(`[${ attributeName }]`)].map(element => {
      return [element.getAttribute(attributeName), element];
    })
  );
};

const labels = getElementsByDataAttribute('data-label');
const inputs = getElementsByDataAttribute('data-input');

const actionHandlers = {
  'track-create': () => {
    track?.dispose();
    track = null;
    track = new Track({ mediaUrl: EXAMPLE_MEDIA_URL, playbackRange: [0.25, 0.75] });
  },
  'track-load': () => {
    track?.load();
  },
  'track-start': () => {
    track?.start();
  },
  'track-pause': () => {
    track?.pause();
  },
  'track-stop': () => {
    track?.stop();
  }
};

const inputHandlers = {
  'track-position': event => {
    if (track && track.duration) {
      track.position = Number(event.target.value) * (track.duration ?? 0);
    }
  },
  'track-autoRewind': event => {
    if (track) {
      track.autoRewind = event.target.checked;
    }
  },
  'track-gainParams-gain': event => {
    if (track) {
      track.gainParams = { ...track.gainParams, gain: Number(event.target.value) };
    }
  },
  'track-gainParams-solo': event => {
    if (track) {
      track.gainParams = { ...track.gainParams, solo: event.target.checked };
    }
  },
  'track-gainParams-mute': event => {
    if (track) {
      track.gainParams = { ...track.gainParams, mute: event.target.checked };
    }
  }
};

function updateUI() {
  labels['audioContext-state'].innerText = AudioContextCache.global.audioContext?.state ?? '';
  labels['track-id'].innerText = track?.id ?? '';
  labels['track-error'].innerText = track?.error?.toString() ?? '';
  labels['track-media-url'].innerText = track?.mediaUrl ?? '';
  labels['track-state'].innerText = track?.state ?? '';
  labels['track-play-state'].innerText = track?.playState ?? '';
  labels['track-duration'].innerText = track?.duration ?? '';
  labels['track-position'].innerText = track?.position ?? '';
  labels['track-gainParams'].innerText = track?.gainParams ? JSON.stringify(track.gainParams) : '';

  if (inputs['track-gainParams-gain'] !== document.activeElement) {
    inputs['track-gainParams-gain'].value = track?.gainParams?.gain ?? 1;
  }

  if (inputs['track-position'] !== document.activeElement) {
    inputs['track-position'].value = (track?.position ?? 0) / (track?.duration ?? 1);
  }

  inputs['track-autoRewind'].checked = track?.autoRewind ?? false;
  inputs['track-gainParams-solo'].checked = track?.gainParams.solo ?? false;
  inputs['track-gainParams-mute'].checked = track?.gainParams.mute ?? false;
}

window.document.addEventListener('click', event => {
  actionHandlers[event.target.getAttribute('data-action')]?.(event);
});

window.document.addEventListener('change', event => {
  inputHandlers[event.target.getAttribute('data-input')]?.(event);
});

window.setInterval(updateUI, 100);
