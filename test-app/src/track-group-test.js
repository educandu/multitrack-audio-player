import { useInterval } from './hooks.js';
import TrackPanel from './track-panel.js';
import React, { Fragment, useState } from 'react';
import TrackGroupPanel from './track-group-panel.js';
import { TrackGroup } from '../../src/track-group.js';
import AudioContextPanel from './audio-context-panel.js';
import { EXAMPLE_TRACK_CONFIGURATION } from './examples.js';

export default function TrackGroupTest() {
  useInterval(50);
  const [currentTrackGroup, setCurrentTrackGroup] = useState(null);

  const handleCreateTrackGroupClick = () => {
    const oldTrackGroup = currentTrackGroup;
    setCurrentTrackGroup(new TrackGroup({ trackConfiguration: EXAMPLE_TRACK_CONFIGURATION }));
    setTimeout(() => oldTrackGroup?.dispose(), 0);
  };

  const handleSoloChange = (trackIndex, newSolo) => {
    currentTrackGroup.soloTrackIndex = newSolo ? trackIndex : -1;
  };

  return (
    <Fragment>
      <AudioContextPanel />
      {!!currentTrackGroup && <TrackGroupPanel trackGroup={currentTrackGroup} />}
      {currentTrackGroup?.tracks.map((track, trackIndex) => (
        <TrackPanel
          key={track.id}
          track={track}
          showSolo
          solo={currentTrackGroup.soloTrackIndex === trackIndex}
          onSoloChange={isSolo => handleSoloChange(trackIndex, isSolo)}
          />
      ))}
      <div style={{ marginTop: '20px' }}>
        <button type="button" onClick={handleCreateTrackGroupClick}>Create</button>
      </div>
    </Fragment>
  );
}
