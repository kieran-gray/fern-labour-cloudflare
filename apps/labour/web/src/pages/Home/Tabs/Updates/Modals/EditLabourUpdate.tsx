import { useCallback } from 'react';
import { LABOUR_UPDATE_MAX_LENGTH } from '@base/lib/constants';
import { Button, Group, Modal, Stack, Textarea } from '@mantine/core';
import baseClasses from '@styles/base.module.css';
import classes from '@styles/modal.module.css';

export default function EditLabourUpdateModal({
  message,
  opened,
  onConfirm,
  onChange,
  onCancel,
}: {
  message: string;
  opened: boolean;
  onConfirm: Function;
  onChange: Function;
  onCancel: Function;
}) {
  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (event.currentTarget.value.length <= LABOUR_UPDATE_MAX_LENGTH) {
      onChange(event.currentTarget.value);
    }
  }, []);

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
      title="Edit status update"
    >
      <Stack gap="md">
        <Textarea
          label="Your status update"
          placeholder="Enter your updated message..."
          value={message}
          onChange={handleMessageChange}
          minRows={3}
          maxRows={6}
          radius="md"
          size="sm"
          classNames={{ input: baseClasses.input, label: baseClasses.description }}
          autosize
        />
        <Group justify="flex-end" gap="sm">
          <Button size="sm" radius="md" variant="default" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button
            size="sm"
            radius="md"
            onClick={() => onConfirm()}
            disabled={message.trim() === ''}
          >
            Save changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
