import { useEffect, useState } from 'react';

export function useInterval(milliseconds) {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timerID = setInterval(() => setCurrentTime(new Date()), milliseconds);
    return () => clearInterval(timerID);
  });
  return currentTime;
}
