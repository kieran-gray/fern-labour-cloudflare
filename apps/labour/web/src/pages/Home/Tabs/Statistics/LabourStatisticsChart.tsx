import { ContractionReadModel } from '@base/clients/labour_service';
import { formatDurationHuman, formatTimeSeconds } from '@lib';
import { ScatterChart } from '@mantine/charts';
import { Group, Paper, Text } from '@mantine/core';
import classes from './LabourStatistics.module.css';

interface ChartData {
  color: string;
  name: string;
  data: Record<string, unknown>[];
}

interface ChartPoint {
  time: number;
  duration: number;
  intensity: number | null;
  gap: number | null;
  formattedTime: string;
}

function getTimestampMinutesAgo(date: Date, minutes: number): number {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - minutes);
  return d.getTime();
}

const ChartTooltip = ({ payload }: { label: number; payload: any[] | undefined }) => {
  if (!payload || payload.length === 0) {
    return null;
  }
  const data = payload[0].payload as ChartPoint;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} size="sm" mb={4}>
        {data.formattedTime}
      </Text>
      <Group justify="space-between" gap="xl">
        <Text size="xs" c="dimmed">
          Duration
        </Text>
        <Text size="xs" fw={500}>
          {formatTimeSeconds(data.duration)}
        </Text>
      </Group>
      {data.intensity !== null && (
        <Group justify="space-between" gap="xl">
          <Text size="xs" c="dimmed">
            Intensity
          </Text>
          <Text size="xs" fw={500}>
            {data.intensity}/10
          </Text>
        </Group>
      )}
      {data.gap !== null && (
        <Group justify="space-between" gap="xl">
          <Text size="xs" c="dimmed">
            Frequency
          </Text>
          <Text size="xs" fw={500}>
            {formatDurationHuman(data.gap)}
          </Text>
        </Group>
      )}
    </Paper>
  );
};

export const LabourStatisticsChart = ({
  contractions,
  minutes,
  endTime,
}: {
  contractions: ContractionReadModel[];
  minutes?: number;
  endTime?: Date;
}) => {
  let minStartTime: number | null = null;
  let maxDuration = 0;

  const sortedContractions = [...contractions].sort(
    (a, b) => new Date(a.duration.start_time).getTime() - new Date(b.duration.start_time).getTime()
  );

  const seriesMap: Record<string, ChartData> = {
    strong: { color: 'var(--mantine-color-red-6)', name: 'Strong (8-10)', data: [] },
    moderate: { color: 'var(--mantine-color-yellow-6)', name: 'Moderate (4-7)', data: [] },
    mild: { color: 'var(--mantine-color-green-6)', name: 'Mild (1-3)', data: [] },
    unknown: { color: 'var(--mantine-color-gray-5)', name: 'Unknown', data: [] },
  };

  sortedContractions.forEach((contraction, index) => {
    const startTime = new Date(contraction.duration.start_time).getTime();
    minStartTime =
      minStartTime === null || (minStartTime && startTime < minStartTime)
        ? startTime
        : minStartTime;

    if (contraction.duration_seconds > maxDuration) {
      maxDuration = contraction.duration_seconds;
    }

    let gap: number | null = null;
    if (index > 0) {
      const prev = sortedContractions[index - 1];
      gap = (startTime - new Date(prev.duration.start_time).getTime()) / 1000;
    }

    const point: ChartPoint = {
      time: startTime,
      duration: contraction.duration_seconds,
      intensity: contraction.intensity,
      gap,
      formattedTime: new Date(contraction.duration.start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    if (contraction.intensity === null) {
      seriesMap.unknown.data.push(point as any);
    } else if (contraction.intensity >= 8) {
      seriesMap.strong.data.push(point as any);
    } else if (contraction.intensity >= 4) {
      seriesMap.moderate.data.push(point as any);
    } else {
      seriesMap.mild.data.push(point as any);
    }
  });

  const now = new Date();
  const startTime = minutes
    ? getTimestampMinutesAgo(now, minutes)
    : minStartTime
      ? minStartTime - 100000
      : 0;
  const endX = endTime ? endTime.getTime() : now.getTime();
  const yAxisMax = Math.max(60, Math.ceil((maxDuration + 10) / 10) * 10);

  const referenceLines = [];
  for (let i = 60; i < yAxisMax; i += 60) {
    referenceLines.push({
      y: i,
      label: `${i / 60} min`,
      color: 'red.4',
      strokeDasharray: '3 3',
    });
  }

  const chartData = [
    seriesMap.strong,
    seriesMap.moderate,
    seriesMap.mild,
    seriesMap.unknown,
  ].filter((s) => s.data.length > 0);

  return (
    <ScatterChart
      h={350}
      w="100%"
      data={chartData as any}
      dataKey={{ x: 'time', y: 'duration' }}
      xAxisLabel="Time"
      yAxisLabel="Duration (s)"
      xAxisProps={{ domain: [startTime, endX] }}
      yAxisProps={{ domain: [0, yAxisMax] }}
      referenceLines={referenceLines}
      tooltipProps={{
        content: ({ label, payload }) => <ChartTooltip label={label as number} payload={payload} />,
      }}
      valueFormatter={{
        x: (value) => {
          const date = new Date(value);
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          const isYesterday =
            date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

          if (isToday) {
            return `Today ${date.toTimeString().slice(0, 5)}`;
          } else if (isYesterday) {
            return `Yesterday ${date.toTimeString().slice(0, 5)}`;
          }
          return `${date.toLocaleDateString()} ${date.toTimeString().slice(0, 5)}`;
        },
        y: (value) => `${value}s`,
      }}
      classNames={{
        root: classes.labourStatsChartRoot,
        axisLabel: classes.labourStatsChartAxisLabel,
      }}
    />
  );
};
