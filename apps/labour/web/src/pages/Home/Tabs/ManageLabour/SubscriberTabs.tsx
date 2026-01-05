import { SubscriptionReadModel, User } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import {
  useApproveSubscriber,
  useLabourSubscriptions,
  useRemoveSubscriber,
  useUnblockSubscriber,
  useUsers,
} from '@base/hooks/useLabourData';
import { IconUserCheck, IconUserOff, IconUserQuestion } from '@tabler/icons-react';
import { Badge, Group, Tabs, Text } from '@mantine/core';
import { SubscribersSkeleton } from './SubscribersSkeleton';
import { SubscribersTable } from './SubscribersTable';
import baseClasses from '@styles/base.module.css';

export const ManageSubscribersTabs = () => {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { isPending, isError, data: subscriptions } = useLabourSubscriptions(client, labourId!);
  const { isPending: usersPending, data: users = [] } = useUsers(client, labourId!);

  const approveSubscriberMutation = useApproveSubscriber(client);
  const removeSubscriberMutation = useRemoveSubscriber(client);
  const unblockSubscriberMutation = useUnblockSubscriber(client);

  if (isPending || usersPending) {
    return <SubscribersSkeleton />;
  }

  if (isError) {
    return (
      <div className={baseClasses.emptyState}>
        <Text size="sm" c="dimmed">
          Unable to load subscribers. Please try refreshing the page.
        </Text>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className={baseClasses.emptyState}>
        <Text size="sm" ta="center">
          No subscribers yet. Share your link in the Share tab to invite loved ones.
        </Text>
      </div>
    );
  }

  const subscriberById = Object.fromEntries(
    users.map((user: User) => [
      user.user_id,
      {
        firstName: user.first_name || 'Unknown',
        lastName: user.last_name || '',
        id: user.user_id,
      },
    ])
  );

  const activeSubscriptions: SubscriptionReadModel[] = [];
  const requestedSubscriptions: SubscriptionReadModel[] = [];
  const blockedSubscriptions: SubscriptionReadModel[] = [];
  subscriptions.forEach((sub) => {
    if (sub.status === 'SUBSCRIBED') {
      activeSubscriptions.push(sub);
    } else if (sub.status === 'REQUESTED') {
      requestedSubscriptions.push(sub);
    } else if (sub.status === 'BLOCKED') {
      blockedSubscriptions.push(sub);
    }
  });

  const handleApprove = (subscriptionId: string) => {
    approveSubscriberMutation.mutate({ labourId: labourId!, subscriptionId });
  };

  const handleReject = (subscriptionId: string) => {
    removeSubscriberMutation.mutate({ labourId: labourId!, subscriptionId });
  };

  const handleUnblock = (subscriptionId: string) => {
    unblockSubscriberMutation.mutate({ labourId: labourId!, subscriptionId });
  };

  const tabs = [
    {
      id: 'subscribed',
      label: 'Active',
      icon: IconUserCheck,
      count: activeSubscriptions.length,
    },
    {
      id: 'requested',
      label: 'Requests',
      icon: IconUserQuestion,
      count: requestedSubscriptions.length,
      highlight: requestedSubscriptions.length > 0,
    },
    {
      id: 'blocked',
      label: 'Blocked',
      icon: IconUserOff,
      count: blockedSubscriptions.length,
    },
  ];

  return (
    <Tabs
      w="100%"
      defaultValue={requestedSubscriptions.length > 0 ? 'requested' : 'subscribed'}
      radius="lg"
      classNames={{
        tab: baseClasses.navTab,
        tabSection: baseClasses.navTabSection,
      }}
    >
      <Tabs.List grow>
        {tabs.map(({ id, label, icon: Icon, count, highlight }) => (
          <Tabs.Tab key={id} value={id} leftSection={<Icon size={18} />}>
            <Group gap={6} wrap="nowrap">
              <Text className={baseClasses.navTabText}>{label}</Text>
              {count > 0 && (
                <Badge
                  size="sm"
                  variant={highlight ? 'filled' : 'light'}
                  color={highlight ? 'red' : 'gray'}
                  circle
                >
                  {count}
                </Badge>
              )}
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panel value="subscribed">
        <SubscribersTable
          subscriptions={activeSubscriptions}
          subscriberById={subscriberById}
          status="subscribed"
        />
      </Tabs.Panel>
      <Tabs.Panel value="requested">
        <SubscribersTable
          subscriptions={requestedSubscriptions}
          subscriberById={subscriberById}
          status="requested"
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </Tabs.Panel>
      <Tabs.Panel value="blocked">
        <SubscribersTable
          subscriptions={blockedSubscriptions}
          subscriberById={subscriberById}
          status="blocked"
          onUnblock={handleUnblock}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
