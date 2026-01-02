import { CardContentBottom } from '@base/components/Cards/CardContentBottom';
import image from '@base/pages/Subscribe/protected.svg';
import { ManageSubscribersTabs } from './SubscriberTabs';

export function SubscribersContainer() {
  return (
    <CardContentBottom
      title="Manage your subscribers"
      description="Here, you can view and manage your subscribers. Stay in control of who can view your labour by removing or blocking unwanted subscribers."
      image={image}
      mobileImage={image}
    >
      <ManageSubscribersTabs />
    </CardContentBottom>
  );
}
