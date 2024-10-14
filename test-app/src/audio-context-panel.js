import React from 'react';
import { AudioContextCache } from '../../src/index.js';

export default function AudioContextPanel() {
  return (
    <div className="Panel">
      <h2>AudioContext</h2>
      <table>
        <tbody>
          <tr>
            <th>state</th>
            <td><div>{AudioContextCache.global.audioContext?.state ?? ''}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
