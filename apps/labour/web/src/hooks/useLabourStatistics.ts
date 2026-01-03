import { useEffect, useMemo, useState } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';

export type StatisticsTimeRange = '30mins' | '60mins' | 'all';

export interface LabourStatisticsData {
  contraction_count: number;
  average_duration: number;
  average_intensity: number;
  average_frequency: number;
}

function generateStatisticsData(contractions: ContractionReadModel[]): LabourStatisticsData {
  const sortedContractions = [...contractions].sort(
    (a, b) => new Date(a.duration.start_time).getTime() - new Date(b.duration.start_time).getTime()
  );

  const contractionIntensities: number[] = [];
  const contractionDurations: number[] = [];
  const contractionFrequencies: number[] = [];

  sortedContractions.forEach((contraction) => {
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

  for (let i = 0; i < sortedContractions.length - 1; i++) {
    const curr = sortedContractions[i];
    const next = sortedContractions[i + 1];

    const frequency =
      (new Date(next.duration.start_time).getTime() -
        new Date(curr.duration.start_time).getTime()) /
      1000;

    if (frequency > 0) {
      contractionFrequencies.push(frequency);
    }
  }

  let avgFrequency = 0.0;
  if (contractionFrequencies.length > 0) {
    const sumFrequencies = contractionFrequencies.reduce((sum, freq) => sum + freq, 0);
    avgFrequency = sumFrequencies / contractionFrequencies.length;
  }

  return {
    contraction_count: sortedContractions.length,
    average_duration: avgDuration,
    average_intensity: avgIntensity,
    average_frequency: avgFrequency,
  };
}

function isRecentDate(date: Date, minutes: number): boolean {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  return diffInMinutes <= minutes;
}

export function useLabourStatistics(
  labour: LabourReadModel,
  contractionsProp?: ContractionReadModel[]
) {
  const client = useLabourClient();
  const shouldFetch = contractionsProp === undefined;

  const {
    data: contractionsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useContractionsInfinite(client, shouldFetch ? labour.labour_id : null);

  const [timeRange, setTimeRange] = useState<StatisticsTimeRange>('60mins');

  // Auto-fetch more if "all" is selected
  useEffect(() => {
    if (timeRange === 'all' && shouldFetch && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [timeRange, shouldFetch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allContractions = useMemo(() => {
    return contractionsProp ?? flattenContractions(contractionsData);
  }, [contractionsProp, contractionsData]);

  const filteredContractions = useMemo(() => {
    if (timeRange === 'all') {
      return allContractions;
    }

    const minutes = timeRange === '30mins' ? 30 : 60;
    return allContractions.filter((c) => isRecentDate(new Date(c.duration.start_time), minutes));
  }, [allContractions, timeRange]);

  const statistics = useMemo(() => {
    return generateStatisticsData(filteredContractions);
  }, [filteredContractions]);

  return {
    timeRange,
    setTimeRange,
    contractions: filteredContractions,
    statistics,
    isLoading: isLoading && !allContractions.length,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage,
    loadMore: fetchNextPage,
    totalContractionCount: allContractions.length,
  };
}
