import { SubscriptionReadModel } from '@base/clients/labour_service';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContactMethodsModal from './ContactMethodsModal';
import classes from './ContactMethodsModal.module.css';
import baseClasses from '@styles/base.module.css';

export function warnNoNumberSet(
  contactMethods: string[],
  phone_number: string | null
): string | null {
  let warning = null;
  if (
    (contactMethods.includes('sms') || contactMethods.includes('whatsapp')) &&
    phone_number === null
  ) {
    warning =
      "You have selected to receive sms or whatsapp alerts but you don't have a phone number set on your profile. Set one by clicking 'Update Profile' in the app menu.";
  }
  return warning;
}

export function warnNonUKNumber(
  contactMethods: string[],
  phone_number: string | null
): string | null {
  let warning = null;
  if (contactMethods.includes('sms') && phone_number !== null && !phone_number.startsWith('+44')) {
    warning =
      "Your mobile number isn't from the UK (it doesn't start with +44). Unfortunately we can only send SMS messages to UK numbers at this time, please select WhatsApp for international messaging.";
  }
  return warning;
}

export default function ContactMethods({ subscription }: { subscription: SubscriptionReadModel }) {
  const [searchParams] = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const prompt = searchParams.get('prompt');

  const { user, isLoaded } = useUser();

  let contactMethodsWarning = null;
  if (isLoaded) {
    contactMethodsWarning =
      warnNoNumberSet(subscription.contact_methods, user?.primaryPhoneNumber?.phoneNumber || '') ||
      warnNonUKNumber(subscription.contact_methods, user?.primaryPhoneNumber?.phoneNumber || '');
  }

  const selectedContactMethods = subscription.contact_methods.map((method) => (
    <Badge key={method} variant="filled" size="lg" color="var(--mantine-primary-color-4)">
      {method}
    </Badge>
  ));

  const description =
    "Choose how you want to hear about updates during labour. Select your preferred notification methods so you don't miss any important moments.";

  return (
    <>
      <div className={baseClasses.root}>
        <div className={baseClasses.body}>
          <div className={baseClasses.inner} style={{ paddingBottom: 0 }}>
            <div className={classes.content} style={{ marginRight: 0 }}>
              <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                Your contact methods
              </Title>
              <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
                {description}
              </Text>
            </div>
          </div>
          <div
            className={baseClasses.inner}
            style={{ paddingTop: 0, paddingBottom: 0, marginTop: 10 }}
          >
            <div className={baseClasses.content}>
              {subscription.contact_methods.length === 0 && (
                <div style={{ marginTop: '10px' }}>
                  <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
                    You will only receive live notifications if you add your preferred methods below
                  </Text>
                </div>
              )}
              {contactMethodsWarning != null && (
                <div style={{ marginBottom: '20px' }}>
                  <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
                    {contactMethodsWarning}
                  </Text>
                </div>
              )}
              {subscription.contact_methods.length > 0 && (
                <div className={classes.infoRow} style={{ marginTop: '10px' }}>
                  {selectedContactMethods}
                </div>
              )}
            </div>
          </div>
          <div className={baseClasses.inner} style={{ paddingTop: 0 }}>
            <div className={classes.submitRow}>
              <Button
                variant="filled"
                radius="xl"
                size="md"
                h={48}
                onClick={() => open()}
                className={classes.submitButton}
                styles={{ section: { marginRight: 22 } }}
                type="submit"
              >
                Update Contact Methods
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ContactMethodsModal
        subscription={subscription}
        opened={opened || prompt === 'contactMethods'}
        close={close}
      />
    </>
  );
}
