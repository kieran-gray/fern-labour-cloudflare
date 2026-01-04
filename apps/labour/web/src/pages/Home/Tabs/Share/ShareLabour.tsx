import { useState } from 'react';
import { useLabourSession } from '@base/contexts';
import { useLabourClient } from '@base/hooks';
import { useSubscriptionToken } from '@base/hooks/useLabourData';
import { Card } from '@components/Cards/Card';
import { GenericConfirmModal } from '@components/Modals/GenericConfirmModal';
import { PageLoadingIcon } from '@components/PageLoading/Loading';
import {
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconLink,
  IconMail,
  IconMessage,
  IconQrcode,
  IconRefresh,
  IconShare,
} from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ActionIcon,
  Group,
  CopyButton as MantineCopyButton,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import classes from './ShareLabour.module.css';

interface ShareCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function ShareCard({ icon, title, children }: ShareCardProps) {
  return (
    <div className={classes.shareCard}>
      <div className={classes.shareCardHeader}>
        <span className={classes.shareCardIcon}>{icon}</span>
        <Text className={classes.shareCardTitle}>{title}</Text>
      </div>
      <div className={classes.shareCardContent}>{children}</div>
    </div>
  );
}

interface SocialShareButtonsProps {
  url: string;
  message: string;
}

function SocialShareButtons({ url, message }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: IconBrandWhatsapp,
      href: `https://wa.me/?text=${encodedMessage}%0A%0A${encodedUrl}`,
      color: '#25D366',
    },
    {
      name: 'SMS',
      icon: IconMessage,
      href: `sms:?body=${encodedMessage}%0A%0A${encodedUrl}`,
      color: 'var(--mantine-color-blue-5)',
    },
    {
      name: 'Messenger',
      icon: IconBrandFacebook,
      href: `fb-messenger://share/?link=${encodedUrl}`,
      color: '#0084FF',
    },
    {
      name: 'Email',
      icon: IconMail,
      href: `mailto:?subject=${encodeURIComponent('Follow My Labour')}&body=${encodedMessage}%0A%0A${encodedUrl}`,
      color: 'var(--mantine-color-gray-6)',
    },
  ];

  return (
    <Group gap="sm" justify="center" wrap="wrap">
      {shareLinks.map((link) => (
        <Tooltip key={link.name} label={link.name} position="bottom">
          <ActionIcon
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            size="xl"
            radius="xl"
            variant="light"
            className={classes.socialButton}
            style={{ '--social-color': link.color } as React.CSSProperties}
          >
            <link.icon size={24} />
          </ActionIcon>
        </Tooltip>
      ))}
    </Group>
  );
}

interface QRCodeCardProps {
  url: string;
}

function QRCodeCard({ url }: QRCodeCardProps) {
  return (
    <ShareCard icon={<IconQrcode size={18} />} title="In person">
      <div className={classes.qrCodeWrapper}>
        <QRCodeSVG
          value={url}
          size={180}
          bgColor="transparent"
          fgColor="currentColor"
          className={classes.qrCode}
        />
      </div>
      <Text size="xs" ta="center" mt="xs">
        Have them scan this
      </Text>
    </ShareCard>
  );
}

interface LinkCardProps {
  url: string;
  onInvalidate: () => void;
  isInvalidating?: boolean;
}

function LinkCard({ url, onInvalidate, isInvalidating }: LinkCardProps) {
  return (
    <ShareCard icon={<IconLink size={18} />} title="Copy link">
      <div className={classes.linkInputWrapper}>
        <Text className={classes.linkText} truncate>
          {url}
        </Text>
        <Group gap={4}>
          <MantineCopyButton value={url}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied!' : 'Copy'} position="top">
                <ActionIcon variant="subtle" onClick={copy} className={classes.linkAction}>
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </MantineCopyButton>
          <Tooltip label="Generate new link" position="top">
            <ActionIcon
              variant="subtle"
              onClick={onInvalidate}
              loading={isInvalidating}
              className={classes.linkAction}
              color="red"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
    </ShareCard>
  );
}

interface QuickShareCardProps {
  url: string;
  message: string;
}

function QuickShareCard({ url, message }: QuickShareCardProps) {
  return (
    <ShareCard icon={<IconShare size={18} />} title="Send via app">
      <SocialShareButtons url={url} message={message} />
    </ShareCard>
  );
}

export function ShareLabour() {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const {
    data: token,
    isPending,
    isError,
    error,
    refetch,
  } = useSubscriptionToken(client, labourId);
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);

  const handleInvalidateLink = async () => {
    setIsInvalidating(true);
    try {
      // TODO: Implement backend call to invalidate token
      // await client.invalidateSubscriptionToken(labourId);
      // Then refetch to get new token:
      await refetch();
    } finally {
      setIsInvalidating(false);
      setShowInvalidateModal(false);
    }
  };

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
  const shareMessage = `I'd love for you to follow along during my labour. Use this link to request access and receive updates.`;

  return (
    <>
      <GenericConfirmModal
        isOpen={showInvalidateModal}
        title="Create a new share link?"
        message="This will stop the current link from working. Anyone who already has access will keep it, but new people won't be able to use the old link."
        confirmText="Create new link"
        onConfirm={handleInvalidateLink}
        onCancel={() => setShowInvalidateModal(false)}
        isDangerous
        isLoading={isInvalidating}
      />

      <Card
        title="Share with your loved ones"
        description="Send this link to anyone you'd like to keep in the loop. When they sign up, you'll be able to approve their request."
      >
        <div className={classes.shareContent}>
          <div className={classes.shareCardsGrid}>
            <LinkCard
              url={shareUrl}
              onInvalidate={() => setShowInvalidateModal(true)}
              isInvalidating={isInvalidating}
            />
            <QuickShareCard url={shareUrl} message={shareMessage} />
            <QRCodeCard url={shareUrl} />
          </div>

          <Text size="xs" ta="center" mt="md" className={classes.approvalNote}>
            You stay in control. Each person who signs up will need your approval before they can
            see updates.
          </Text>
        </div>
      </Card>
    </>
  );
}
