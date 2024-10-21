import React, { useEffect, useState } from 'react';
import { AudioContextCache } from '../../src/index.js';

export default function AudioContextPanel() {
  const [audioContext, setAudioContext] = useState(AudioContextCache.global.audioContext);

  useEffect(() => {
    const handler = () => setAudioContext(AudioContextCache.global.audioContext);
    AudioContextCache.global.subscribe(handler);
    return () => AudioContextCache.global.unsubscribe(handler);
  }, []);

  return (
    <div className="Panel">
      <h2>AudioContext (global)</h2>
      <table>
        <tbody>
          <tr>
            <th>state</th>
            <td><div>{audioContext?.state ?? ''}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
