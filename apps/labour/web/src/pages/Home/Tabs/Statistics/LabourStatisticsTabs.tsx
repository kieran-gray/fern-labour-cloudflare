import { memo } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { Loader, Space, Tabs, Text } from '@mantine/core';
import { LabourStatisticsData, StatisticsTimeRange } from '../../../../hooks/useLabourStatistics';
import { LabourStatisticsChart } from './LabourStatisticsChart';
import { LabourStatisticsTable } from './LabourStatsticsTable';
import classes from './LabourStatistics.module.css';

export const LabourStatisticsTabs = memo(
  ({
    labour,
    contractions,
    statistics,
    timeRange,
    onTimeRangeChange,
    isLoadingMore,
  }: {
    labour: LabourReadModel;
    contractions: ContractionReadModel[];
    statistics: LabourStatisticsData;
    timeRange: StatisticsTimeRange;
    onTimeRangeChange: (range: StatisticsTimeRange) => void;
    isLoadingMore: boolean;
  }) => {
    return (
      <Tabs
        variant="pills"
        value={timeRange}
        onChange={(value) => onTimeRangeChange(value as StatisticsTimeRange)}
        orientation="horizontal"
        classNames={{
          root: classes.labourStatsTabsRoot,
          list: classes.labourStatsTabsList,
          panel: classes.labourStatsTabsPanel,
          tab: classes.labourStatsTabsTab,
        }}
      >
        <Tabs.List justify="space-between" style={{ width: '100%' }}>
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value="60mins">Past 60 Mins</Tabs.Tab>
          <Tabs.Tab value="30mins">Past 30 Mins</Tabs.Tab>
        </Tabs.List>

        <Space h="md" />

        <LabourStatisticsTable data={statistics} />

        <Space h="lg" />

        <div style={{ position: 'relative' }}>
          <LabourStatisticsChart
            contractions={contractions}
            minutes={timeRange === 'all' ? undefined : timeRange === '60mins' ? 60 : 30}
            endTime={labour.end_time ? new Date(labour.end_time) : undefined}
          />
          {isLoadingMore && (
            <div className={classes.loadingOverlay}>
              <Loader size="sm" />
              <Text size="xs">Loading history...</Text>
            </div>
          )}
        </div>
      </Tabs>
    );
  }
);
