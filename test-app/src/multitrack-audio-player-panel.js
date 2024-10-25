import React from 'react';

export default function MultitrackAudioPlayerPanel({ player }) {
  return (
    <div className="Panel">
      <h2>MultitrackAudioPlayer</h2>
      <table>
        <tbody>
          <tr>
            <th>state</th>
            <td><div>{player.state}</div></td>
          </tr>
          <tr>
            <th>playState</th>
            <td><div>{player.playState}</div></td>
          </tr>
          <tr>
            <th>duration</th>
            <td><div>{player.duration}</div></td>
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
                  value={player.gainParams.gain}
                  onChange={event => { player.gainParams = { ...player.gainParams, gain: Number(event.target.value) }; }}
                  />
                &nbsp;
                <label>
                  <input
                    type="checkbox"
                    checked={player.gainParams.mute}
                    onChange={event => { player.gainParams = { ...player.gainParams, mute: event.target.checked }; }}
                    />
                  &nbsp;
                  <span>MUTE</span>
                </label>
                &nbsp;
                &nbsp;
                <span>{player.gainParams.gain}</span>
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
                  value={player.position / player.duration || 0}
                  onChange={event => { player.position = Number(event.target.value) * player.duration; }}
                  />
                &nbsp;
                &nbsp;
                <span>{player.position}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>loop</th>
            <td>
              <div>
                <input
                  type="checkbox"
                  checked={player.loop}
                  onChange={event => { player.loop = event.target.checked; }}
                  />
              </div>
            </td>
          </tr>
          <tr>
            <th>autoRewind</th>
            <td>
              <div>
                <input
                  type="checkbox"
                  checked={player.autoRewind}
                  onChange={event => { player.autoRewind = event.target.checked; }}
                  />
              </div>
            </td>
          </tr>
          <tr>
            <th>error</th>
            <td><div>{player.error?.toString() || ''}</div></td>
          </tr>
          <tr>
            <th>ACTIONS</th>
            <td>
              <div>
                <button type="button" onClick={() => player.initialize()}>Initialize</button>
                <button type="button" onClick={() => player.load()}>Load</button>
                <button type="button" onClick={() => player.start()}>Start</button>
                <button type="button" onClick={() => player.pause()}>Pause</button>
                <button type="button" onClick={() => player.stop()}>Stop</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
