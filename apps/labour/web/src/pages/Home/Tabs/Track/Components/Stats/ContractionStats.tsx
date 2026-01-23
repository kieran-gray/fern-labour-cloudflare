import { useMemo } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { IconClock, IconFlame } from '@tabler/icons-react';
import { Text } from '@mantine/core';
import classes from './ContractionStats.module.css';

interface ContractionStatsProps {
  contractions: ContractionReadModel[];
}

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

interface Stats {
  avgFrequencyMs: number | null;
  avgDurationSec: number | null;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }
  return `${secs}s`;
}

function formatFrequency(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }
  return `${secs}s`;
}

function calculateStats(contractions: ContractionReadModel[]): Stats {
  const completed = contractions.filter((c) => c.duration.start_time !== c.duration.end_time);

  if (completed.length === 0) {
    return { avgFrequencyMs: null, avgDurationSec: null };
  }

  const recent = completed.slice(-4);

  const totalDuration = recent.reduce((sum, c) => sum + c.duration_seconds, 0);
  const avgDurationSec = totalDuration / recent.length;

  const frequencies: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const prevStart = new Date(recent[i - 1].duration.start_time).getTime();
    const currStart = new Date(recent[i].duration.start_time).getTime();
    frequencies.push(currStart - prevStart);
  }

  const avgFrequencyMs =
    frequencies.length > 0 ? frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length : null;

  return { avgFrequencyMs, avgDurationSec };
}

export function ContractionStats({ contractions }: ContractionStatsProps) {
  const stats = useMemo(() => calculateStats(contractions), [contractions]);

  if (stats.avgFrequencyMs === null && stats.avgDurationSec === null) {
    return null;
  }

  return (
    <div className={classes.statCardsContainer}>
      {stats.avgFrequencyMs !== null && (
        <StatCard
          icon={<IconClock size={14} />}
          label="Frequency"
          value={`~${formatFrequency(stats.avgFrequencyMs)}`}
          subtext={`apart (last ${Math.min(contractions.length, 4)})`}
        />
      )}
      {stats.avgDurationSec !== null && (
        <StatCard
          icon={<IconFlame size={14} />}
          label="Duration"
          value={`~${formatDuration(stats.avgDurationSec)}`}
          subtext={`average (last ${Math.min(contractions.length, 4)})`}
        />
      )}
    </div>
  );
}
