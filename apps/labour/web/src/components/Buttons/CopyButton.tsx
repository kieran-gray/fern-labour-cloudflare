import React from 'react';
import { IconCheck, IconCopy, IconShare } from '@tabler/icons-react';
import { Button, Tooltip } from '@mantine/core';
import { useClipboard, useMediaQuery } from '@mantine/hooks';

interface CopyButtonProps {
  text: string;
  shareData: {
    title: string;
    url: string;
  };
}

export function CopyButton({ text, shareData }: CopyButtonProps) {
  const clipboard = useClipboard();
  const isMobile = useMediaQuery('(min-width: 48em)');
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleAction = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: shareData.title,
          text,
          url: shareData.url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        clipboard.copy(`${text}\n\n${shareData.url}`);
      }
    } else {
      clipboard.copy(`${text}\n\n${shareData.url}`);
    }
  };

  const buttonText = canShare ? 'Share with Loved Ones' : 'Copy link to clipboard';
  const tooltipLabel = canShare ? 'Shared!' : 'Link copied!';
  const icon = canShare ? IconShare : clipboard.copied ? IconCheck : IconCopy;

  return (
    <>
      <Tooltip
        label={tooltipLabel}
        offset={5}
        position="bottom"
        radius="xl"
        transitionProps={{ duration: 100, transition: 'slide-down' }}
        opened={clipboard.copied && !canShare}
        disabled={!isMobile}
        events={{ hover: true, focus: false, touch: true }}
      >
        <Button
          variant="filled"
          rightSection={React.createElement(icon, { size: 20, stroke: 1.5 })}
          radius="xl"
          size="lg"
          pr={14}
          mt="var(--mantine-spacing-lg)"
          styles={{ section: { marginLeft: 22 } }}
          onClick={handleAction}
          visibleFrom="sm"
        >
          {buttonText}
        </Button>
      </Tooltip>
      <Tooltip
        label={tooltipLabel}
        offset={5}
        position="bottom"
        radius="xl"
        transitionProps={{ duration: 100, transition: 'slide-down' }}
        opened={clipboard.copied && !canShare}
        disabled={isMobile}
        events={{ hover: true, focus: false, touch: true }}
      >
        <Button
          variant="filled"
          rightSection={React.createElement(icon, { size: 18, stroke: 1.5 })}
          radius="xl"
          size="md"
          h={48}
          mt="var(--mantine-spacing-sm)"
          styles={{ section: { marginLeft: 18 } }}
          onClick={handleAction}
          hiddenFrom="sm"
        >
          {buttonText}
        </Button>
      </Tooltip>
    </>
  );
}
