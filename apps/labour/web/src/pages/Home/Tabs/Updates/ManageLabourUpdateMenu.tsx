import { useState } from 'react';
import { LabourUpdateType } from '@base/clients/labour_service';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import {
  useDeleteLabourUpdate,
  useUpdateLabourUpdateMessage,
  useUpdateLabourUpdateType,
} from '@base/hooks/useLabourData';
import { Error } from '@components/Notifications';
import { IconDots, IconPencil, IconSpeakerphone, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import ConfirmAnnouncementModal from './Modals/ConfirmAnnouncement';
import EditLabourUpdateModal from './Modals/EditLabourUpdate';
import baseClasses from '@styles/base.module.css';

interface ManageLabourUpdateMenuProps {
  statusUpdateId: string;
  currentMessage?: string;
}

export function ManageLabourUpdateMenu({
  statusUpdateId,
  currentMessage = '',
}: ManageLabourUpdateMenuProps) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [announceOpened, { open: openAnnounce, close: closeAnnounce }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editMessage, setEditMessage] = useState(currentMessage);
  const { labourId } = useLabourSession();

  const client = useLabourClient();
  const updateTypeMutation = useUpdateLabourUpdateType(client);
  const updateMessageMutation = useUpdateLabourUpdateMessage(client);
  const deleteMutation = useDeleteLabourUpdate(client);

  const handleEditStatusUdpate = async (newMessage: string) => {
    const requestBody = {
      labourId: labourId!,
      labourUpdateId: statusUpdateId,
      message: newMessage,
    };
    await updateMessageMutation.mutateAsync(requestBody);
    closeEdit();
  };
  const handleAnnounceStatusUdpate = async () => {
    const requestBody = {
      labourId: labourId!,
      labourUpdateId: statusUpdateId,
      labourUpdateType: LabourUpdateType.ANNOUNCEMENT,
    };
    await updateTypeMutation.mutateAsync(requestBody);
  };

  const handleConfirmDelete = () => {
    closeDelete();
    const requestBody = {
      labourId: labourId!,
      labourUpdateId: statusUpdateId,
    };
    deleteMutation.mutate(requestBody);
  };

  const handleCancelDelete = () => {
    closeDelete();
  };

  const handleConfirmAnnounce = () => {
    closeAnnounce();
    handleAnnounceStatusUdpate();
  };

  const handleCancelAnnounce = () => {
    closeAnnounce();
  };

  const handleEdit = () => {
    openEdit();
    setEditMessage(currentMessage);
  };

  const handleSaveEdit = () => {
    if (editMessage.trim() === '') {
      notifications.show({
        ...Error,
        title: 'Error',
        message: 'Message cannot be empty',
      });
      return;
    }
    handleEditStatusUdpate(editMessage.trim());
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
          <Menu.Label className={baseClasses.actionMenuLabel}>Manage Update</Menu.Label>
          <Menu.Item
            leftSection={<IconPencil size={20} stroke={1.5} />}
            className={baseClasses.actionMenuOk}
            onClick={() => {
              if (!statusUpdateId.startsWith('mock-')) {
                handleEdit();
              }
            }}
          >
            Edit
          </Menu.Item>
          <Menu.Item
            leftSection={<IconSpeakerphone size={20} stroke={1.5} />}
            className={baseClasses.actionMenuDanger}
            onClick={() => {
              if (!statusUpdateId.startsWith('mock-')) {
                openAnnounce();
              }
            }}
          >
            Announce
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size={20} stroke={1.5} />}
            className={baseClasses.actionMenuDanger}
            onClick={() => {
              if (!statusUpdateId.startsWith('mock-')) {
                openDelete();
              }
            }}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <EditLabourUpdateModal
        message={editMessage}
        opened={editOpened}
        onConfirm={handleSaveEdit}
        onCancel={closeEdit}
        onChange={setEditMessage}
      />
      <ConfirmAnnouncementModal
        message={editMessage}
        opened={announceOpened}
        onConfirm={handleConfirmAnnounce}
        onCancel={handleCancelAnnounce}
      />
      <GenericConfirmModal
        isOpen={deleteOpened}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete status update?"
        confirmText="Delete"
      />
    </>
  );
}
