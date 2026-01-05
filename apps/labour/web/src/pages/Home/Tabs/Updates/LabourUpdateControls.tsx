import { useCallback, useState } from 'react';
import { LabourUpdateType } from '@base/clients/labour_service';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient, usePostLabourUpdate } from '@base/hooks';
import { LABOUR_UPDATE_MAX_LENGTH } from '@base/lib/constants';
import { useNetworkState } from '@base/offline/sync/networkDetector';
import { IconSend, IconSpeakerphone, IconWifiOff } from '@tabler/icons-react';
import { Button, Group, Switch, Text, Textarea } from '@mantine/core';
import ConfirmAnnouncementModal from './Modals/ConfirmAnnouncement';
import baseClasses from '@styles/base.module.css';

export function LabourUpdateControls() {
  const [message, setMessage] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { labourId } = useLabourSession();
  const { isOnline } = useNetworkState();

  const client = useLabourClient();
  const mutation = usePostLabourUpdate(client);

  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (event.currentTarget.value.length <= LABOUR_UPDATE_MAX_LENGTH) {
      setMessage(event.currentTarget.value);
    }
  }, []);

  const handlePost = () => {
    const updateType = isAnnouncement
      ? LabourUpdateType.ANNOUNCEMENT
      : LabourUpdateType.STATUS_UPDATE;

    mutation.mutate(
      { labourId: labourId!, updateType, message },
      {
        onSuccess: () => {
          setMessage('');
          setIsAnnouncement(false);
        },
      }
    );
  };

  const handleSend = () => {
    if (isAnnouncement) {
      setIsModalOpen(true);
    } else {
      handlePost();
    }
  };

  const handleConfirmAnnouncement = () => {
    setIsModalOpen(false);
    handlePost();
  };

  if (!isOnline) {
    return (
      <Group justify="center" gap="xs" py="xs">
        <IconWifiOff size={18} color="var(--mantine-color-red-5)" />
        <Text size="sm" className={baseClasses.description}>
          <Text span fw={500} c="red.6">
            Offline
          </Text>{' '}
          - updates paused
        </Text>
      </Group>
    );
  }

  const hasMessage = message.trim().length > 0;

  return (
    <>
      <Textarea
        placeholder={isAnnouncement ? 'Write your announcement...' : "What's happening?"}
        value={message}
        onChange={handleMessageChange}
        size="sm"
        radius="md"
        minRows={2}
        autosize
        classNames={{
          input: baseClasses.input,
        }}
      />

      <Group justify="space-between" mt="md" w="100%" wrap="nowrap">
        <Switch
          checked={isAnnouncement}
          onChange={(event) => setIsAnnouncement(event.currentTarget.checked)}
          color="pink"
          size="lg"
          thumbIcon={<IconSpeakerphone size={14} color="var(--mantine-color-pink-6)" />}
        />

        <Button
          rightSection={<IconSend size={16} />}
          radius="lg"
          size="sm"
          variant="filled"
          color={isAnnouncement ? 'pink' : undefined}
          disabled={!hasMessage}
          loading={mutation.isPending}
          onClick={handleSend}
        >
          {isAnnouncement ? 'Announce' : 'Post'}
        </Button>
      </Group>

      <ConfirmAnnouncementModal
        message={message}
        onConfirm={handleConfirmAnnouncement}
        onCancel={() => setIsModalOpen(false)}
        opened={isModalOpen}
      />
    </>
  );
}
