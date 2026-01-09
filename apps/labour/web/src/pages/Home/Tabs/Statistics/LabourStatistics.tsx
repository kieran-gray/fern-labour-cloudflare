import { memo, useEffect, useState } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { useLabourStatistics } from '@hooks/useLabourStatistics';
import { formatDurationHuman, formatTimeSeconds, pluraliseName } from '@lib';
import {
  IconBook,
  IconCalendarEvent,
  IconClock,
  IconFlagFilled,
  IconHourglass,
} from '@tabler/icons-react';
import { ActionIcon, Image, Loader, Space, Text, Title } from '@mantine/core';
import { useDisclosure, useInterval } from '@mantine/hooks';
import { StatisticsHelpModal } from './HelpModal';
import { LabourStatisticsTabs } from './LabourStatisticsTabs';
import image from './statistics.svg';
import classes from './LabourStatistics.module.css';
import baseClasses from '@styles/base.module.css';

interface TimingCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

const TimingCard = ({ icon, label, value, subtext }: TimingCardProps) => (
  <div className={classes.statCard}>
    <Text className={classes.statCardLabel}>
      {icon}
      {label}
    </Text>
    <Text className={classes.statCardValue}>{value}</Text>
    {subtext && <Text className={classes.statCardSubtext}>{subtext}</Text>}
  </div>
);

const ElapsedTimingCard = ({ startTime }: { startTime: string }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => calculateElapsed(startTime));

  const interval = useInterval(() => {
    setElapsedSeconds(calculateElapsed(startTime));
  }, 1000);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <TimingCard
      icon={<IconHourglass size={14} />}
      label="Elapsed"
      value={formatDurationHuman(elapsedSeconds)}
      subtext="and counting"
    />
  );
};

const MESSAGES = {
  OWNER_TITLE: 'Your labour statistics',
  OWNER_DESCRIPTION_ACTIVE:
    'Here, you can view all of the statistics about your contractions. Useful when discussing labour progress with a midwife or healthcare provider.',
  OWNER_DESCRIPTION_COMPLETED:
    'Here, you can see all the statistics about your contractions during your labour journey.',
  OWNER_EMPTY_STATE_ACTIVE: 'Not enough data yet, keep tracking.',
  OWNER_EMPTY_STATE_COMPLETED: "You didn't track enough contractions to see statistics.",
  SUBSCRIBER_TITLE: (possessiveName: string) => `${possessiveName} labour statistics`,
  SUBSCRIBER_DESCRIPTION_ACTIVE: (possessiveName: string) =>
    `Here, you can view all of the statistics about ${possessiveName} contractions.`,
  SUBSCRIBER_DESCRIPTION_COMPLETED: (possessiveName: string) =>
    `All the numbers and patterns from ${possessiveName} contractions during labour.`,
  SUBSCRIBER_EMPTY_STATE: 'Not enough data yet.',
};

interface LabourStatisticsProps {
  labour: LabourReadModel;
  contractions?: ContractionReadModel[];
  inContainer?: boolean;
  isSubscriberView?: boolean;
}

const calculateElapsed = (startTime: string): number => {
  return (Date.now() - new Date(startTime).getTime()) / 1000;
};

export const LabourStatistics = memo(
  ({
    labour,
    contractions: contractionsProp,
    inContainer = true,
    isSubscriberView = false,
  }: LabourStatisticsProps) => {
    const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false);

    const {
      timeRange,
      setTimeRange,
      contractions,
      statistics,
      isLoading,
      isLoadingMore,
      totalContractionCount,
    } = useLabourStatistics(labour, contractionsProp);

    const completed = labour.end_time !== null;
    const motherName = isSubscriberView ? pluraliseName(labour.mother_name.split(' ')[0]) : '';

    const renderTimingInfo = () => {
      if (!labour.start_time) {
        return null;
      }

      const startDate = new Date(labour.start_time);
      const startTime = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const startDateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      if (completed && labour.end_time) {
        const endDate = new Date(labour.end_time);
        const endTime = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const endDateStr = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const durationSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

        return (
          <div className={classes.timingCardsContainer}>
            <TimingCard
              icon={<IconCalendarEvent size={14} />}
              label="Started"
              value={startTime}
              subtext={startDateStr}
            />
            <TimingCard
              icon={<IconFlagFilled size={14} />}
              label="Ended"
              value={endTime}
              subtext={endDateStr}
            />
            <TimingCard
              icon={<IconClock size={14} />}
              label="Duration"
              value={formatTimeSeconds(durationSeconds)}
              subtext="total time"
            />
          </div>
        );
      }

      return (
        <div className={classes.timingCardsContainer}>
          <TimingCard
            icon={<IconCalendarEvent size={14} />}
            label="Started"
            value={startTime}
            subtext={startDateStr}
          />
          <ElapsedTimingCard startTime={labour.start_time} />
        </div>
      );
    };

    const emptyStateMessage = isSubscriberView
      ? MESSAGES.SUBSCRIBER_EMPTY_STATE
      : completed
        ? MESSAGES.OWNER_EMPTY_STATE_COMPLETED
        : MESSAGES.OWNER_EMPTY_STATE_ACTIVE;

    const hasData = totalContractionCount > 0;

    const renderStatisticsContent = () => (
      <>
        {renderTimingInfo()}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader />
          </div>
        )}

        {!hasData && !isLoading && (
          <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.emptyState}>
            {emptyStateMessage}
          </Text>
        )}

        {hasData && (
          <LabourStatisticsTabs
            labour={labour}
            contractions={contractions}
            statistics={statistics}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoadingMore={isLoadingMore}
          />
        )}
      </>
    );

    if (!inContainer) {
      return renderStatisticsContent();
    }

    const title = isSubscriberView ? MESSAGES.SUBSCRIBER_TITLE(motherName) : MESSAGES.OWNER_TITLE;

    const description = isSubscriberView
      ? completed
        ? MESSAGES.SUBSCRIBER_DESCRIPTION_COMPLETED(motherName)
        : MESSAGES.SUBSCRIBER_DESCRIPTION_ACTIVE(motherName)
      : completed
        ? MESSAGES.OWNER_DESCRIPTION_COMPLETED
        : MESSAGES.OWNER_DESCRIPTION_ACTIVE;

    return (
      <div className={baseClasses.root}>
        <div className={baseClasses.body}>
          <div className={baseClasses.docsTitleRow}>
            <div className={classes.title} style={{ paddingBottom: 0 }}>
              <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                {title}
              </Title>
            </div>
            <ActionIcon radius="xl" variant="light" size="xl" onClick={openHelp}>
              <IconBook />
            </ActionIcon>
            <StatisticsHelpModal opened={helpOpened} close={closeHelp} />
          </div>
          <div className={baseClasses.inner} style={{ paddingBottom: 0, paddingTop: 0 }}>
            <div className={classes.content}>
              <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description}>
                {description}
              </Text>
              <Space h="sm" />
              <div className={baseClasses.imageFlexRow}>
                <Image src={image} className={classes.smallImage} />
              </div>
            </div>
            <div className={baseClasses.flexColumn}>
              <Image src={image} className={classes.image} />
            </div>
          </div>
          <div className={classes.statsInner}>
            <div className={baseClasses.flexColumn} style={{ width: '100%' }}>
              {renderStatisticsContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
