import { useCallback } from 'react';
import { LABOUR_UPDATE_MAX_LENGTH } from '@base/lib/constants';
import { IconPencil } from '@tabler/icons-react';
import { Button, Modal, Stack, Text, Textarea } from '@mantine/core';
import classes from './UpdateModals.module.css';
import modalClasses from '@styles/modal.module.css';

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
  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (event.currentTarget.value.length <= LABOUR_UPDATE_MAX_LENGTH) {
        onChange(event.currentTarget.value);
      }
    },
    [onChange]
  );

  const characterCount = message.length;
  const isNearLimit = characterCount >= LABOUR_UPDATE_MAX_LENGTH * 0.8;
  const isAtLimit = characterCount >= LABOUR_UPDATE_MAX_LENGTH;

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
      title="Edit Status Update"
    >
      <Stack gap="md">
        <Text className={classes.description}>
          Make changes to your status update. Subscribers will see the updated message.
        </Text>

        <div className={classes.textareaSection}>
          <div className={classes.textareaLabel}>
            <IconPencil size={14} />
            <span>Message</span>
          </div>
          <Textarea
            placeholder="What would you like to share?"
            value={message}
            onChange={handleMessageChange}
            minRows={3}
            maxRows={6}
            size="md"
            classNames={{ input: classes.textarea }}
            autosize
          />
          <div className={classes.textareaFooter}>
            <Text
              className={`${classes.characterCount} ${isAtLimit ? classes.characterCountAtLimit : isNearLimit ? classes.characterCountNearLimit : ''}`}
            >
              {characterCount}/{LABOUR_UPDATE_MAX_LENGTH}
            </Text>
          </div>
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
          <Button
            size="sm"
            radius="lg"
            onClick={() => onConfirm()}
            disabled={message.trim() === ''}
          >
            Save Changes
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
