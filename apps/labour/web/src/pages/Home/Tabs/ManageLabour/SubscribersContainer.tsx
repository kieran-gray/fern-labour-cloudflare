import { CardContentBottom } from '@base/components/Cards/CardContentBottom';
import { IconBook } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import image from './protected.svg';
import { SubscribersHelpModal } from './SubscribersHelpModal';
import { SubscribersView } from './SubscribersView';

export function SubscribersContainer() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <CardContentBottom
      title="Your labour circle"
      description="The people who are following your journey. Birth partners and support people can see real-time updates, while loved ones receive milestone notifications."
      image={image}
      mobileImage={image}
      helpButton={
        <>
          <ActionIcon radius="xl" variant="light" size="xl" onClick={open}>
            <IconBook />
          </ActionIcon>
          <SubscribersHelpModal close={close} opened={opened} />
        </>
      }
    >
      <SubscribersView />
    </CardContentBottom>
  );
}
