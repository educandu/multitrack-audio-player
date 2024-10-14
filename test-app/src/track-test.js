import { useInterval } from './hooks.js';
import TrackPanel from './track-panel.js';
import { Track } from '../../src/index.js';
import React, { Fragment, useState } from 'react';
import AudioContextPanel from './audio-context-panel.js';

const EXAMPLE_MEDIA_URL = 'https://cdn.openmusic.academy/media-library/oma-hkm-00-tutti-uhZ6Reh4ttWXcKKigyXzBa.mp3';

export default function TrackTest() {
  useInterval(50);
  const [currentTrack, setCurrentTrack] = useState(null);

  const handleCreateTrackClick = () => {
    const oldTrack = currentTrack;
    setCurrentTrack(new Track({ mediaUrl: EXAMPLE_MEDIA_URL, playbackRange: [0.25, 0.75] }));
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
