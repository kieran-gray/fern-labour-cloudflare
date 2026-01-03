import { useState } from 'react';
import { SubscriberRole } from '@base/clients/labour_service';
import { IconEye, IconHeart, IconUsers } from '@tabler/icons-react';
import { Button, Modal, Radio, Space, Stack, Text } from '@mantine/core';
import { getRoleLabel } from './RoleBadge';
import baseClasses from '@styles/base.module.css';
import classes from '@styles/modal.module.css';

interface ChangeRoleModalProps {
  isOpen: boolean;
  currentRole: SubscriberRole;
  onConfirm: (newRole: SubscriberRole) => void;
  onCancel: () => void;
}

export function ChangeRoleModal({
  isOpen,
  currentRole,
  onConfirm,
  onCancel,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<SubscriberRole>(currentRole);

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

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
      opened={isOpen}
      centered
      onClose={onCancel}
      title="Change Subscriber Role"
    >
      <Text className={classes.modalText}>Select the new role for this subscriber:</Text>
      <Space h="md" />

      <Radio.Group
        value={selectedRole}
        onChange={(value) => setSelectedRole(value as SubscriberRole)}
      >
        <Stack gap="md">
          <Radio
            value={SubscriberRole.BIRTH_PARTNER}
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconHeart size={18} />
                <Text fw={500}>{getRoleLabel(SubscriberRole.BIRTH_PARTNER)}</Text>
              </div>
            }
            description={
              <Text size="sm" className={baseClasses.description}>
                Can send updates, track contractions, and view statistics
              </Text>
            }
          />
          <Radio
            value={SubscriberRole.SUPPORT_PERSON}
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconEye size={18} />
                <Text fw={500}>{getRoleLabel(SubscriberRole.SUPPORT_PERSON)}</Text>
              </div>
            }
            description={
              <Text size="sm" className={baseClasses.description}>
                Can view updates and statistics
              </Text>
            }
          />
          <Radio
            value={SubscriberRole.LOVED_ONE}
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconUsers size={18} />
                <Text fw={500}>{getRoleLabel(SubscriberRole.LOVED_ONE)}</Text>
              </div>
            }
            description={
              <Text size="sm" className={baseClasses.description}>
                Can view updates
              </Text>
            }
          />
        </Stack>
      </Radio.Group>

      <Space h="xl" />
      <div className={baseClasses.flexRowNoBP}>
        <Button style={{ flex: 1, marginRight: 5 }} variant="light" radius="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          style={{ flex: 1, marginLeft: 5 }}
          radius="lg"
          onClick={handleConfirm}
          disabled={selectedRole === currentRole}
        >
          Change Role
        </Button>
      </div>
    </Modal>
  );
}
