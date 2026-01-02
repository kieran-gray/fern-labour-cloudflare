import { useState } from 'react';
import { SubscriberRole } from '@base/clients/labour_service';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import {
  useBlockSubscriber,
  useRemoveSubscriber,
  useUpdateSubscriberRole,
} from '@base/hooks/useLabourData';
import { IconBan, IconCircleMinus, IconDots, IconSwitchHorizontal } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';
import { ChangeRoleModal } from './ChangeRoleModal';
import baseClasses from '@styles/base.module.css';

export function ManageSubscriptionMenu({
  subscriptionId,
  status,
  currentRole,
}: {
  subscriptionId: string;
  status: string;
  currentRole?: SubscriberRole;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [action, setAction] = useState('');
  const { labourId } = useLabourSession();

  const client = useLabourClient();
  const removeSubscriberMutation = useRemoveSubscriber(client);
  const blockSubscriberMutation = useBlockSubscriber(client);
  const updateRoleMutation = useUpdateSubscriberRole(client);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    if (action === 'remove') {
      removeSubscriberMutation.mutate({ labourId: labourId!, subscriptionId });
    } else if (action === 'block') {
      blockSubscriberMutation.mutate({ labourId: labourId!, subscriptionId });
    }
  };

  const handleRoleChange = (newRole: SubscriberRole) => {
    setIsRoleModalOpen(false);
    updateRoleMutation.mutate({ labourId: labourId!, subscriptionId, role: newRole });
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
          {status === 'subscribed' && (
            <>
              <Menu.Item
                className={baseClasses.actionMenuDefault}
                leftSection={<IconSwitchHorizontal size={20} stroke={1.5} />}
                onClick={() => setIsRoleModalOpen(true)}
              >
                Change role
              </Menu.Item>
              <Menu.Item
                className={baseClasses.actionMenuDanger}
                leftSection={<IconCircleMinus size={20} stroke={1.5} />}
                onClick={() => {
                  setAction('remove');
                  setIsModalOpen(true);
                }}
              >
                Remove
              </Menu.Item>
            </>
          )}
          <Menu.Item
            className={baseClasses.actionMenuDanger}
            leftSection={<IconBan size={20} stroke={1.5} />}
            onClick={() => {
              setAction('block');
              setIsModalOpen(true);
            }}
          >
            Block
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <GenericConfirmModal
        isOpen={isModalOpen}
        title={action === 'block' ? 'Block Subscriber?' : 'Remove Subscriber?'}
        confirmText={action === 'block' ? 'Block' : 'Remove'}
        message="This can't be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous
      />
      {currentRole && (
        <ChangeRoleModal
          isOpen={isRoleModalOpen}
          currentRole={currentRole}
          onConfirm={handleRoleChange}
          onCancel={() => setIsRoleModalOpen(false)}
        />
      )}
    </>
  );
}
