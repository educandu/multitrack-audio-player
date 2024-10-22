# multitrack-audio-player

[![codecov](https://codecov.io/gh/educandu/multitrack-audio-player/branch/main/graph/badge.svg)](https://codecov.io/gh/educandu/multitrack-audio-player)

A multitrack audio player using the Web Audio API

## Prerequisites

* node.js ^20.0.0
* optional: globally installed gulp: `npm i -g gulp-cli`

The output of this repository is an npm package (`@educandu/multitrack-audio-player`).

## Installation

~~~
$ yarn add @educandu/multitrack-audio-player
~~~

## Usage

~~~js
import { MultitrackAudioPlayer, TrackGroup, Track, ... } from '@educandu/multitrack-audio-player';
~~~

### Low level API

#### Track

The `Track` class is the main building block of this library and represents a single playable
audio file.

~~~js
// Minimal example for creating a new track:
const track = new Track({ sourceUrl: 'https://somedomain.com/some-sound.mp3' });

// Full example for creating a new track:
const track = new Track({
  // Mandatory, has to be a valid URL:
  sourceUrl: 'https://somedomain.com/some-sound.mp3',
  // Optional, has to be an array of two floats between 0 and 1 that indicate
  // the range withing the media file that should be played (0 means the first sample,
  // 1 means the last sample of the sound file). Default: [0, 1]
  playbackRange = [0.25, 0.75],
  // Optional, has to be an object with two fields:
  // * `gain` (float between 0 and 1) that stands for the volume between 0% and 100%.
  // * `mute` (boolean), if set to `true`, playback of this track will be muted.
  // Default: { gain: 1, mute: false }
  gainParams = { gain: 0.5, mute: false },
  // Optional, will be used as a factor when calculating the actual gain of the track.
  masterGain = 1,
  // Optional, can be used to associate custom data with individual tracks. Default: {}
  customProps: { key: 'some-key', name: 'My track', usage: 'internal' },
  // Optional, will be used to decode the audio file, can be replaced
  // by a custom implementation.
  mediaDecoder = new MediaDecoder(),
  // Optional, will be used to download the audio file, can be replaced
  // by a custom implementation.
  mediaDownloader = new MediaDownloader(),
  // Optional, will be used to retrieve an `AudioContext` that is ready to be used,
  // can be replaced by a custom implementation.
  audioContextProvider = new AudioContextProvider(),
  // Optional, will be called each time the track's `state` property has changed.
  onStateChanged = (state, error) => { console.log(error ?? state); },
  // Optional, will be called each time the track's `playState` property has changed.
  onPlayStateChanged = playState => { console.log(playState); }
});

// Methods:
track.load(); // Downloads and decodes the media file. Has to be called before any playback.
track.start(); // Starts at the current position, if not already playing.
track.start(5.5); // Starts the track 5.5 seconds into the media.
track.pause(); // Pauses the track at the current position.
track.stop(); // Stops the track at the current position, equivalent to calling `track.pause()`.
track.stop(true); // Stops the track and moves to the very end of the media.
track.dispose(); // Disposes this instance, no further calls should be made after this.

// Read-only properties:
console.log(track.customProps); // Any custom data associated with this track.
console.log(track.error); // The error in case the state of this track is 'faulted'.
console.log(track.sourceUrl); // The url of the loaded sound file.
console.log(track.state); // The track state.
console.log(track.playState); // The track's play state.
console.log(track.duration); // The track's duration as a float in seconds.
console.log(track.playbackRange); // The track's playback range.

// Read-write properties:
track.position = 3.75; // Sets the track's current playback position.
track.gainParams = { gain: 0.5, mute: false }; // Sets the track's gain params.
track.masterGain = 1; // Sets the track's master gain.

// Example for reading the current time code:
setInterval(() => console.log(track.position), 100);

// Example for changing the volume to 50%:
track.gainParams = { ...track.gainParams, gain: 0.5 };
~~~

#### TrackGroup

The `TrackGroup` class wraps a collection of tracks while providing an API (mostly) identical
to a single track. It manages state, play state and volume coordination between the tracks,
including solo state. It also adds an option for automatic rewinding.

~~~js
// Example for creating a new track group:
const trackGroup = new TrackGroup({
  // Mandatory, the track configuration
  trackConfiguration: {
    // Tracks with their initial configuration
    tracks: [
      {
        sourceUrl: 'https://somedomain.com/some-sound.mp3',
        playbackRange: [0, 1],
        gainParams: { gain: 0.5, mute: false },
        customProps: { name: 'First track' }
      },
      {
        sourceUrl: 'https://somedomain.com/some-other-sound.mp3',
        playbackRange: [0, 1],
        gainParams: { gain: 0.75, mute: false },
        customProps: { name: 'Second track' }
      },
    ],
    // Determines, which track should play solo initially (-1 for none)
    soloTrackIndex: -1
  },
  // Optional, will automatically start from the beginning, when `start` is called
  // after the track has been played previously unto the very end. Default: false
  autoRewind: true,
  // Optional, has to be an object with two fields:
  // * `gain` (float between 0 and 1) that stands for the volume between 0% and 100%.
  // * `mute` (boolean), if set to `true`, playback of this track will be muted.
  // Default: { gain: 1, mute: false }
  gainParams = { gain: 0.5, mute: false },
  // Optional, will be used to decode the audio file, can be replaced
  // by a custom implementation.
  mediaDecoder = new MediaDecoder(),
  // Optional, will be used to download the audio file, can be replaced
  // by a custom implementation.
  mediaDownloader = new MediaDownloader(),
  // Optional, will be used to retrieve an `AudioContext` that is ready to be used,
  // can be replaced by a custom implementation.
  audioContextProvider = new AudioContextProvider(),
  // Optional, will be called each time the track group's `state` property has changed.
  onStateChanged = (state, error) => { console.log(error ?? state); },
  // Optional, will be called each time the track group's `playState` property has changed.
  onPlayStateChanged = playState => { console.log(playState); }
});

// Example for changing the volume to 50% in the second track:
trackGroup.tracks[1].gainParams = { ...track.gainParams, gain: 0.5 };

// Example for setting the second track as the solo track:
trackGroup.soloTrackIndex = 1;
~~~

### High level API

#### MultitrackAudioPlayer

The `MultitrackAudioPlayer` class wraps a `TrackGroup` and adds a clock with change notifications
on the current playback position as well as an option for automatic loading on top.
In most cases this is the API that should be used by consumers of this library.

~~~js
// Example for creating a new player:
const player = new MultitrackAudioPlayer({
  // Mandatory, the track configuration
  trackConfiguration: {
    // Tracks with their initial configuration
    tracks: [
      {
        sourceUrl: 'https://somedomain.com/some-sound.mp3',
        playbackRange: [0, 1],
        gainParams: { gain: 0.5, mute: false },
        customProps: { name: 'First track' }
      },
      {
        sourceUrl: 'https://somedomain.com/some-other-sound.mp3',
        playbackRange: [0, 1],
        gainParams: { gain: 0.75, mute: false },
        customProps: { name: 'Second track' }
      },
    ],
    // Determines, which track should play solo initially (-1 for none)
    soloTrackIndex: -1
  },
  // Optional, will immediately start loading the tracks, without explicit
  // call to the `load` function. Consumers nevertheless have to wait until the
  // `state` changes to `ready` before starting playback.
  autoLoad: true,
  // Optional, will automatically start from the beginning, when `start` is called
  // after the track has been played previously unto the very end. Default: false
  autoRewind: true,
  // Optional, has to be an object with two fields:
  // * `gain` (float between 0 and 1) that stands for the volume between 0% and 100%.
  // * `mute` (boolean), if set to `true`, playback of this track will be muted.
  // Default: { gain: 1, mute: false }
  gainParams = { gain: 0.5, mute: false },
  // Optional, will be used to decode the audio file, can be replaced
  // by a custom implementation.
  mediaDecoder = new MediaDecoder(),
  // Optional, will be used to download the audio file, can be replaced
  // by a custom implementation.
  mediaDownloader = new MediaDownloader(),
  // Optional, will be used to retrieve an `AudioContext` that is ready to be used,
  // can be replaced by a custom implementation.
  audioContextProvider = new AudioContextProvider(),
  // Optional, will be called each time the track group's `state` property has changed.
  onStateChanged = (state, error) => { console.log(error ?? state); },
  // Optional, will be called each time the track group's `playState` property has changed.
  onPlayStateChanged = playState => { console.log(playState); },
  // Optional, will be called each time the current `position` property has changed.
  onPositionChanged = position => { console.log(position); },
});

// Example for changing the volume to 50% in the second track:
player.tracks[1].gainParams = { ...track.gainParams, gain: 0.5 };

// Example for setting the second track as the solo track:
player.soloTrackIndex = 1;

// See the `Track` class for methods and properties
~~~

### Concurrency

As downloading and decoding multiple media files can get pretty resource-intensive
(and therefore can even lead to browser craches), there is some concurrency control
built into this library that ensures that only a certain number of files can be
processed (downloaded/decoded) at the same time. In order to changes these global settings,
you can use the `GlobalMediaQueue` object:

~~~js
// Only allow 5 parallel downloads (default: 2)
GlobalMediaQueue.maxDownloadConcurrency = 5;
// Only allow 5 parallel decoding processes (default: 2)
GlobalMediaQueue.maxDecodingConcurrency = 5;
// Only allow 5 media files to be processed (i.e. downloaded AND decoded)
// at the same time (default: 2)
GlobalMediaQueue.maxMediaSourceConcurrency = 5;
~~~

---

## OER learning platform for music

Funded by 'Stiftung Innovation in der Hochschullehre'

<img src="https://stiftung-hochschullehre.de/wp-content/uploads/2020/07/logo_stiftung_hochschullehre_screenshot.jpg)" alt="Logo der Stiftung Innovation in der Hochschullehre" width="200"/>

A Project of the 'Hochschule für Musik und Theater München' (University for Music and Performing Arts)

<img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_Hochschule_f%C3%BCr_Musik_und_Theater_M%C3%BCnchen_.png" alt="Logo der Hochschule für Musik und Theater München" width="200"/>

Project owner: Hochschule für Musik und Theater München\
Project management: Ulrich Kaiser
