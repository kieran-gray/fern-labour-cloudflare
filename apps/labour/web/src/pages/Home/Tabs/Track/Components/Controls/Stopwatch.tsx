import { useEffect, useState } from 'react';
import classes from './Stopwatch.module.css';

interface StopwatchProps {
  startTimestamp: number;
  offset?: number;
}

export default function Stopwatch({ startTimestamp, offset = 0 }: StopwatchProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const elapsedMs = Math.max(0, Date.now() + offset - startTimestamp);
  const seconds = Math.floor(elapsedMs / 1000);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.counter}>{formatTime(seconds)}</div>
    </div>
  );
}
