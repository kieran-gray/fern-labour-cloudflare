import { Group, Skeleton, Stack } from '@mantine/core';
import classes from './SubscriptionsTable.module.css';

function SubscriptionCardSkeleton() {
  return (
    <div
      className={classes.card}
      style={{ padding: 'var(--mantine-spacing-md)', borderRadius: 'var(--mantine-radius-lg)' }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Skeleton circle width={38} height={38} />
          <Skeleton height={14} width={100} radius="sm" />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Skeleton height={30} width={70} radius="xl" />
          <Skeleton circle width={28} height={28} />
        </Group>
      </Group>
    </div>
  );
}

export function SubscriptionsSkeleton() {
  return (
    <Stack gap="sm" w="100%">
      <SubscriptionCardSkeleton />
    </Stack>
  );
}
