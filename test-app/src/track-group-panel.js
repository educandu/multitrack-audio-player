import React from 'react';

export default function TrackGroupPanel({ trackGroup }) {
  return (
    <div className="Panel">
      <h2>TrackGroup</h2>
      <table>
        <tbody>
          <tr>
            <th>state</th>
            <td><div>{trackGroup.state}</div></td>
          </tr>
          <tr>
            <th>playState</th>
            <td><div>{trackGroup.playState}</div></td>
          </tr>
          <tr>
            <th>duration</th>
            <td><div>{trackGroup.duration}</div></td>
          </tr>
          <tr>
            <th>masterGain</th>
            <td>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="any"
                  value={trackGroup.gainParams.gain}
                  onChange={event => { trackGroup.gainParams = { ...trackGroup.gainParams, gain: Number(event.target.value) }; }}
                  />
                &nbsp;
                <label>
                  <input
                    type="checkbox"
                    checked={trackGroup.gainParams.mute}
                    onChange={event => { trackGroup.gainParams = { ...trackGroup.gainParams, mute: event.target.checked }; }}
                    />
                  &nbsp;
                  <span>MUTE</span>
                </label>
                &nbsp;
                &nbsp;
                <span>{trackGroup.gainParams.gain}</span>
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
                  value={trackGroup.position / trackGroup.duration || 0}
                  onChange={event => { trackGroup.position = Number(event.target.value) * trackGroup.duration; }}
                  />
                &nbsp;
                &nbsp;
                <span>{trackGroup.position}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>autoRewind</th>
            <td>
              <div>
                <input
                  type="checkbox"
                  checked={trackGroup.autoRewind}
                  onChange={event => { trackGroup.autoRewind = event.target.checked; }}
                  />
              </div>
            </td>
          </tr>
          <tr>
            <th>error</th>
            <td><div>{trackGroup.error?.toString() || ''}</div></td>
          </tr>
          <tr>
            <th>ACTIONS</th>
            <td>
              <div>
                <button type="button" onClick={() => trackGroup.load()}>Load</button>
                <button type="button" onClick={() => trackGroup.start()}>Start</button>
                <button type="button" onClick={() => trackGroup.pause()}>Pause</button>
                <button type="button" onClick={() => trackGroup.stop()}>Stop</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
