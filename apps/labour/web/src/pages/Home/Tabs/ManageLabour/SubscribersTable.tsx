import { useEffect, useRef, useState } from 'react';
import { SubscriptionReadModel } from '@base/clients/labour_service/types';
import { queryKeys } from '@base/hooks/queryKeys';
import { IconBan, IconCheck, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Card, Group, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { RoleBadge } from './RoleBadge';
import { SubscriberAvatar } from './SubscriberAvatar';
import { ManageSubscriptionMenu } from './SubscriberMenu';
import classes from './SubscribersTable.module.css';
import baseClasses from '@styles/base.module.css';

export function SubscribersTable({
  subscriptions,
  subscriberById,
  labourId,
  status,
  onApprove,
  onReject,
  onUnblock,
}: {
  subscriptions: SubscriptionReadModel[];
  subscriberById: { [k: string]: { id: string; firstName: string; lastName: string } };
  labourId: string;
  status: string;
  onApprove?: (subscriptionId: string) => void;
  onReject?: (subscriptionId: string) => void;
  onUnblock?: (subscriptionId: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const hasInvalidatedRef = useRef(false);

  const missingSubscribers = subscriptions.some((sub) => !subscriberById[sub.subscriber_id]);

  useEffect(() => {
    if (missingSubscribers && !hasInvalidatedRef.current) {
      hasInvalidatedRef.current = true;
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.listByLabour(labourId),
      });
    }
  }, [missingSubscribers, labourId, queryClient]);

  if (subscriptions.length === 0) {
    let message = '';
    if (status === 'subscribed') {
      message = 'No active subscribers yet. Share your link in the Share tab to invite loved ones.';
    } else if (status === 'requested') {
      message = 'No pending requests.';
    } else if (status === 'blocked') {
      message = 'No blocked subscribers.';
    }

    return (
      <div className={`${baseClasses.emptyState} ${baseClasses.emptyStateGray}`}>
        <Text size="sm" ta="center">
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
                {subscriber ? (
                  <>
                    <SubscriberAvatar
                      subscriberId={subscriber.id}
                      firstName={subscriber.firstName}
                      lastName={subscriber.lastName}
                    />
                    <div style={{ minWidth: 0 }}>
                      <Text fw={500} className={classes.cropText} size="sm">
                        {subscriber.firstName} {subscriber.lastName}
                      </Text>
                      {status === 'subscribed' && <RoleBadge role={subscription.role} />}
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton height={40} circle />
                    <div style={{ minWidth: 0 }}>
                      <Skeleton height={14} width={120} mb={4} />
                      {status === 'subscribed' && <Skeleton height={18} width={80} />}
                    </div>
                  </>
                )}
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
