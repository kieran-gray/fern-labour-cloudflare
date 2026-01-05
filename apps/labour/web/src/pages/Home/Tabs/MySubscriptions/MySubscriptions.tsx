import { memo } from 'react';
import { CardContentBottom } from '@base/components/Cards/CardContentBottom';
import image from './subscriptions.svg';
import { SubscriptionsTable } from './SubscriptionsTable';

export const ManageSubscriptions = memo(() => {
  return (
    <CardContentBottom
      title="Manage your subscriptions"
      description="Here, you can view and manage the labours that you are subscribed to."
      image={image}
      mobileImage={image}
    >
      <SubscriptionsTable />
    </CardContentBottom>
  );
});
