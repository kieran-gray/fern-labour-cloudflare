import { CopyButton } from '@components/Buttons/CopyButton';
import { Card } from '@components/Cards/Card';
import image from '@home/Tabs/Share/share.svg';
import { Group } from '@mantine/core';
import classes from '@home/Tabs/Share/ShareLabour.module.css';

export function ShareFernLabour() {
  const title = 'Share Fern Labour with Others';
  const description =
    'Know someone expecting? Share FernLabour to help them keep their loved ones informed during labour.';
  const shareUrl = window.location.origin;
  const shareMessage = `Hey! I've been using FernLabour and thought you might find it useful.\n\nIt's a simple way to keep family and friends informed during labour.\n\nCheck it out:`;

  return (
    <Card
      title={title}
      description={description}
      image={{ src: image, width: 300, height: 250 }}
      mobileImage={{ src: image, width: 275, height: 225 }}
    >
      <Group mt={30}>
        <div className={classes.flexRow}>
          <CopyButton
            text={shareMessage}
            shareData={{
              title: 'Try FernLabour',
              url: shareUrl,
            }}
          />
        </div>
      </Group>
    </Card>
  );
}
