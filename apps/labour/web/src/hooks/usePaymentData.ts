import type { LabourServiceClient } from '@base/clients/labour_service';
import { CreateCheckoutSessionCommand } from '@base/clients/labour_service/types';
import { Error as ErrorNotification } from '@components/Notifications';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

export function useCreateCheckoutSession(client: LabourServiceClient) {
  return useMutation({
    mutationFn: async ({
      labourId,
      subscriptionId,
      successUrl,
      cancelUrl,
    }: {
      labourId: string;
      subscriptionId: string;
      successUrl: string;
      cancelUrl: string;
    }) => {
      const command: CreateCheckoutSessionCommand = {
        type: 'CreateCheckoutSession',
        payload: {
          labour_id: labourId,
          subscription_id: subscriptionId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      };
      const response = await client.createCheckoutSession(command);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create checkout session');
      }

      return response.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to create checkout session: ${error.message}`,
      });
    },
  });
}
