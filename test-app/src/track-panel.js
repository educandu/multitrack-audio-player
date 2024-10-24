import React, { Fragment } from 'react';

export default function TrackPanel({ track, solo = false, onSoloChange = null, showSolo = false, showActions = false }) {
  return (
    <div className="Panel">
      <h2>Track</h2>
      <table>
        <tbody>
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
            <th>masterGain</th>
            <td>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="any"
                  value={track.masterGain}
                  onChange={event => { track.masterGain = Number(event.target.value); }}
                  />
                &nbsp;
                &nbsp;
                <span>{track.masterGain}</span>
              </div>
            </td>
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
                {!!showSolo && (
                  <Fragment>
                    &nbsp;
                    <label>
                      <input
                        type="checkbox"
                        checked={solo}
                        onChange={event => onSoloChange?.(event.target.checked)}
                        />
                      &nbsp;
                      <span>SOLO</span>
                    </label>
                  </Fragment>
                )}
                &nbsp;
                &nbsp;
                <span>{track.gainParams.gain}</span>
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
            <th>customProps</th>
            <td><div>{JSON.stringify(track.customProps)}</div></td>
          </tr>
          <tr>
            <th>error</th>
            <td><div>{track.error?.toString() || ''}</div></td>
          </tr>
          {!!showActions && (
            <tr>
              <th>ACTIONS</th>
              <td>
                <div>
                  <button type="button" onClick={() => track.initialize()}>Initialize</button>
                  <button type="button" onClick={() => track.load()}>Load</button>
                  <button type="button" onClick={() => track.start()}>Start</button>
                  <button type="button" onClick={() => track.pause()}>Pause</button>
                  <button type="button" onClick={() => track.stop()}>Stop</button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
