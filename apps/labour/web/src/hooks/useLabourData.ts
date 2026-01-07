/**
 *  Labour Data Hooks
 * Uses the new Cloudflare Workers API with CQRS pattern
 */

import type {
  LabourServiceClient,
  LabourUpdateType,
  SubscriberAccessLevel,
  SubscriberContactMethod,
  SubscriberRole,
} from '@base/clients/labour_service';
import { useWebSocket } from '@base/contexts/WebsocketContext';
import { NotFoundError } from '@base/lib/errors';
import { useAuth } from '@clerk/clerk-react';
import { Error as ErrorNotification, Success } from '@components/Notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createMutation, createSimpleMutation } from './createMutation';
import { queryKeys } from './queryKeys';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to get labour by ID or active
 */
export function useCurrentLabour(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.labour.detail(labourId) : queryKeys.labour.active(userId || ''),
    queryFn: async () => {
      let targetLabourId = labourId;

      if (!targetLabourId) {
        const activeResponse = await client.getActiveLabour();

        if (!activeResponse.success) {
          throw new Error(activeResponse.error || 'Failed to load active labour');
        }

        if (!activeResponse.data) {
          throw new NotFoundError();
        }

        targetLabourId = activeResponse.data.labour_id;
      }

      const response = await client.getLabour(targetLabourId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load labour');
      }

      return response.data;
    },
    enabled: !!userId,
    retry: 0,
  });
}

/**
 * Hook to get labour by ID
 */
export function useLabourById(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.labour.detail(labourId) : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const response = await client.getLabour(labourId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load labour');
      }

      return response.data;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
  });
}

/**
 * Hook to get labour history
 */
export function useLabourHistory(client: LabourServiceClient) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.labour.history(userId || ''),
    queryFn: async () => {
      const response = await client.getLabourHistory();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load labour history');
      }

      return response.data;
    },
    enabled: !!userId,
    retry: 0,
  });
}

/**
 * Hook to get active labour
 */
export function useActiveLabour(client: LabourServiceClient) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.labour.active(userId || ''),
    queryFn: async () => {
      const response = await client.getActiveLabour();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load active labour');
      }

      return response.data;
    },
    enabled: !!userId,
    retry: 0,
  });
}

/**
 * Hook for fetching subscription token.
 *
 * Handles eventual consistency during token regeneration:
 * - When a token is invalidated, a new one is generated asynchronously
 * - During this window, the query returns null (generating state)
 * - WebSocket events will trigger refetch when the new token is ready
 * - Fallback polling ensures recovery if WebSocket fails
 */
export function useSubscriptionToken(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.subscriptionToken.detail(labourId) : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const response = await client.getSubscriptionToken(labourId);

      if (!response.success || !response.data) {
        const isGenerating =
          response.error?.toLowerCase().includes('no subcription token') ||
          response.error?.toLowerCase().includes('no subscription token');
        if (isGenerating) {
          return null;
        }
        throw new Error(response.error || 'Failed to load subscription token');
      }

      return response.data.token;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
    refetchInterval: (query) => {
      return query.state.data === null ? 2000 : false;
    },
  });
}

/**
 * Hook for fetching subscriptions
 */
export function useLabourSubscriptions(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.subscriptions.listByLabour(labourId) : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const response = await client.getLabourSubscriptions(labourId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load subscriptions');
      }

      return response.data.data;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
  });
}

export function useUserSubscription(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.subscriptions.userSubscription(labourId, userId || '') : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const response = await client.getUserSubscription(labourId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load subscription');
      }

      return response.data;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
  });
}

export function useUserSubscribedLabours(client: LabourServiceClient) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.labour.subscribedLabours(userId || ''),
    queryFn: async () => {
      const response = await client.getSubscribedLabours();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load labours');
      }

      return response.data;
    },
    enabled: !!userId,
    retry: 0,
    staleTime: 0,
  });
}

export function useUserSubscriptions(client: LabourServiceClient) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.subscriptions.listByUser(userId || ''),
    queryFn: async () => {
      const response = await client.getUserSubscriptions();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load user subscriptions');
      }

      return response.data;
    },
    enabled: !!userId,
    retry: 0,
    staleTime: 0,
  });
}

/**
 * Hook for fetching users
 */
export function useUsers(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.users.listByLabour(labourId) : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const response = await client.getUsers(labourId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load users');
      }

      return response.data;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
  });
}

export function useServerOffset(client: LabourServiceClient, labourId: string | null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: labourId ? queryKeys.serverTimestamp.offset(labourId) : [],
    queryFn: async () => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const beforeTime = Date.now();
      const response = await client.getServerTimestamp(labourId);
      const afterTime = Date.now();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch server timestamp');
      }

      const serverTime = new Date(response.data.server_timestamp).getTime();
      if (isNaN(serverTime)) {
        return 0;
      }

      const roundTripTime = afterTime - beforeTime;
      const estimatedClientTimeAtServer = beforeTime + roundTripTime / 2;
      const offset = serverTime - estimatedClientTimeAtServer;

      return offset;
    },
    enabled: !!labourId && !!userId,
    retry: 0,
  });
}

// =============================================================================
// Contraction Mutations
// =============================================================================

export const useUpdateContraction = createMutation<{
  labourId: string;
  contractionId: string;
  startTime?: Date;
  endTime?: Date;
  intensity?: number;
}>({
  mutationFn: (client, params) => client.updateContraction(params),
  getInvalidationKey: ({ labourId }) => queryKeys.contractions.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Contraction updated',
  errorMessage: 'Failed to update contraction',
});

export const useDeleteContraction = createMutation<{
  labourId: string;
  contractionId: string;
}>({
  mutationFn: (client, { labourId, contractionId }) =>
    client.deleteContraction(labourId, contractionId),
  getInvalidationKey: ({ labourId }) => queryKeys.contractions.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Contraction deleted',
  errorMessage: 'Failed to delete contraction',
});

// =============================================================================
// Labour Update Mutations
// =============================================================================

export const useUpdateLabourUpdateMessage = createMutation<{
  labourId: string;
  labourUpdateId: string;
  message: string;
}>({
  mutationFn: (client, { labourId, labourUpdateId, message }) =>
    client.updateLabourUpdateMessage(labourId, labourUpdateId, message),
  getInvalidationKey: ({ labourId }) => queryKeys.labourUpdates.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Status update edited successfully',
  errorMessage: 'Failed to edit status update',
});

export const useUpdateLabourUpdateType = createMutation<{
  labourId: string;
  labourUpdateId: string;
  labourUpdateType: LabourUpdateType;
}>({
  mutationFn: (client, { labourId, labourUpdateId, labourUpdateType }) =>
    client.updateLabourUpdateType(labourId, labourUpdateId, labourUpdateType),
  getInvalidationKey: ({ labourId }) => queryKeys.labourUpdates.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Status update edited successfully',
  errorMessage: 'Failed to edit status update',
});

export const usePostLabourUpdate = createMutation<{
  labourId: string;
  updateType: LabourUpdateType;
  message: string;
}>({
  mutationFn: (client, { labourId, updateType, message }) =>
    client.postLabourUpdate(labourId, updateType, message),
  getInvalidationKey: ({ labourId }) => queryKeys.labourUpdates.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Update posted successfully',
  errorMessage: 'Failed to post update',
});

export const useDeleteLabourUpdate = createMutation<{
  labourId: string;
  labourUpdateId: string;
}>({
  mutationFn: (client, { labourId, labourUpdateId }) =>
    client.deleteLabourUpdate(labourId, labourUpdateId),
  getInvalidationKey: ({ labourId }) => queryKeys.labourUpdates.infinite(labourId),
  invalidateOnError: true,
  successMessage: 'Update deleted successfully',
  errorMessage: 'Failed to delete update',
});

// =============================================================================
// Labour Mutations
// =============================================================================

export const useUpdateLabourPlan = createMutation<{
  labourId: string;
  firstLabour: boolean;
  dueDate: Date;
  labourName?: string;
}>({
  mutationFn: (client, params) => client.updateLabourPlan(params),
  getInvalidationKey: ({ labourId }) => queryKeys.labour.detail(labourId),
  invalidateOnError: false,
  successMessage: 'Labour plan updated successfully',
  errorMessage: 'Failed to update labour plan',
});

export const useBeginLabour = createMutation<string>({
  mutationFn: (client, labourId) => client.beginLabour(labourId),
  getInvalidationKey: (labourId) => queryKeys.labour.detail(labourId),
  invalidateOnError: false,
  successMessage: 'Labour has begun',
  errorMessage: 'Failed to begin labour',
});

export const useSendLabourInvite = createSimpleMutation<{
  labourId: string;
  email: string;
}>({
  mutationFn: (client, { labourId, email }) => client.sendLabourInvite(labourId, email),
  successMessage: 'Invite sent successfully',
  errorMessage: 'Failed to send invite',
});

// Special case: invalidates based on response data
export function usePlanLabour(client: LabourServiceClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      firstLabour,
      dueDate,
      labourName,
    }: {
      firstLabour: boolean;
      dueDate: Date;
      labourName?: string;
    }) => {
      const response = await client.planLabour({ firstLabour, dueDate, labourName });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to plan labour');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labour.all });

      if (data.labour_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.labour.detail(data.labour_id) });
      }

      notifications.show({
        ...Success,
        title: 'Success',
        message: 'Labour planned successfully',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to plan labour: ${error.message}`,
      });
    },
  });
}

// Special case: invalidates labour.all and removes active labour cache
export function useCompleteLabour(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ labourId, notes }: { labourId: string; notes: string }) => {
      const response = await client.completeLabour({ labourId, notes });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete labour');
      }

      return response.data;
    },
    onSuccess: (_, { labourId }) => {
      if (userId) {
        queryClient.removeQueries({ queryKey: queryKeys.labour.active(userId) });
      }
      queryClient.removeQueries({ queryKey: queryKeys.labour.detail(labourId) });

      notifications.show({
        ...Success,
        title: 'Success',
        message: 'Labour completed successfully',
      });

      if (!isConnected) {
        queryClient.invalidateQueries({ queryKey: queryKeys.labour.all });
      }
    },
    onError: (error: Error) => {
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to complete labour: ${error.message}`,
      });
    },
  });
}

// Special case: does removeQueries + invalidateQueries
export function useDeleteLabour(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  return useMutation({
    mutationFn: async (labourId: string) => {
      const response = await client.deleteLabour(labourId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete labour');
      }

      return response.data;
    },
    onSuccess: (_, labourId) => {
      if (!isConnected) {
        queryClient.removeQueries({ queryKey: queryKeys.labour.detail(labourId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.labour.all });
      }

      notifications.show({
        ...Success,
        title: 'Success',
        message: 'Labour deleted successfully',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to delete labour: ${error.message}`,
      });
    },
  });
}

// =============================================================================
// Subscriber Self-Service Mutations
// =============================================================================

export const useRequestAccess = createMutation<{
  labourId: string;
  token: string;
}>({
  mutationFn: (client, { labourId, token }) => client.requestAccess(labourId, token),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Access requested successfully',
  errorMessage: 'Failed to request access',
});

export const useUnsubscribe = createMutation<{
  labourId: string;
  subscriptionId: string;
}>({
  mutationFn: (client, { labourId, subscriptionId }) =>
    client.unsubscribe(labourId, subscriptionId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Unsubscribed successfully',
  errorMessage: 'Failed to unsubscribe',
});

export const useUpdateNotificationMethods = createMutation<{
  labourId: string;
  subscriptionId: string;
  methods: SubscriberContactMethod[];
}>({
  mutationFn: (client, { labourId, subscriptionId, methods }) =>
    client.updateNotificationMethods(labourId, subscriptionId, methods),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Notification methods updated',
  errorMessage: 'Failed to update notification methods',
});

export const useUpdateAccessLevel = createMutation<{
  labourId: string;
  subscriptionId: string;
  accessLevel: SubscriberAccessLevel;
}>({
  mutationFn: (client, { labourId, subscriptionId, accessLevel }) =>
    client.updateAccessLevel(labourId, subscriptionId, accessLevel),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Access level updated',
  errorMessage: 'Failed to update access level',
});

// =============================================================================
// Subscription Admin Mutations
// =============================================================================

export const useApproveSubscriber = createMutation<{
  labourId: string;
  subscriptionId: string;
}>({
  mutationFn: (client, { labourId, subscriptionId }) =>
    client.approveSubscriber(labourId, subscriptionId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Subscriber approved',
  errorMessage: 'Failed to approve subscriber',
});

export const useRemoveSubscriber = createMutation<{
  labourId: string;
  subscriptionId: string;
}>({
  mutationFn: (client, { labourId, subscriptionId }) =>
    client.removeSubscriber(labourId, subscriptionId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Subscriber removed',
  errorMessage: 'Failed to remove subscriber',
});

export const useBlockSubscriber = createMutation<{
  labourId: string;
  subscriptionId: string;
}>({
  mutationFn: (client, { labourId, subscriptionId }) =>
    client.blockSubscriber(labourId, subscriptionId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Subscriber blocked',
  errorMessage: 'Failed to block subscriber',
});

export const useUnblockSubscriber = createMutation<{
  labourId: string;
  subscriptionId: string;
}>({
  mutationFn: (client, { labourId, subscriptionId }) =>
    client.unblockSubscriber(labourId, subscriptionId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Subscriber unblocked',
  errorMessage: 'Failed to unblock subscriber',
});

export const useUpdateSubscriberRole = createMutation<{
  labourId: string;
  subscriptionId: string;
  role: SubscriberRole;
}>({
  mutationFn: (client, { labourId, subscriptionId, role }) =>
    client.updateSubscriberRole(labourId, subscriptionId, role),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptions.listByLabour(labourId),
  invalidateOnError: false,
  successMessage: 'Subscriber role updated',
  errorMessage: 'Failed to update subscriber role',
});

export const useInvalidateSubscriptionToken = createMutation<{ labourId: string }>({
  mutationFn: (client, { labourId }) => client.invalidateSubscriptionToken(labourId),
  getInvalidationKey: ({ labourId }) => queryKeys.subscriptionToken.detail(labourId),
  invalidateOnError: false,
  successMessage: 'Subscription token invalidated',
  errorMessage: 'Failed to invalidate subscription token',
});
