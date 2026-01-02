import { useEffect } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { ImportantText } from '@base/components/Text/ImportantText';
import { ResponsiveDescription } from '@base/components/Text/ResponsiveDescription';
import { ResponsiveTitle } from '@base/components/Text/ResponsiveTitle';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';
import { formatDurationHuman, formatTimeSeconds, pluraliseName } from '@lib';
import { Image, Space, Text } from '@mantine/core';
import { LabourStatisticsTabs } from './LabourStatisticsTabs';
import image from './statistics.svg';
import classes from './LabourStatistics.module.css';
import baseClasses from '@styles/base.module.css';

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

export interface LabourStatisticsData {
  contraction_count: number;
  average_duration: number;
  average_intensity: number;
  average_frequency: number;
}

export interface LabourStatistics {
  last_30_mins?: LabourStatisticsData;
  last_60_mins?: LabourStatisticsData;
  total?: LabourStatisticsData;
}

function isRecentDate(date: Date, minutes: 30 | 60): boolean {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  return diffInMinutes <= minutes;
}

export function filterContractions(
  contractions: ContractionReadModel[],
  minutes: 30 | 60
): ContractionReadModel[] {
  return contractions.filter((contraction) =>
    isRecentDate(new Date(contraction.duration.start_time), minutes)
  );
}

function generateStatisticsData(contractions: ContractionReadModel[]): LabourStatisticsData {
  const contractionIntensities: number[] = [];
  const contractionDurations: number[] = [];
  const contractionFrequencies: number[] = [];

  contractions.forEach((contraction) => {
    if (contraction.duration.start_time !== contraction.duration.end_time) {
      contractionDurations.push(contraction.duration_seconds);
    }
    if (contraction.intensity !== null) {
      contractionIntensities.push(contraction.intensity);
    }
  });

  let avgDuration = 0.0;
  if (contractionDurations.length > 0) {
    const sumDurations = contractionDurations.reduce((sum, duration) => sum + duration, 0);
    avgDuration = sumDurations / contractionDurations.length;
  }

  let avgIntensity = 0.0;
  if (contractionIntensities.length > 0) {
    const sumIntensities = contractionIntensities.reduce((sum, intensity) => sum + intensity, 0);
    avgIntensity = sumIntensities / contractionIntensities.length;
  }

  let avgFrequency = 0.0;
  for (let i = 0; i < contractions.length - 1; i++) {
    const curr = contractions[i + 1];
    const prev = contractions[i];

    const frequency =
      (new Date(curr.duration.start_time).getTime() -
        new Date(prev.duration.start_time).getTime()) /
      1000;
    contractionFrequencies.push(frequency);
  }
  if (contractionFrequencies.length > 0) {
    const sumFrequencies = contractionFrequencies.reduce((sum, freq) => sum + freq, 0);
    avgFrequency = sumFrequencies / contractionFrequencies.length;
  }

  return {
    contraction_count: contractions.length,
    average_duration: avgDuration,
    average_intensity: avgIntensity,
    average_frequency: avgFrequency,
  };
}

export function createLabourStatistics(contractions: ContractionReadModel[]): LabourStatistics {
  const statistics: LabourStatistics = {};

  if (contractions.length < 3) {
    return statistics;
  }

  const contractions30Mins = filterContractions(contractions, 30);
  if (contractions30Mins.length > 0) {
    statistics.last_30_mins = generateStatisticsData(contractions30Mins);
  }

  const contractions60Mins = filterContractions(contractions, 60);
  if (contractions60Mins.length > 0) {
    statistics.last_60_mins = generateStatisticsData(contractions60Mins);
  }

  statistics.total = generateStatisticsData(contractions);
  return statistics;
}

interface LabourStatisticsProps {
  labour: LabourReadModel;
  contractions?: ContractionReadModel[];
  inContainer?: boolean;
  isSubscriberView?: boolean;
}

export const LabourStatistics = ({
  labour,
  contractions: contractionsProp,
  inContainer = true,
  isSubscriberView = false,
}: LabourStatisticsProps) => {
  const client = useLabourClient();
  const shouldFetch = contractionsProp === undefined;
  const {
    data: contractionsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useContractionsInfinite(client, shouldFetch ? labour.labour_id : null);

  useEffect(() => {
    if (shouldFetch && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [shouldFetch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const contractions = contractionsProp ?? flattenContractions(contractionsData);
  const isLoadingMore = shouldFetch && (hasNextPage || isFetchingNextPage);
  const labourStatistics = createLabourStatistics(contractions);
  const completed = labour.end_time !== null;
  const motherName = isSubscriberView ? pluraliseName(labour.mother_name.split(' ')[0]) : '';

  const renderTimingInfo = () => (
    <div className={classes.statsTextContainer}>
      {labour.start_time && (
        <Text className={classes.labourStatsText} mr={10}>
          <strong>Start Time:</strong> {new Date(labour.start_time).toString().slice(0, 21)}
        </Text>
      )}

      {labour.start_time && labour.end_time && (
        <>
          <Text className={classes.labourStatsText}>
            <strong>End Time:</strong> {new Date(labour.end_time).toString().slice(0, 21)}
          </Text>
          <Text className={classes.labourStatsText}>
            <strong>Duration: </strong>
            {formatTimeSeconds(
              (new Date(labour.end_time).getTime() - new Date(labour.start_time).getTime()) / 1000
            )}
          </Text>
        </>
      )}
      {labour.start_time && labour.end_time == null && (
        <Text className={classes.labourStatsText}>
          <strong>Elapsed Time: </strong>
          {formatDurationHuman(
            (new Date().getTime() - new Date(labour.start_time).getTime()) / 1000
          )}
        </Text>
      )}
    </div>
  );

  const emptyStateMessage = isSubscriberView
    ? MESSAGES.SUBSCRIBER_EMPTY_STATE
    : completed
      ? MESSAGES.OWNER_EMPTY_STATE_COMPLETED
      : MESSAGES.OWNER_EMPTY_STATE_ACTIVE;

  const renderStatisticsContent = () => (
    <>
      {renderTimingInfo()}
      <Space h="sm" />
      {isLoadingMore && (
        <Text size="sm" c="dimmed" ta="center" mb="sm">
          Loading all contractions...
        </Text>
      )}
      {!labourStatistics.total && !isLoadingMore && <ImportantText message={emptyStateMessage} />}
      {labourStatistics.total && (
        <LabourStatisticsTabs
          labour={labour}
          contractions={contractions}
          statistics={labourStatistics}
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
        <div className={baseClasses.inner}>
          <div className={classes.content}>
            <ResponsiveTitle title={title} />
            <ResponsiveDescription description={description} marginTop={10} />
            <div className={baseClasses.imageFlexRow}>
              <Image src={image} className={baseClasses.smallImage} />
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
};
