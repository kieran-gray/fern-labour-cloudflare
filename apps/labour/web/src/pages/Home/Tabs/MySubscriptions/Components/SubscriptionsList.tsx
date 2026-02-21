import { useState } from 'react';
import { SubscriptionStatusReadModel } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts';
import { useLabourClient } from '@base/hooks';
import { useUserSubscribedLabours, useUserSubscriptions } from '@base/hooks/useLabourData';
import { IconArrowRight, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { ManageSubscriptionMenu } from './SubscriptionMenu';
import { SubscriptionsSkeleton } from './SubscriptionsSkeleton';
import classes from './SubscriptionsList.module.css';
import baseClasses from '@styles/base.module.css';

export function SubscriptionsList() {
  const { subscription, selectSubscription, clearSubscription } = useLabourSession();
  const selectedSubscriptionId = subscription?.subscription_id;
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const client = useLabourClient();
  const { isPending, isError, data: subscriptions } = useUserSubscriptions(client);
  const { data: labours, isPending: laboursLoading } = useUserSubscribedLabours(client);

  if (isPending || laboursLoading) {
    return <SubscriptionsSkeleton />;
  }

  if (isError) {
    return (
      <div className={baseClasses.emptyState}>
        <Text
          size="sm"
          style={{ color: 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-2))' }}
        >
          Unable to load subscriptions. Please try refreshing the page.
        </Text>
      </div>
    );
  }

  const toggleSubscription = async (sub: SubscriptionStatusReadModel) => {
    setLoadingId(sub.subscription_id);
    try {
      if (selectedSubscriptionId === sub.subscription_id) {
        clearSubscription();
      } else {
        const fullSubscription = await client.getUserSubscription(sub.labour_id);
        if (fullSubscription.success && fullSubscription.data) {
          selectSubscription(fullSubscription.data);
        }
        navigate(`/?tab=details`);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.emptyState}>
        You don't have any subscriptions yet.
      </Text>
    );
  }

  return (
    <Stack gap="sm" w="100%">
      {subscriptions.map((sub) => {
        const labour = labours?.find((l) => l.labour_id === sub.labour_id);
        const motherName = labour?.mother_name || 'Unknown';
        const isSelected = selectedSubscriptionId === sub.subscription_id;
        const isLoading = loadingId === sub.subscription_id;

        return (
          <Card
            key={sub.subscription_id}
            padding="md"
            radius="lg"
            className={`${classes.card} ${isSelected ? classes.cardSelected : ''}`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Avatar
                  radius="xl"
                  color="var(--mantine-primary-color-5)"
                  className={classes.avatar}
                />
                <Text fw={500} className={classes.cropText} size="sm">
                  {motherName}
                </Text>
              </Group>
              <Group gap="xs" wrap="nowrap">
                {sub.status === 'REQUESTED' ? (
                  <Badge variant="light" color="gray" radius="xl">
                    Requested
                  </Badge>
                ) : (
                  <>
                    <Button
                      rightSection={
                        isSelected ? (
                          <IconX size={16} stroke={1.5} />
                        ) : (
                          <IconArrowRight size={16} stroke={1.5} />
                        )
                      }
                      variant={isSelected ? 'filled' : 'light'}
                      radius="xl"
                      size="sm"
                      loading={isLoading}
                      onClick={() => toggleSubscription(sub)}
                    >
                      {isSelected ? 'Close' : 'View'}
                    </Button>
                    <ManageSubscriptionMenu
                      labourId={sub.labour_id}
                      subscriptionId={sub.subscription_id}
                    />
                  </>
                )}
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
