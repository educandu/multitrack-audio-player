window.addEventListener('DOMContentLoaded', () => {
  switch (window.__PAGE_NAME__) {
    case 'track-test':
      import('./track-test.js');
      break;
    default:
      break;
  }
});
