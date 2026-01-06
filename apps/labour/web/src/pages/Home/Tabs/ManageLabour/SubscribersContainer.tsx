import { CardContentBottom } from '@base/components/Cards/CardContentBottom';
import image from '@base/pages/Subscribe/protected.svg';
import { IconBook } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SubscribersHelpModal } from './SubscribersHelpModal';
import { ManageSubscribersTabs } from './SubscriberTabs';

export function SubscribersContainer() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <CardContentBottom
      title="Manage your subscribers"
      description="Here, you can view and manage your subscribers. Stay in control of who can view your labour by removing or blocking unwanted subscribers."
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
      <ManageSubscribersTabs />
    </CardContentBottom>
  );
}
