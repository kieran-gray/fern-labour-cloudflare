import { Card } from '@components/Cards/Card';
import image from '@home/Tabs/Share/share.svg';
import {
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconMail,
  IconMessage,
  IconShare,
} from '@tabler/icons-react';
import { ActionIcon, Button, Text, Tooltip } from '@mantine/core';
import classes from './ShareFernLabour.module.css';

const SHARE_URL = window.location.origin;
const SHARE_MESSAGE = `Hey! I've been using FernLabour and thought you might find it useful. It's a simple way to keep family and friends informed during labour.`;

const SHARE_LINKS = [
  {
    name: 'WhatsApp',
    icon: IconBrandWhatsapp,
    href: `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}%0A%0A${encodeURIComponent(SHARE_URL)}`,
    color: '#25D366',
  },
  {
    name: 'SMS',
    icon: IconMessage,
    href: `sms:?body=${encodeURIComponent(SHARE_MESSAGE)}%0A%0A${encodeURIComponent(SHARE_URL)}`,
    color: 'var(--mantine-color-blue-5)',
  },
  {
    name: 'Messenger',
    icon: IconBrandFacebook,
    href: `fb-messenger://share/?link=${encodeURIComponent(SHARE_URL)}`,
    color: '#0084FF',
  },
  {
    name: 'Email',
    icon: IconMail,
    href: `mailto:?subject=${encodeURIComponent('Check out FernLabour')}&body=${encodeURIComponent(SHARE_MESSAGE)}%0A%0A${encodeURIComponent(SHARE_URL)}`,
    color: 'var(--mantine-color-gray-6)',
  },
];

function handleNativeShare() {
  if (navigator.share) {
    navigator.share({
      title: 'Try FernLabour',
      text: SHARE_MESSAGE,
      url: SHARE_URL,
    });
  }
}

export function ShareFernLabour() {
  const supportsNativeShare = typeof navigator.share === 'function';

  return (
    <Card
      title="Share Fern Labour with Others"
      description="Know someone expecting? Share FernLabour to help them keep their loved ones informed during labour."
      image={{ src: image, width: 300, height: 250 }}
      mobileImage={{ src: image, width: 275, height: 225 }}
    >
      <div className={classes.shareWrapper}>
        <div className={classes.shareContent}>
          {supportsNativeShare && (
            <div className={classes.ctaSection}>
              <Button
                leftSection={<IconShare size={18} />}
                variant="filled"
                size="md"
                radius="xl"
                onClick={handleNativeShare}
                className={classes.shareButton}
              >
                Share Fern Labour
              </Button>
            </div>
          )}

          {supportsNativeShare && (
            <div className={classes.divider}>
              <span className={classes.dividerLine} />
              <Text component="span" className={classes.dividerText}>
                or
              </Text>
              <span className={classes.dividerLine} />
            </div>
          )}

          <div className={classes.socialSection}>
            <Text className={classes.socialLabel}>
              {supportsNativeShare ? 'Share directly via' : 'Share via'}
            </Text>
            <div className={classes.socialButtons}>
              {SHARE_LINKS.map((link) => (
                <Tooltip key={link.name} label={link.name} position="bottom" withArrow>
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
                    aria-label={`Share via ${link.name}`}
                  >
                    <link.icon size={24} />
                  </ActionIcon>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
