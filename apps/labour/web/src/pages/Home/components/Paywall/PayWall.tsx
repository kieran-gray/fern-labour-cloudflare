import { useLabourSession } from '@base/contexts';
import { useCreateCheckoutSession, useLabourClient } from '@base/hooks';
import { Card } from '@components/Cards/Card';
import { IconArrowUp } from '@tabler/icons-react';
import { Button, Text } from '@mantine/core';
import image from './ShareMore.svg';
import baseClasses from '@styles/base.module.css';

export const PayWall = () => {
  const { subscription, labourId } = useLabourSession();
  const subscriptionId = subscription?.subscription_id;
  const client = useLabourClient();
  const createCheckout = useCreateCheckoutSession(client);

  const handleUpgrade = () => {
    const baseUrl = window.location.href.split('?')[0];
    const returnURL = new URL(baseUrl);
    returnURL.searchParams.set('tab', 'details');

    const successUrl = new URL(returnURL);
    successUrl.searchParams.set('prompt', 'contactMethods');

    const cancelUrl = new URL(returnURL);
    cancelUrl.searchParams.set('cancelled', 'true');

    createCheckout.mutate({
      labourId: labourId!,
      subscriptionId: subscriptionId!,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
    });
  };

  const description = (
    <>
      Upgrade to get live notifications straight to your phone.
      <br />
      Stay connected with SMS or WhatsApp alerts and never miss an update.
    </>
  );

  return (
    <Card
      title="Want live notifications?"
      description={description}
      image={{ src: image, width: 460, height: 356 }}
      mobileImage={{ src: image, width: 280, height: 220 }}
    >
      <Button
        leftSection={<IconArrowUp size={18} stroke={1.5} />}
        variant="filled"
        radius="xl"
        size="lg"
        mt={10}
        disabled={createCheckout.isPending}
        onClick={handleUpgrade}
      >
        Upgrade now
      </Button>
      <Text mt={15} size="xs" className={baseClasses.description}>
        *SMS messages are only supported for UK (+44) phone numbers{' '}
      </Text>
    </Card>
  );
};
