import { useEffect, useMemo, useRef, useState } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { formatTimeMilliseconds, formatTimeSeconds } from '@lib';
import { IconActivityHeartbeat } from '@tabler/icons-react';
import { Button, ScrollArea, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { EditContractionModal } from './EditContractionModal';
import classes from './ContractionTimelineCustom.module.css';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const DOTTED_LINE_FREQUENCY_GAP = 1800000;
const FREQUENCY_URGENT = 180000;
const FREQUENCY_ALERT = 300000;
const FREQUENCY_WARMING = 600000;

const getIntensityColor = (intensity: number | null): string => {
  const value = intensity ?? 0;
  if (value <= 3) {
    return '#ff7964';
  }
  if (value <= 6) {
    return '#fe5236';
  }
  if (value <= 8) {
    return '#ff2a09';
  }
  return '#cb1500';
};

const getFrequencyColorClass = (frequencyMs: number): string => {
  if (frequencyMs < FREQUENCY_URGENT) {
    return 'frequencyUrgent';
  }
  if (frequencyMs < FREQUENCY_ALERT) {
    return 'frequencyAlert';
  }
  if (frequencyMs < FREQUENCY_WARMING) {
    return 'frequencyWarming';
  }
  return 'frequencyNeutral';
};

export interface ContractionData {
  contractionId: string;
  startTime: string;
  endTime: string;
  intensity: number | null;
}

type Section = { key: string; label: string; items: ContractionReadModel[] };

type ContractionFrequencyGaps = {
  previous: number;
  next: number;
};

const getTimeSinceLastStarted = (
  contractions: ContractionReadModel[]
): Record<string, ContractionFrequencyGaps> => {
  const contractionFrequencyGaps: Record<string, ContractionFrequencyGaps> = {};
  let lastStartTime: string = '';
  let previousContractionId: string = '';

  contractions.forEach((contraction) => {
    const frequency = lastStartTime
      ? new Date(contraction.duration.start_time).getTime() - new Date(lastStartTime).getTime()
      : 0;
    const frequencies: ContractionFrequencyGaps = {
      previous: frequency,
      next: 0,
    };
    contractionFrequencyGaps[contraction.contraction_id] = frequencies;

    if (previousContractionId) {
      contractionFrequencyGaps[previousContractionId].next = frequency;
    }

    lastStartTime = contraction.duration.start_time;
    previousContractionId = contraction.contraction_id;
  });

  return contractionFrequencyGaps;
};

const calculateDurationSeconds = (startTime: string, endTime: string): number => {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
};

export default function ContractionTimelineCustom({
  contractions,
  completed,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  contractions: ContractionReadModel[];
  completed: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalData, setModalData] = useState<ContractionData | null>(null);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);

  const isFinished = (c: ContractionReadModel) => c.duration.start_time !== c.duration.end_time;
  const gaps = useMemo(() => getTimeSinceLastStarted(contractions), [contractions]);

  const newestContractionId =
    contractions.length > 0 ? contractions[contractions.length - 1].contraction_id : null;
  const prevNewestId = usePrevious(newestContractionId);

  useEffect(() => {
    if (!viewport.current || contractions.length === 0) {
      return;
    }

    const shouldScroll =
      !hasInitiallyScrolled || (newestContractionId !== prevNewestId && prevNewestId !== undefined);

    if (shouldScroll) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'auto' });
      if (!hasInitiallyScrolled) {
        setHasInitiallyScrolled(true);
      }
    }
  }, [contractions, newestContractionId, prevNewestId, hasInitiallyScrolled]);

  const formatClock = (iso: string) =>
    new Date(iso).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });

  const handleClick = (c: ContractionReadModel) => {
    if (!completed && isFinished(c)) {
      setModalData({
        contractionId: c.contraction_id,
        startTime: c.duration.start_time,
        endTime: c.duration.end_time,
        intensity: c.intensity,
      });
      open();
    }
  };

  const sections: Section[] = useMemo(() => {
    const map = new Map<string, ContractionReadModel[]>();
    for (const c of contractions) {
      const d = new Date(c.duration.start_time);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: new Date(items[0].duration.start_time).toLocaleDateString(navigator.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      items,
    }));
  }, [contractions]);

  const renderItem = (c: ContractionReadModel, idx: number, arr: ContractionReadModel[]) => {
    const finished = isFinished(c);
    const nextGap = gaps[c.contraction_id]?.next ?? 0;
    const clickable = finished && !completed;
    const durationSeconds = calculateDurationSeconds(c.duration.start_time, c.duration.end_time);

    const rowClassName = finished ? classes.gridRow : `${classes.gridRow} ${classes.activeRow}`;

    const node = (
      <div key={`${c.contraction_id}-node`} className={rowClassName}>
        <div className={classes.leftColumn}>
          <div className={classes.durationDisplay}>
            {finished ? (
              <Text size="md" fw={600} className={classes.durationText}>
                {formatTimeSeconds(durationSeconds)}
              </Text>
            ) : (
              <Text size="md" fw={600} className={classes.ongoingText}>
                Ongoing
              </Text>
            )}
          </div>
          <div className={classes.timeDisplay}>
            <Text size="xs" fw={400} className={classes.timeText}>
              {formatClock(c.duration.start_time)}
            </Text>
          </div>
        </div>
        <div className={classes.centerColumn}>
          <div
            className={`${classes.railCell} ${
              nextGap > DOTTED_LINE_FREQUENCY_GAP ? classes.longGap : ''
            }`}
            aria-hidden
          >
            <div
              className={finished ? classes.bullet : `${classes.bullet} ${classes.bulletActive}`}
              style={{ background: finished ? getIntensityColor(c.intensity) : undefined }}
              onClick={() => handleClick(c)}
              role={clickable ? 'button' : undefined}
              aria-label={
                finished
                  ? `Contraction at ${formatClock(c.duration.start_time)}, intensity ${c.intensity ?? 0}`
                  : `Ongoing contraction started at ${formatClock(c.duration.start_time)}`
              }
            >
              {finished ? (c.intensity ?? 0) : <IconActivityHeartbeat size={22} color="white" />}
            </div>
          </div>
        </div>
        <div className={classes.rightColumn} />
      </div>
    );

    const frequencyColorClass = classes[getFrequencyColorClass(nextGap)] || '';

    const connector = idx < arr.length - 1 && nextGap > 0 && (
      <div key={`${c.contraction_id}-connector`} className={classes.connectorRow}>
        <div className={classes.connectorLeft} />
        <div className={classes.connectorCenter} />
        <div className={classes.connectorRight}>
          <div className={`${classes.frequencyDisplay} ${frequencyColorClass}`}>
            <Text size="xs" fw={500} className={classes.frequencyText}>
              {formatTimeMilliseconds(nextGap)}
            </Text>
          </div>
        </div>
      </div>
    );

    return connector ? [node, connector] : [node];
  };

  return (
    <div className={classes.timelineContainer}>
      {modalData && !completed && (
        <EditContractionModal contractionData={modalData} opened={opened} close={close} />
      )}
      {sections.length > 0 && (
        <div className={classes.headerRow}>
          <div className={classes.headerLeft}>
            <Text size="sm" fw={600}>
              Duration
            </Text>
          </div>
          <div className={classes.headerCenter}>
            {/* Timeline column - no header text needed */}
          </div>
          <div className={classes.headerRight}>
            <Text size="sm" fw={600}>
              Frequency
            </Text>
          </div>
        </div>
      )}
      <ScrollArea.Autosize mah="calc(100dvh - 380px)" viewportRef={viewport} w="100%">
        <div className={classes.root}>
          {hasMore && onLoadMore && (
            <Button
              onClick={onLoadMore}
              variant="light"
              mb="md"
              fullWidth
              loading={isLoadingMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load older contractions'}
            </Button>
          )}
          {sections.length === 0 && <Text ta="center">No contractions recorded yet</Text>}
          {sections.map((section) => (
            <div key={section.key} className={classes.daySection}>
              <div className={classes.dayHeader}>
                <Text size="sm" className={classes.dayTitle}>
                  {section.label}
                </Text>
              </div>
              {section.items.flatMap((c, i, arr) => renderItem(c, i, arr))}
            </div>
          ))}
        </div>
      </ScrollArea.Autosize>
    </div>
  );
}
