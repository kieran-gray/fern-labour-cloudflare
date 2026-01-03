import { useState } from 'react';
import { SubscriptionReadModel } from '@base/clients/labour_service/types';
import { IconBan, IconCheck, IconX } from '@tabler/icons-react';
import { ActionIcon, Avatar, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { RoleBadge } from './RoleBadge';
import { ManageSubscriptionMenu } from './SubscriberMenu';
import classes from './SubscribersTable.module.css';
import baseClasses from '@styles/base.module.css';

export function SubscribersTable({
  subscriptions,
  subscriberById,
  status,
  onApprove,
  onReject,
  onUnblock,
}: {
  subscriptions: SubscriptionReadModel[];
  subscriberById: { [k: string]: { id: string; firstName: string; lastName: string } };
  status: string;
  onApprove?: (subscriptionId: string) => void;
  onReject?: (subscriptionId: string) => void;
  onUnblock?: (subscriptionId: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (subscriptions.length === 0) {
    let message = '';
    if (status === 'subscribed') {
      message =
        "You don't have any subscribers yet, share invites with loved ones in the invite tab.";
    } else if (status === 'requested') {
      message = "You don't have any subscriber requests.";
    } else if (status === 'blocked') {
      message = "You don't have any blocked subscribers.";
    }

    return (
      <div style={{ marginTop: '10px' }}>
        <Text
          fz={{ base: 'sm', xs: 'md' }}
          className={baseClasses.importantText}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {message}
        </Text>
      </div>
    );
  }

  const handleAction = async (subscriptionId: string, action: () => void) => {
    setLoadingId(subscriptionId);
    try {
      action();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Stack gap="sm" w="100%" mt="sm">
      {subscriptions.map((subscription) => {
        const subscriber = subscriberById[subscription.subscriber_id];
        const isLoading = loadingId === subscription.subscription_id;

        return (
          <Card
            key={subscription.subscription_id}
            padding="md"
            radius="lg"
            className={classes.card}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Avatar radius="xl" color="var(--mantine-primary-color-5)" />
                <div style={{ minWidth: 0 }}>
                  <Text fw={500} className={classes.cropText} size="sm">
                    {subscriber.firstName} {subscriber.lastName}
                  </Text>
                  {status === 'subscribed' && <RoleBadge role={subscription.role} />}
                </div>
              </Group>

              {/* Requested: Show inline Accept/Reject buttons */}
              {status === 'requested' && (
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label="Accept">
                    <ActionIcon
                      variant="light"
                      color="green"
                      size="lg"
                      radius="xl"
                      loading={isLoading}
                      onClick={() =>
                        handleAction(subscription.subscription_id, () =>
                          onApprove?.(subscription.subscription_id)
                        )
                      }
                    >
                      <IconCheck size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Reject">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      radius="xl"
                      loading={isLoading}
                      onClick={() =>
                        handleAction(subscription.subscription_id, () =>
                          onReject?.(subscription.subscription_id)
                        )
                      }
                    >
                      <IconX size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <ManageSubscriptionMenu
                    subscriptionId={subscription.subscription_id}
                    status={status}
                    currentRole={subscription.role}
                  />
                </Group>
              )}

              {/* Blocked: Show inline Unblock button */}
              {status === 'blocked' && (
                <Tooltip label="Unblock">
                  <ActionIcon
                    variant="light"
                    color="green"
                    size="lg"
                    radius="xl"
                    loading={isLoading}
                    onClick={() =>
                      handleAction(subscription.subscription_id, () =>
                        onUnblock?.(subscription.subscription_id)
                      )
                    }
                  >
                    <IconBan size={18} />
                  </ActionIcon>
                </Tooltip>
              )}

              {/* Subscribed: Show menu */}
              {status === 'subscribed' && (
                <ManageSubscriptionMenu
                  subscriptionId={subscription.subscription_id}
                  status={status}
                  currentRole={subscription.role}
                />
              )}
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
