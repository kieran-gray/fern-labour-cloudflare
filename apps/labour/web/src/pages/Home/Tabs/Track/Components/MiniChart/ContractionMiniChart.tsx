import { useMemo, useState } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { BarChart, ChartTooltipProps } from '@mantine/charts';
import { Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  ContractionFormData,
  formatClockTime,
  getIntensityLabel,
  toFormData,
} from '../../contractionUtils';
import { EditContractionModal } from '../../Modals/EditContractionModal';
import classes from './ContractionMiniChart.module.css';

interface ContractionMiniChartProps {
  contractions: ContractionReadModel[];
  completed?: boolean;
}

const MAX_BARS = 4;

function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  if (rounded < 60) {
    return `${rounded}s`;
  }
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={4} size="sm">
        {label}
      </Text>
      <Text size="xs">
        Duration:{' '}
        <Text component="span" fw={500}>
          {formatDuration(data.duration)}
        </Text>
      </Text>
      <Text size="xs">
        Intensity:{' '}
        <Text component="span" fw={500}>
          {getIntensityLabel(data.intensity)}
        </Text>
      </Text>
    </Paper>
  );
}

export function ContractionMiniChart({
  contractions,
  completed = false,
}: ContractionMiniChartProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [modalData, setModalData] = useState<ContractionFormData | null>(null);

  const completedContractions = useMemo(
    () => contractions.filter((c) => c.duration.start_time !== c.duration.end_time),
    [contractions]
  );

  const recentContractions = useMemo(
    () => completedContractions.slice(-MAX_BARS),
    [completedContractions]
  );

  const chartData = useMemo(() => {
    return recentContractions.map((c) => ({
      time: formatClockTime(c.duration.start_time),
      duration: c.duration_seconds,
      intensity: c.intensity,
      contractionId: c.contraction_id,
    }));
  }, [recentContractions]);

  const maxDuration = useMemo(() => {
    if (chartData.length === 0) {
      return 60;
    }
    const max = Math.max(...chartData.map((c) => c.duration));
    return Math.ceil(max / 30) * 30;
  }, [chartData]);

  const handleBarClick = (data: Record<string, unknown>) => {
    if (completed) {
      return;
    }

    const contractionId = data.contractionId as string;
    const contraction = recentContractions.find((c) => c.contraction_id === contractionId);

    if (contraction) {
      setModalData(toFormData(contraction));
      open();
    }
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className={classes.chartCard}>
      <div className={classes.chartHeader}>
        <Text className={classes.chartLabel}>Recent contractions</Text>
        {!completed && <Text className={classes.chartHint}>Tap a bar to edit</Text>}
      </div>
      <BarChart
        h={160}
        data={chartData}
        dataKey="time"
        series={[{ name: 'duration', color: 'pink.4' }]}
        tickLine="y"
        gridAxis="y"
        withYAxis
        yAxisProps={{
          tickFormatter: (value: number) => `${Math.round(value)}s`,
          width: 40,
          domain: [0, maxDuration],
        }}
        withBarValueLabel
        barLabelColor="light-dark(var(--mantine-color-gray-7),var(--mantine-color-gray-3))"
        valueFormatter={(value) => formatDuration(value)}
        tooltipAnimationDuration={200}
        tooltipProps={{
          content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
        }}
        barProps={{
          radius: [4, 4, 0, 0],
          onClick: (data) => handleBarClick(data.payload),
          style: { cursor: completed ? 'default' : 'pointer' },
        }}
        classNames={{
          root: classes.chartRoot,
          axisLabel: classes.axisLabel,
        }}
      />
      {modalData && !completed && (
        <EditContractionModal contractionData={modalData} opened={opened} close={close} />
      )}
    </div>
  );
}
