import { useState } from 'react';
import { SubscriberContactMethod, SubscriptionReadModel } from '@base/clients/labour_service';
import { useLabourSession } from '@base/contexts';
import { useLabourClient } from '@base/hooks';
import { useUpdateNotificationMethods } from '@base/hooks/useLabourData';
import { IconBellOff, IconBrandWhatsapp, IconCheck, IconMessageCircle } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Stack, Text, UnstyledButton } from '@mantine/core';
import classes from './ContactMethodsModal.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

type NotificationOption = SubscriberContactMethod | 'NONE';

const NOTIFICATION_OPTIONS = [
  {
    value: SubscriberContactMethod.WHATSAPP as NotificationOption,
    name: 'WhatsApp',
    description: 'Receive updates via WhatsApp messages',
    icon: IconBrandWhatsapp,
    dataMethod: 'whatsapp',
  },
  {
    value: SubscriberContactMethod.SMS as NotificationOption,
    name: 'Text Message',
    description: 'Receive updates via SMS',
    icon: IconMessageCircle,
    dataMethod: 'sms',
  },
  {
    value: 'NONE' as NotificationOption,
    name: 'None',
    description: "Don't send me notifications",
    icon: IconBellOff,
    dataMethod: 'none',
  },
];

export default function ContactMethodsModal({
  subscription,
  opened,
  close,
}: {
  subscription: SubscriptionReadModel;
  opened: boolean;
  close: CloseFunctionType;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { labourId } = useLabourSession();
  const prompt = searchParams.get('prompt');

  const getInitialSelection = (): NotificationOption => {
    if (subscription.contact_methods.includes(SubscriberContactMethod.WHATSAPP)) {
      return SubscriberContactMethod.WHATSAPP;
    }
    if (subscription.contact_methods.includes(SubscriberContactMethod.SMS)) {
      return SubscriberContactMethod.SMS;
    }
    return 'NONE';
  };

  const [selected, setSelected] = useState<NotificationOption>(getInitialSelection());

  const client = useLabourClient();
  const mutation = useUpdateNotificationMethods(client);

  const handleClose = () => {
    searchParams.delete('prompt');
    setSearchParams(searchParams);
    close();
  };

  const handleSave = () => {
    const methods = selected === 'NONE' ? [] : [selected];
    const requestBody = {
      labourId: labourId!,
      subscriptionId: subscription.subscription_id,
      methods,
    };
    mutation.mutate(requestBody, {
      onSuccess: () => {
        if (prompt === 'contactMethods') {
          searchParams.delete('prompt');
          setSearchParams(searchParams);
        }
        close();
      },
    });
  };

  const initialSelection = getInitialSelection();
  const hasChanged = selected !== initialSelection;

  return (
    <Modal
      opened={opened}
      closeOnClickOutside
      onClose={handleClose}
      title="Notification Preferences"
      centered
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      classNames={{
        content: modalClasses.modalRoot,
        header: modalClasses.modalHeader,
        title: modalClasses.modalTitle,
        body: modalClasses.modalBody,
        close: modalClasses.closeButton,
      }}
    >
      <Stack gap="lg">
        <Text className={classes.description}>
          Choose how you'd like to receive updates about this labour.
        </Text>

        <div className={classes.methodsGrid}>
          {NOTIFICATION_OPTIONS.map(({ value, name, description, icon: Icon, dataMethod }) => {
            const isSelected = selected === value;

            return (
              <UnstyledButton
                key={value}
                onClick={() => setSelected(value)}
                className={classes.methodCard}
                data-selected={isSelected || undefined}
                data-method={dataMethod}
              >
                <div className={classes.methodCardContent}>
                  <div className={classes.methodIconWrapper} data-method={dataMethod}>
                    <Icon size={22} />
                  </div>
                  <div className={classes.methodInfo}>
                    <Text className={classes.methodName}>{name}</Text>
                    <Text className={classes.methodDescription}>{description}</Text>
                  </div>
                </div>
                <div className={classes.checkCircle} data-selected={isSelected || undefined}>
                  {isSelected && <IconCheck size={14} />}
                </div>
              </UnstyledButton>
            );
          })}
        </div>

        <div className={classes.actionRow}>
          <Button
            size="sm"
            radius="lg"
            variant="default"
            className={classes.cancelButton}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            radius="lg"
            onClick={handleSave}
            loading={mutation.isPending}
            disabled={!hasChanged}
          >
            Save Preferences
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
