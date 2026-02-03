import { useState } from 'react';
import { SubscriberStatus, SubscriptionStatusReadModel } from '@base/clients/labour_service/types';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts';
import { queryKeys, useLabourClient, useUnsubscribe } from '@base/hooks';
import { useAuth } from '@clerk/clerk-react';
import { IconDots, IconUserMinus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Menu } from '@mantine/core';
import baseClasses from '@styles/base.module.css';

export function ManageSubscriptionMenu({
  labourId,
  subscriptionId,
}: {
  labourId: string;
  subscriptionId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { clearSubscription, subscription: activeSubscription } = useLabourSession();
  const { userId } = useAuth();

  const queryClient = useQueryClient();
  const client = useLabourClient();
  const unsubscribeMutation = useUnsubscribe(client);

  const handleConfirm = async () => {
    setIsModalOpen(false);

    const queryKey = userId ? queryKeys.subscriptions.listByUser(userId) : null;
    const previousData = queryKey
      ? queryClient.getQueryData<SubscriptionStatusReadModel[]>(queryKey)
      : null;

    await unsubscribeMutation.mutateAsync({ labourId, subscriptionId });

    if (activeSubscription?.subscription_id === subscriptionId) {
      clearSubscription();
    }

    if (queryKey && previousData) {
      queryClient.setQueryData<SubscriptionStatusReadModel[]>(
        queryKey,
        previousData.map((sub) =>
          sub.subscription_id === subscriptionId
            ? { ...sub, status: SubscriberStatus.UNSUBSCRIBED }
            : sub
        )
      );
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom">
        <Menu.Target>
          <ActionIcon variant="subtle" className={baseClasses.actionMenuIcon}>
            <IconDots size={16} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown className={baseClasses.actionMenuDropdown}>
          <Menu.Label className={baseClasses.actionMenuLabel}>Manage Subscription</Menu.Label>
          <Menu.Item
            className={baseClasses.actionMenuDanger}
            leftSection={<IconUserMinus size={20} stroke={1.5} />}
            onClick={() => setIsModalOpen(true)}
          >
            Unsubscribe
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <GenericConfirmModal
        isOpen={isModalOpen}
        title="Unsubscribe?"
        confirmText="Unsubscribe"
        message="This can't be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous
      />
    </>
  );
}
