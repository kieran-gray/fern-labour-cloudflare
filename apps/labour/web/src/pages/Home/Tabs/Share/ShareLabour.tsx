import { useLabourSession } from '@base/contexts';
import { useLabourClient } from '@base/hooks';
import { useSubscriptionToken } from '@base/hooks/useLabourData';
import { CopyButton } from '@components/Buttons/CopyButton';
import { Card } from '@components/Cards/Card';
import { PageLoadingIcon } from '@components/PageLoading/Loading';
import { IconQrcode } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Group, Modal, Space, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import image from './share.svg';
import classes from './ShareLabour.module.css';
import baseClasses from '@styles/base.module.css';
import modalClasses from '@styles/modal.module.css';

function QRButton({ url }: { url: string }) {
  const [opened, { open, close }] = useDisclosure(false);
  const icon = <IconQrcode size={25} />;
  return (
    <>
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
        onClose={close}
        title="Your invite QR code"
      >
        <Space h="lg" />
        <div className={baseClasses.flexRow} style={{ width: '100%' }}>
          <QRCodeSVG
            value={url}
            style={{ width: '70%', height: '70%', margin: 'auto' }}
            bgColor="light-dark(var(--mantine-color-white), var(--mantine-color-primary-2))"
            fgColor="light-dark(var(--mantine-primary-color-9), var(--mantine-primary-color-0)"
          />
        </div>
        <Space h="lg" />
      </Modal>
      <Button
        leftSection={icon}
        radius="xl"
        size="lg"
        variant="outline"
        onClick={open}
        mt="var(--mantine-spacing-lg)"
        visibleFrom="sm"
      >
        QR Code
      </Button>
      <Button
        leftSection={icon}
        radius="xl"
        size="md"
        h={48}
        variant="outline"
        onClick={open}
        mt="var(--mantine-spacing-sm)"
        hiddenFrom="sm"
      >
        QR Code
      </Button>
    </>
  );
}

export function ShareLabour() {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { data: token, isPending, isError, error } = useSubscriptionToken(client, labourId);

  if (isPending) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PageLoadingIcon />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Title order={3}>Error :(</Title>
          <Text>{error.message}</Text>
        </div>
      </Card>
    );
  }

  const shareUrl = `${window.location.origin}/subscribe/${labourId}?token=${token}`;
  const shareMessage = `Hey! I'd love for you to be part of my labour circle.\n\nUse the link below to sign up and get updates as things happen.\n\nYou'll also need this code for access: ${token}`;

  return (
    <Card
      title="Share with your circle"
      description="Share invites to your labour with your chosen circle of family and friends."
      image={{ src: image, width: 250, height: 220 }}
      mobileImage={{ src: image, width: 300, height: 200 }}
    >
      <Group mt={10}>
        <div className={classes.flexRow}>
          <CopyButton
            text={shareMessage}
            shareData={{
              title: 'Join My Labour Circle',
              url: shareUrl,
            }}
          />
          <Space w="sm" />
          <QRButton url={`${shareUrl}?token=${token}`} />
        </div>
      </Group>
    </Card>
  );
}
