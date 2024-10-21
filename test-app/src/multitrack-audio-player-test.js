import { useInterval } from './hooks.js';
import TrackPanel from './track-panel.js';
import React, { Fragment, useState } from 'react';
import AudioContextPanel from './audio-context-panel.js';
import { EXAMPLE_TRACK_CONFIGURATION } from './examples.js';
import MultitrackAudioPlayerPanel from './multitrack-audio-player-panel.js';
import { MultitrackAudioPlayer } from '../../src/multitrack-audio-player.js';

export default function MultitrackAudioPlayerTest() {
  useInterval(50);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [lastReportedState, setLastReportedState] = useState(null);
  const [lastReportedError, setLastReportedError] = useState(null);
  const [lastReportedPlayState, setLastReportedPlayState] = useState(null);
  const [lastReportedPosition, setLastReportedPosition] = useState(null);

  const handleCreateTrackGroupClick = () => {
    const oldPlayer = currentPlayer;
    const newPlayer = new MultitrackAudioPlayer({
      trackConfiguration: EXAMPLE_TRACK_CONFIGURATION,
      onStateChanged: (newState, error) => {
        setLastReportedState(newState);
        setLastReportedError(error);
      },
      onPlayStateChanged: newPlayState => {
        setLastReportedPlayState(newPlayState);
      },
      onPositionChanged: newPosition => {
        setLastReportedPosition(newPosition);
      }
    });

    setCurrentPlayer(newPlayer);
    setLastReportedState(newPlayer.state);
    setLastReportedError(newPlayer.error);
    setLastReportedPlayState(newPlayer.playState);
    setLastReportedPosition(newPlayer.position);

    setTimeout(() => oldPlayer?.dispose(), 0);
  };

  const handleSoloChange = (trackIndex, newSolo) => {
    currentPlayer.soloTrackIndex = newSolo ? trackIndex : -1;
  };

  return (
    <Fragment>
      <AudioContextPanel />
      <div className="Panel">
        <h2>Global</h2>
        <table>
          <tbody>
            <tr>
              <th>lastReportedState</th>
              <td><div>{lastReportedState}</div></td>
            </tr>
            <tr>
              <th>lastReportedError</th>
              <td><div>{lastReportedError}</div></td>
            </tr>
            <tr>
              <th>lastReportedPlayState</th>
              <td><div>{lastReportedPlayState}</div></td>
            </tr>
            <tr>
              <th>lastReportedPosition</th>
              <td><div>{lastReportedPosition}</div></td>
            </tr>
          </tbody>
        </table>
      </div>
      {!!currentPlayer && <MultitrackAudioPlayerPanel player={currentPlayer} />}
      {currentPlayer?.tracks.map((track, trackIndex) => (
        <TrackPanel
          key={track.id}
          track={track}
          showSolo
          solo={currentPlayer.soloTrackIndex === trackIndex}
          onSoloChange={isSolo => handleSoloChange(trackIndex, isSolo)}
          />
      ))}
      <div style={{ marginTop: '20px' }}>
        <button type="button" onClick={handleCreateTrackGroupClick}>Create</button>
      </div>
    </Fragment>
  );
}
