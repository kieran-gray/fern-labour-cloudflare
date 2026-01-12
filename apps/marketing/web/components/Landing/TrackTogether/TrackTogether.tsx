import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import classes from './TrackTogether.module.css';

export function TrackTogether() {
  const [activeDevice, setActiveDevice] = useState<'left' | 'right'>('left');
  const [timerValue, setTimerValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTimerRunning(true);
      setTimerValue(0);
      setActiveDevice((prev) => (prev === 'left' ? 'right' : 'left'));

      setTimeout(() => {
        setIsTimerRunning(false);
      }, 3500);
    }, 5000);

    setTimeout(() => {
      setIsTimerRunning(true);
      setTimeout(() => setIsTimerRunning(false), 3500);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }
    const interval = setInterval(() => {
      setTimerValue((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={classes.root}>
      <Container size="md" className={classes.inner}>
        <motion.div
          className={classes.content}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Track together, from anywhere</Title>
          <Text className={classes.description}>
            Your birth partner can track from their own phone. Everything stays in sync. One less
            thing to manage.
          </Text>
        </motion.div>

        <motion.div
          className={classes.deviceContainer}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <div className={classes.deviceWrapper}>
            <div className={classes.deviceLabel}>You</div>
            <div
              className={classes.device}
              data-active={activeDevice === 'left' && isTimerRunning}
              data-synced={activeDevice === 'right' && isTimerRunning}
            >
              <div className={classes.deviceNotch} />
              <div className={classes.deviceScreen}>
                <div className={classes.timerDisplay} data-active={isTimerRunning}>
                  {isTimerRunning ? (
                    <>
                      <div className={classes.timerPulse} />
                      <span className={classes.timerValue}>{formatTime(timerValue)}</span>
                    </>
                  ) : (
                    <div className={classes.timerIdle}>
                      <div className={classes.idleDot} />
                      <span>Ready</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={classes.syncArea}>
            <svg className={classes.syncWave} viewBox="0 0 80 40" preserveAspectRatio="none">
              <path
                className={`${classes.syncPath} ${isTimerRunning ? classes.syncActive : ''}`}
                d="M0,20 Q20,5 40,20 T80,20"
                fill="none"
                strokeWidth="2"
              />
            </svg>
            <div
              className={`${classes.syncBadge} ${isTimerRunning ? classes.syncBadgeActive : ''}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M4 12l5 5L20 7" />
              </svg>
              <span>synced</span>
            </div>
          </div>

          <div className={classes.deviceWrapper}>
            <div className={classes.deviceLabel}>Partner</div>
            <div
              className={classes.device}
              data-active={activeDevice === 'right' && isTimerRunning}
              data-synced={activeDevice === 'left' && isTimerRunning}
            >
              <div className={classes.deviceNotch} />
              <div className={classes.deviceScreen}>
                <div className={classes.timerDisplay} data-active={isTimerRunning}>
                  {isTimerRunning ? (
                    <>
                      <div className={classes.timerPulse} />
                      <span className={classes.timerValue}>{formatTime(timerValue)}</span>
                    </>
                  ) : (
                    <div className={classes.timerIdle}>
                      <div className={classes.idleDot} />
                      <span>Ready</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
