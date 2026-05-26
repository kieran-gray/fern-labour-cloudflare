import { ContractionReadModel } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient, useServerOffset } from '@base/hooks';
import { formatTimeSeconds } from '@lib';
import { Stack, Text } from '@mantine/core';
import { formatTimeSince } from '../../contractionUtils';
import { ContractionControls } from './ContractionControls';
import Stopwatch from './Stopwatch';
import classes from './TrackingStatusCard.module.css';
import baseClasses from '@styles/base.module.css';

interface TrackingStatusCardProps {
  activeContraction: ContractionReadModel | undefined;
  lastContraction: ContractionReadModel | undefined;
  completed: boolean;
}

export function TrackingStatusCard({
  activeContraction,
  lastContraction,
  completed,
}: TrackingStatusCardProps) {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { data: offsetData } = useServerOffset(client, labourId);
  const offset = offsetData || 0;

  if (completed) {
    return null;
  }

  const startTimestamp = activeContraction
    ? new Date(activeContraction.duration.start_time).getTime()
    : null;

  const isActive = activeContraction && startTimestamp;
  const labourBegun = activeContraction || lastContraction;

  if (!labourBegun) {
    return (
      <div className={`${classes.card} ${baseClasses.desktopOnly}`}>
        <ContractionControls labourCompleted={completed} activeContraction={activeContraction} />
      </div>
    );
  }

  return (
    <div className={`${classes.card} ${isActive ? classes.active : ''}`}>
      <Stack gap="lg" align="stretch">
        {/* Status section - stopwatch when active, stats when idle */}
        <div className={classes.statusSection}>
          {isActive ? (
            <div className={classes.activeContractionInfo}>
              <Text className={classes.activeLabel}>Contraction in progress</Text>
              <div className={classes.stopwatchWrapper}>
                <Stopwatch startTimestamp={startTimestamp} offset={offset} />
              </div>
              <Text className={classes.breathingPrompt}>Breathe slowly and steadily</Text>
            </div>
          ) : (
            <>
              {lastContraction && (
                <div className={classes.lastContractionInfo}>
                  <Text className={classes.lastLabel}>Last contraction</Text>
                  <Text className={classes.lastValue}>
                    {formatTimeSeconds(lastContraction.duration_seconds)}
                  </Text>
                  <Text className={classes.lastTime}>
                    {formatTimeSince(lastContraction.duration.end_time)}
                  </Text>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls - only on desktop (mobile uses FloatingPanel) */}
        <div className={baseClasses.desktopOnly}>
          <ContractionControls labourCompleted={completed} activeContraction={activeContraction} />
        </div>
      </Stack>
    </div>
  );
}
