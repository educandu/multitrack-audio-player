import { useInterval } from './hooks.js';
import TrackPanel from './track-panel.js';
import { Track } from '../../src/index.js';
import React, { Fragment, useState } from 'react';
import { EXAMPLE_TUTTI_TRACK } from './examples.js';
import AudioContextPanel from './audio-context-panel.js';

export default function TrackTest() {
  useInterval(50);
  const [currentTrack, setCurrentTrack] = useState(null);

  const handleCreateTrackClick = () => {
    const oldTrack = currentTrack;
    setCurrentTrack(new Track({ sourceUrl: EXAMPLE_TUTTI_TRACK.sourceUrl, playbackRange: [0.25, 0.75] }));
    setTimeout(() => oldTrack?.dispose(), 0);
  };

  return (
    <Fragment>
      <AudioContextPanel />
      {!!currentTrack && <TrackPanel track={currentTrack} />}
      <div style={{ marginTop: '20px' }}>
        <button type="button" onClick={handleCreateTrackClick}>Create</button>
      </div>
    </Fragment>
  );
}
