import { SubscriberContactMethod, SubscriptionReadModel } from '@base/clients/labour_service';
import { Card } from '@base/components/Cards/Card';
import { useUser } from '@clerk/clerk-react';
import {
  IconAlertTriangle,
  IconBellOff,
  IconBrandWhatsapp,
  IconMessageCircle,
  IconSettings,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { ActionIcon, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContactMethodsModal from './ContactMethodsModal';
import classes from './ContactMethods.module.css';

export function warnNoNumberSet(
  contactMethods: string[],
  phoneNumber: string | null
): string | null {
  if ((contactMethods.includes('WHATSAPP') || contactMethods.includes('SMS')) && !phoneNumber) {
    return "You've enabled notifications but don't have a phone number set. Add one in your profile settings.";
  }
  return null;
}

export function warnNonUKNumber(
  contactMethods: string[],
  phoneNumber: string | null
): string | null {
  if (contactMethods.includes('SMS') && phoneNumber && !phoneNumber.startsWith('+44')) {
    return 'SMS is only available for UK numbers (+44). Please switch to WhatsApp for international messaging.';
  }
  return null;
}

function getMethodConfig(method: SubscriberContactMethod) {
  switch (method) {
    case SubscriberContactMethod.WHATSAPP:
      return {
        name: 'WhatsApp',
        icon: IconBrandWhatsapp,
        dataMethod: 'whatsapp',
      };
    case SubscriberContactMethod.SMS:
      return {
        name: 'Text Message',
        icon: IconMessageCircle,
        dataMethod: 'sms',
      };
    default:
      return null;
  }
}

export default function ContactMethods({ subscription }: { subscription: SubscriptionReadModel }) {
  const [searchParams] = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const prompt = searchParams.get('prompt');

  const { user, isLoaded } = useUser();

  let warning: string | null = null;
  if (isLoaded) {
    const phoneNumber = user?.primaryPhoneNumber?.phoneNumber || null;
    warning =
      warnNoNumberSet(subscription.contact_methods, phoneNumber) ||
      warnNonUKNumber(subscription.contact_methods, phoneNumber);
  }

  const hasContactMethod = subscription.contact_methods.length > 0;
  const currentMethod = hasContactMethod
    ? getMethodConfig(subscription.contact_methods[0] as SubscriberContactMethod)
    : null;

  return (
    <>
      <Card title="Notifications" description="How you'll receive updates during labour.">
        <Stack gap="md" mt="md">
          {warning && (
            <div className={classes.warningNotice}>
              <IconAlertTriangle size={18} className={classes.warningIcon} />
              <Text className={classes.warningText}>{warning}</Text>
            </div>
          )}

          {currentMethod ? (
            <div className={classes.currentMethod}>
              <div className={classes.methodInfo}>
                <div className={classes.methodIconWrapper} data-method={currentMethod.dataMethod}>
                  <currentMethod.icon size={22} />
                </div>
                <div className={classes.methodDetails}>
                  <Text className={classes.methodName}>{currentMethod.name}</Text>
                  <Text className={classes.methodStatus} data-active>
                    Notifications enabled
                  </Text>
                </div>
              </div>
              <Tooltip label="Change notification method">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="lg"
                  onClick={open}
                  className={classes.editButton}
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            </div>
          ) : (
            <div className={classes.disabledState}>
              <div className={classes.disabledInfo}>
                <div className={classes.methodIconWrapper} data-method="disabled">
                  <IconBellOff size={22} />
                </div>
                <div className={classes.disabledText}>
                  <Text className={classes.disabledTitle}>Notifications disabled</Text>
                  <Text className={classes.disabledDescription}>
                    You won't receive live updates
                  </Text>
                </div>
              </div>
              <Tooltip label="Enable notifications">
                <ActionIcon
                  variant="light"
                  color="teal"
                  size="lg"
                  radius="lg"
                  onClick={open}
                  className={classes.editButton}
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            </div>
          )}
        </Stack>
      </Card>

      <ContactMethodsModal
        subscription={subscription}
        opened={opened || prompt === 'contactMethods'}
        close={close}
      />
    </>
  );
}
