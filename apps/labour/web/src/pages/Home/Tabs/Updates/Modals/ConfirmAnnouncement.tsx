import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import classes from '@styles/modal.module.css';

export default function ConfirmAnnouncementModal({
  message,
  onConfirm,
  onCancel,
  opened,
}: {
  message: string;
  onConfirm: Function;
  onCancel: Function;
  opened: boolean;
}) {
  return (
    <Modal
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      classNames={{
        content: classes.modalRoot,
        header: classes.modalHeader,
        title: classes.modalTitle,
        body: classes.modalBody,
        close: classes.closeButton,
      }}
      opened={opened}
      centered
      closeOnClickOutside
      onClose={() => onCancel()}
      title="Make announcement?"
    >
      <Stack gap="md">
        <Text className={classes.modalText}>
          Announcements will be broadcast to any subscribers who have notifications enabled. The
          message cannot be edited or deleted.
        </Text>
        <div className={classes.modalInnerTextContainer}>
          <Text className={classes.modalInnerText}>{message}</Text>
        </div>
        <Group justify="flex-end" gap="sm">
          <Button size="sm" radius="md" variant="default" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button size="sm" radius="md" onClick={() => onConfirm()}>
            Announce
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
