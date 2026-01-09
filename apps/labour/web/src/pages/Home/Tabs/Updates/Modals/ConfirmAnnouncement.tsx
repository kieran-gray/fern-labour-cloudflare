import { IconAlertTriangle, IconSpeakerphone } from '@tabler/icons-react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import classes from './UpdateModals.module.css';
import modalClasses from '@styles/modal.module.css';

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
        content: modalClasses.modalRoot,
        header: modalClasses.modalHeader,
        title: modalClasses.modalTitle,
        body: modalClasses.modalBody,
        close: modalClasses.closeButton,
      }}
      opened={opened}
      centered
      closeOnClickOutside
      onClose={() => onCancel()}
      title="Make Announcement"
    >
      <Stack gap="md">
        <div className={classes.warningNotice}>
          <IconAlertTriangle size={18} className={classes.warningIcon} />
          <Text className={classes.warningText}>
            This will notify all subscribers with notifications enabled. Announcements cannot be
            edited or deleted.
          </Text>
        </div>

        <div className={classes.messagePreview}>
          <div className={classes.messagePreviewLabel}>
            <IconSpeakerphone size={14} />
            <span>Your message</span>
          </div>
          <Text className={classes.messagePreviewText}>{message}</Text>
        </div>

        <div className={classes.actionRow}>
          <Button
            size="sm"
            radius="lg"
            variant="default"
            className={classes.cancelButton}
            onClick={() => onCancel()}
          >
            Cancel
          </Button>
          <Button size="sm" radius="lg" onClick={() => onConfirm()}>
            Send Announcement
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
