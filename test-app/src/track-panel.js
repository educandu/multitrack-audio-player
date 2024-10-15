import React from 'react';

export default function TrackPanel({ track }) {
  return (
    <div className="Panel">
      <h2>Track</h2>
      <table>
        <tbody>
          <tr>
            <th>id</th>
            <td><div>{track.id}</div></td>
          </tr>
          <tr>
            <th>sourceUrl</th>
            <td><div>{track.sourceUrl}</div></td>
          </tr>
          <tr>
            <th>state</th>
            <td><div>{track.state}</div></td>
          </tr>
          <tr>
            <th>playState</th>
            <td><div>{track.playState}</div></td>
          </tr>
          <tr>
            <th>duration</th>
            <td><div>{track.duration}</div></td>
          </tr>
          <tr>
            <th>gainParams</th>
            <td>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="any"
                  value={track.gainParams.gain}
                  onChange={event => { track.gainParams = { ...track.gainParams, gain: Number(event.target.value) }; }}
                  />
                <label>
                  <input
                    type="checkbox"
                    checked={track.gainParams.solo}
                    onChange={event => { track.gainParams = { ...track.gainParams, solo: event.target.checked }; }}
                    />
                  &nbsp;
                  <span>SOLO</span>
                </label>
                &nbsp;
                <label>
                  <input
                    type="checkbox"
                    checked={track.gainParams.mute}
                    onChange={event => { track.gainParams = { ...track.gainParams, mute: event.target.checked }; }}
                    />
                  &nbsp;
                  <span>MUTE</span>
                </label>
                &nbsp;
                &nbsp;
                <span data-label="track-gainParams">{JSON.stringify(track.gainParams)}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>position</th>
            <td>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="any"
                  value={track.position / track.duration || 0}
                  onChange={event => { track.position = Number(event.target.value) * track.duration; }}
                  />
                &nbsp;
                &nbsp;
                <span>{track.position}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>autoRewind</th>
            <td>
              <div>
                <input
                  type="checkbox"
                  checked={track.autoRewind}
                  onChange={event => { track.autoRewind = event.target.checked; }}
                  />
              </div>
            </td>
          </tr>
          <tr>
            <th>error</th>
            <td><div>{track.error?.toString() || ''}</div></td>
          </tr>
          <tr>
            <th>ACTIONS</th>
            <td>
              <div>
                <button type="button" onClick={() => track.load()}>Load</button>
                <button type="button" onClick={() => track.start()}>Start</button>
                <button type="button" onClick={() => track.pause()}>Pause</button>
                <button type="button" onClick={() => track.stop()}>Stop</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
