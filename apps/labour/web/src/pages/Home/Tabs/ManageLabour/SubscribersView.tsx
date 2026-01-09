import { useState } from 'react';
import { SubscriberRole, SubscriptionReadModel, User } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import {
  useApproveSubscriber,
  useLabourSubscriptions,
  useRemoveSubscriber,
  useUnblockSubscriber,
  useUsers,
} from '@base/hooks/useLabourData';
import {
  IconBan,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconHeart,
  IconSparkles,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { ManageSubscriptionMenu } from './SubscriberMenu';
import { SubscribersSkeleton } from './SubscribersSkeleton';
import classes from './SubscribersView.module.css';
import baseClasses from '@styles/base.module.css';

interface SubscriberInfo {
  id: string;
  firstName: string;
  lastName: string;
}

function getRoleConfig(role: SubscriberRole) {
  switch (role) {
    case SubscriberRole.BIRTH_PARTNER:
      return { label: 'Birth Partner', color: 'pink', icon: IconHeart };
    case SubscriberRole.SUPPORT_PERSON:
      return { label: 'Support Person', color: 'violet', icon: IconSparkles };
    case SubscriberRole.LOVED_ONE:
      return { label: 'Loved One', color: 'blue', icon: IconUsers };
  }
}

function PendingRequestCard({
  subscriber,
  onApprove,
  onReject,
  isLoading,
}: {
  subscriber?: SubscriberInfo;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}) {
  const name = subscriber ? `${subscriber.firstName} ${subscriber.lastName}` : 'Loading...';
  const initials = subscriber ? `${subscriber.firstName[0]}${subscriber.lastName[0] || ''}` : '?';

  return (
    <div className={classes.pendingCard}>
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <Avatar size={44} radius="xl" color="orange" variant="light">
          {initials}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" className={classes.cropText}>
            {name}
          </Text>
          <Text size="xs" className={classes.subtleText}>
            wants to join your circle
          </Text>
        </div>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Tooltip label="Accept">
          <ActionIcon
            variant="filled"
            color="teal"
            size="lg"
            radius="xl"
            loading={isLoading}
            onClick={onApprove}
          >
            <IconCheck size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Decline">
          <ActionIcon
            variant="light"
            color="red"
            size="lg"
            radius="xl"
            loading={isLoading}
            onClick={onReject}
          >
            <IconX size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </div>
  );
}

function SubscriberCard({
  subscription,
  subscriber,
}: {
  subscription: SubscriptionReadModel;
  subscriber?: SubscriberInfo;
}) {
  const name = subscriber ? `${subscriber.firstName} ${subscriber.lastName}` : 'Loading...';
  const initials = subscriber ? `${subscriber.firstName[0]}${subscriber.lastName[0] || ''}` : '?';

  const roleConfig = getRoleConfig(subscription.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className={classes.subscriberCard}>
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <Avatar size={44} radius="xl" color={roleConfig.color} variant="light">
          {initials}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" className={classes.cropText}>
            {name}
          </Text>
          <Badge
            color={roleConfig.color}
            variant="light"
            size="sm"
            leftSection={<RoleIcon size={12} />}
          >
            {roleConfig.label}
          </Badge>
        </div>
      </Group>
      <ManageSubscriptionMenu
        subscriptionId={subscription.subscription_id}
        status="subscribed"
        currentRole={subscription.role}
      />
    </div>
  );
}

function BlockedRow({
  subscriber,
  onUnblock,
  isLoading,
}: {
  subscriber?: SubscriberInfo;
  onUnblock: () => void;
  isLoading: boolean;
}) {
  const name = subscriber ? `${subscriber.firstName} ${subscriber.lastName}` : 'Loading...';
  const initials = subscriber ? `${subscriber.firstName[0]}${subscriber.lastName[0] || ''}` : '?';

  return (
    <div className={classes.blockedRow}>
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <Avatar size={32} radius="xl" color="gray" variant="light">
          {initials}
        </Avatar>
        <Text size="sm" className={classes.blockedName}>
          {name}
        </Text>
      </Group>
      <Tooltip label="Unblock">
        <ActionIcon
          variant="light"
          color="gray"
          size="md"
          radius="xl"
          loading={isLoading}
          onClick={onUnblock}
        >
          <IconBan size={16} />
        </ActionIcon>
      </Tooltip>
    </div>
  );
}

export function SubscribersView() {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { isPending, isError, data: subscriptions } = useLabourSubscriptions(client, labourId!);
  const { isPending: usersPending, data: users = [] } = useUsers(client, labourId!);

  const approveSubscriberMutation = useApproveSubscriber(client);
  const removeSubscriberMutation = useRemoveSubscriber(client);
  const unblockSubscriberMutation = useUnblockSubscriber(client);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);

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

  const pending: Array<SubscriptionReadModel & { subscriber?: SubscriberInfo }> = [];
  const active: Array<SubscriptionReadModel & { subscriber?: SubscriberInfo }> = [];
  const blocked: Array<SubscriptionReadModel & { subscriber?: SubscriberInfo }> = [];

  subscriptions?.forEach((sub) => {
    const withInfo = { ...sub, subscriber: subscriberById[sub.subscriber_id] };

    if (sub.status === 'REQUESTED') {
      pending.push(withInfo);
    } else if (sub.status === 'BLOCKED') {
      blocked.push(withInfo);
    } else if (sub.status === 'SUBSCRIBED') {
      active.push(withInfo);
    }
  });

  const roleOrder = {
    [SubscriberRole.BIRTH_PARTNER]: 0,
    [SubscriberRole.SUPPORT_PERSON]: 1,
    [SubscriberRole.LOVED_ONE]: 2,
  };
  active.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  const handleAction = (subscriptionId: string, action: () => void) => {
    setLoadingId(subscriptionId);
    action();
    setTimeout(() => setLoadingId(null), 500);
  };

  const hasNoSubscribers = active.length === 0 && pending.length === 0;

  if (hasNoSubscribers && blocked.length === 0) {
    return (
      <div className={baseClasses.emptyState}>
        <Text fz={{ base: 'sm', xs: 'md' }} ta="center">
          No subscribers yet. Share your link in the Share tab to invite loved ones.
        </Text>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {pending.length > 0 && (
        <section className={classes.pendingSection}>
          <Text size="xs" fw={600} className={classes.pendingLabel} mb="sm">
            {pending.length} {pending.length === 1 ? 'person wants' : 'people want'} to join
          </Text>
          <Stack gap="sm">
            {pending.map((sub) => (
              <PendingRequestCard
                key={sub.subscription_id}
                subscriber={sub.subscriber}
                isLoading={loadingId === sub.subscription_id}
                onApprove={() =>
                  handleAction(sub.subscription_id, () =>
                    approveSubscriberMutation.mutate({
                      labourId: labourId!,
                      subscriptionId: sub.subscription_id,
                    })
                  )
                }
                onReject={() =>
                  handleAction(sub.subscription_id, () =>
                    removeSubscriberMutation.mutate({
                      labourId: labourId!,
                      subscriptionId: sub.subscription_id,
                    })
                  )
                }
              />
            ))}
          </Stack>
        </section>
      )}

      {active.length > 0 && (
        <Stack gap="sm">
          {active.map((sub) => (
            <SubscriberCard
              key={sub.subscription_id}
              subscription={sub}
              subscriber={sub.subscriber}
            />
          ))}
        </Stack>
      )}

      {active.length === 0 && pending.length === 0 && (
        <div className={`${baseClasses.emptyState} ${baseClasses.emptyStateGray}`}>
          <Text size="sm" ta="center">
            No active subscribers yet. Share your link in the Share tab to invite loved ones.
          </Text>
        </div>
      )}

      {blocked.length > 0 && (
        <section className={classes.blockedSection}>
          <UnstyledButton
            className={classes.blockedToggle}
            onClick={() => setShowBlocked(!showBlocked)}
          >
            <Group gap="xs">
              <IconBan size={14} />
              <Text size="xs" fw={500}>
                {blocked.length} blocked
              </Text>
            </Group>
            {showBlocked ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </UnstyledButton>
          <Collapse in={showBlocked}>
            <Stack gap="xs" mt="sm">
              {blocked.map((sub) => (
                <BlockedRow
                  key={sub.subscription_id}
                  subscriber={sub.subscriber}
                  isLoading={loadingId === sub.subscription_id}
                  onUnblock={() =>
                    handleAction(sub.subscription_id, () =>
                      unblockSubscriberMutation.mutate({
                        labourId: labourId!,
                        subscriptionId: sub.subscription_id,
                      })
                    )
                  }
                />
              ))}
            </Stack>
          </Collapse>
        </section>
      )}
    </div>
  );
}
