import { useState } from 'react';
import { SubscriberRole } from '@base/clients/labour_service';
import { IconCheck, IconHeart, IconSparkles, IconUsers } from '@tabler/icons-react';
import { Button, Group, Modal, Stack, Text, UnstyledButton } from '@mantine/core';
import classes from './ChangeRoleModal.module.css';
import modalClasses from '@styles/modal.module.css';

interface ChangeRoleModalProps {
  isOpen: boolean;
  currentRole: SubscriberRole;
  onConfirm: (newRole: SubscriberRole) => void;
  onCancel: () => void;
}

const ROLE_OPTIONS = [
  {
    role: SubscriberRole.BIRTH_PARTNER,
    label: 'Birth Partner',
    description: 'Can send updates, track contractions, and view statistics',
    icon: IconHeart,
    color: 'pink',
  },
  {
    role: SubscriberRole.SUPPORT_PERSON,
    label: 'Support Person',
    description: 'Can view updates and statistics in real-time',
    icon: IconSparkles,
    color: 'violet',
  },
  {
    role: SubscriberRole.LOVED_ONE,
    label: 'Loved One',
    description: 'Receives milestone notifications only',
    icon: IconUsers,
    color: 'blue',
  },
];

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
        content: modalClasses.modalRoot,
        header: modalClasses.modalHeader,
        title: modalClasses.modalTitle,
        body: modalClasses.modalBody,
        close: modalClasses.closeButton,
      }}
      opened={isOpen}
      centered
      onClose={onCancel}
      title="Change Role"
    >
      <Text className={modalClasses.modalText} mb="lg">
        Choose the level of access for this subscriber.
      </Text>

      <Stack gap="sm">
        {ROLE_OPTIONS.map(({ role, label, description, icon: Icon, color }) => {
          const isSelected = selectedRole === role;
          const isCurrent = currentRole === role;

          return (
            <UnstyledButton
              key={role}
              onClick={() => setSelectedRole(role)}
              className={classes.roleOption}
              data-selected={isSelected || undefined}
              data-color={color}
            >
              <div className={classes.roleOptionContent}>
                <div
                  className={classes.roleIconWrapper}
                  data-color={color}
                  data-selected={isSelected || undefined}
                >
                  <Icon size={20} />
                </div>
                <div className={classes.roleInfo}>
                  <Group gap="xs" align="center">
                    <Text fw={600} size="sm">
                      {label}
                    </Text>
                    {isCurrent && (
                      <Text size="xs" className={classes.currentBadge}>
                        Current
                      </Text>
                    )}
                  </Group>
                  <Text size="xs" className={classes.roleDescription}>
                    {description}
                  </Text>
                </div>
              </div>
              <div className={classes.checkCircle} data-selected={isSelected || undefined}>
                {isSelected && <IconCheck size={14} />}
              </div>
            </UnstyledButton>
          );
        })}
      </Stack>

      <Group mt="xl" grow>
        <Button variant="light" radius="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button radius="lg" onClick={handleConfirm} disabled={selectedRole === currentRole}>
          Change Role
        </Button>
      </Group>
    </Modal>
  );
}
