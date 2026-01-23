import { IconUserCheck, IconUserOff, IconUserQuestion } from '@tabler/icons-react';
import { Badge, Group, Skeleton, Stack, Tabs, Text } from '@mantine/core';
import classes from './SubscribersTable.module.css';
import baseClasses from '@styles/base.module.css';

function SubscriberCardSkeleton() {
  return (
    <div
      className={classes.card}
      style={{ padding: 'var(--mantine-spacing-md)', borderRadius: 'var(--mantine-radius-lg)' }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Skeleton circle width={38} height={38} />
          <div>
            <Skeleton height={14} width={120} radius="sm" mb={6} />
            <Skeleton height={20} width={80} radius="sm" />
          </div>
        </Group>
        <Skeleton circle width={28} height={28} />
      </Group>
    </div>
  );
}

export function SubscribersSkeleton() {
  const tabs = [
    { id: 'subscribed', label: 'Active', icon: IconUserCheck },
    { id: 'requested', label: 'Requests', icon: IconUserQuestion },
    { id: 'blocked', label: 'Blocked', icon: IconUserOff },
  ];

  return (
    <Tabs
      w="100%"
      defaultValue="subscribed"
      radius="lg"
      classNames={{
        tab: baseClasses.navTab,
        tabSection: baseClasses.navTabSection,
      }}
    >
      <Tabs.List grow>
        {tabs.map(({ id, label, icon: Icon }) => (
          <Tabs.Tab key={id} value={id} leftSection={<Icon size={18} />}>
            <Group gap={6} wrap="nowrap">
              <Text className={baseClasses.navTabText}>{label}</Text>
              <Badge size="sm" variant="light" color="gray" circle>
                <Skeleton height={10} width={10} radius="xl" />
              </Badge>
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map(({ id }) => (
        <Tabs.Panel value={id} key={id}>
          <Stack gap="sm" w="100%" mt="sm">
            <SubscriberCardSkeleton />
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
