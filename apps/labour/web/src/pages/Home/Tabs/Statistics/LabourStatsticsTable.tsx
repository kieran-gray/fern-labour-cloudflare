import { IconActivity, IconClock, IconFlame, IconRefresh } from '@tabler/icons-react';
import { Text } from '@mantine/core';
import { LabourStatisticsData } from '../../../../hooks/useLabourStatistics';
import classes from './LabourStatistics.module.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

const StatCard = ({ icon, label, value, subtext }: StatCardProps) => (
  <div className={classes.statCard}>
    <Text className={classes.statCardLabel}>
      {icon}
      {label}
    </Text>
    <Text className={classes.statCardValue}>{value}</Text>
    {subtext && <Text className={classes.statCardSubtext}>{subtext}</Text>}
  </div>
);

const formatDurationFriendly = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const formatFrequencyFriendly = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const LabourStatisticsTable = ({ data }: { data: LabourStatisticsData }) => {
  return (
    <div className={classes.statCardsContainer}>
      <StatCard
        icon={<IconActivity size={14} />}
        label="Count"
        value={data.contraction_count.toString()}
        subtext="contractions"
      />
      <StatCard
        icon={<IconClock size={14} />}
        label="Duration"
        value={formatDurationFriendly(data.average_duration)}
        subtext="avg length"
      />
      <StatCard
        icon={<IconRefresh size={14} />}
        label="Frequency"
        value={formatFrequencyFriendly(data.average_frequency)}
        subtext="avg gap"
      />
      <StatCard
        icon={<IconFlame size={14} />}
        label="Intensity"
        value={`${data.average_intensity.toFixed(1)}/10`}
        subtext="avg strength"
      />
    </div>
  );
};
