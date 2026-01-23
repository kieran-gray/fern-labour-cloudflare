import { Group, Skeleton, Stack } from '@mantine/core';
import classes from './LabourHistoryTable.module.css';

function LabourCardSkeleton() {
  return (
    <div
      className={classes.card}
      style={{ padding: 'var(--mantine-spacing-md)', borderRadius: 'var(--mantine-radius-lg)' }}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <Skeleton circle width={38} height={38} className={classes.avatar} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Skeleton height={14} width={120} radius="sm" mb={6} />
            <Group gap="xs" wrap="nowrap">
              <Skeleton height={20} width={60} radius="xl" />
              <Skeleton height={12} width={80} radius="sm" className={classes.dateFull} />
              <Skeleton height={12} width={50} radius="sm" className={classes.dateShort} />
            </Group>
          </div>
        </Group>
        <Group gap="xs" wrap="nowrap" className={classes.actions}>
          <Skeleton height={30} width={70} radius="xl" className={classes.viewButtonFull} />
          <Skeleton circle width={34} height={34} className={classes.viewButtonCompact} />
          <Skeleton circle width={34} height={34} />
        </Group>
      </Group>
    </div>
  );
}

export function LabourHistorySkeleton() {
  return (
    <Stack gap="sm" w="100%">
      <LabourCardSkeleton />
    </Stack>
  );
}
