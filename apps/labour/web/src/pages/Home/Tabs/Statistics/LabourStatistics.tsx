import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { useLabourStatistics } from '@hooks/useLabourStatistics';
import { formatDurationHuman, formatTimeSeconds, pluraliseName } from '@lib';
import { Image, Loader, Space, Text, Title } from '@mantine/core';
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

  const hasData = totalContractionCount > 0;

  const renderStatisticsContent = () => (
    <>
      {renderTimingInfo()}
      <Space h="sm" />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Loader />
        </div>
      )}

      {!hasData && !isLoading && (
        <Text
          fz={{ base: 'sm', xs: 'md' }}
          className={baseClasses.importantText}
          style={{ display: 'flex', alignItems: 'center' }}
        >
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
        <div className={baseClasses.inner}>
          <div className={classes.content}>
            <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
              {title}
            </Title>
            <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
              {description}
            </Text>
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
