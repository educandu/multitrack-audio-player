import TrackTest from './track-test.js';
import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import TrackGroupTest from './track-group-test.js';

const availableTests = [
  {
    key: 'track-test',
    header: 'Track test',
    render: () => <TrackTest />
  },
  {
    key: 'track-group-test',
    header: 'Track group test',
    render: () => <TrackGroupTest />
  }
];

function App() {
  const currentTestKey = new URL(window.document.location.href).searchParams.get('test');
  const currentTest = availableTests.find(test => test.key === currentTestKey) || null;

  const handleNavigation = (event, test) => {
    event.preventDefault();
    window.document.location = test ? `/?test=${test.key}` : '/';
  };

  return (
    <Fragment>
      {!!currentTest && (
        <Fragment>
          <div>
            <a href="/" onClick={event => handleNavigation(event, null)}>Go back</a>
          </div>
          <h1>{currentTest.header}</h1>
          {currentTest.render()}
        </Fragment>
      )}
      {!currentTest && (
        <Fragment>
          <h1>Multitrack Audio Player Test App</h1>
          <div>Choose a test:</div>
          <ul>
            {availableTests.map(test => (
              <li key={test.key}>
                <a href={`/?test=${test.key}`} onClick={event => handleNavigation(event, test)}>{test.header}</a>
              </li>
            ))}
          </ul>
        </Fragment>
      )}
    </Fragment>
  );
}

const root = createRoot(document.getElementById('app'));
root.render(<App />);
