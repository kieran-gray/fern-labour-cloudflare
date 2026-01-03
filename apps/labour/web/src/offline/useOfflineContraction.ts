import type { LabourServiceClient } from '@base/clients/labour_service';
import { useWebSocket } from '@base/contexts/WebsocketContext';
import { queryKeys } from '@base/hooks/queryKeys';
import { uuidv7 } from '@base/lib/uuid';
import { Error as ErrorNotification, Success } from '@components/Notifications';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { enqueueCommand } from './commandQueue';
import { syncManager } from './syncManager';

interface ContractionPage {
  data: Array<{
    contraction_id: string;
    labour_id: string;
    duration: { start_time: string; end_time: string };
    intensity: number | null;
    notes: string | null;
  }>;
  next_cursor: string | null;
}

export function useStartContractionOffline(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  return useMutation({
    mutationFn: async ({
      labourId,
      startTime,
      contractionId,
    }: {
      labourId: string;
      startTime: Date;
      contractionId: string;
    }) => {
      const command = {
        type: 'Contraction',
        payload: {
          type: 'StartContraction',
          payload: {
            labour_id: labourId,
            start_time: startTime.toISOString(),
            contraction_id: contractionId,
          },
        },
      };

      if (!navigator.onLine) {
        await enqueueCommand(labourId, command);
        syncManager.refreshPendingCount();
        return { success: true, offline: true, contractionId };
      }

      const response = await client.startContraction(labourId, startTime, contractionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to start contraction');
      }
      return { success: true, offline: false, contractionId };
    },

    onMutate: async ({ labourId, startTime, contractionId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.contractions.infinite(labourId),
      });

      const previousData = queryClient.getQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId)
      );

      const optimisticContraction = {
        contraction_id: contractionId,
        labour_id: labourId,
        duration: {
          start_time: startTime.toISOString(),
          end_time: startTime.toISOString(),
        },
        intensity: null,
        notes: null,
      };

      queryClient.setQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [optimisticContraction, ...page.data],
                };
              }
              return page;
            }),
          };
        }
      );

      return { previousData, contractionId };
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.contractions.infinite(variables.labourId),
          context.previousData
        );
      }
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to start contraction: ${error.message}`,
      });
    },

    onSuccess: (result, variables) => {
      if (!isConnected && !result.offline) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contractions.infinite(variables.labourId),
        });
      }
    },
  });
}

export function generateContractionId(): string {
  return uuidv7();
}

export function useEndContractionOffline(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  return useMutation({
    mutationFn: async ({
      labourId,
      endTime,
      intensity,
      contractionId,
    }: {
      labourId: string;
      endTime: Date;
      intensity: number;
      contractionId: string;
    }) => {
      const command = {
        type: 'Contraction',
        payload: {
          type: 'EndContraction',
          payload: {
            labour_id: labourId,
            end_time: endTime.toISOString(),
            intensity,
            contraction_id: contractionId,
          },
        },
      };

      if (!navigator.onLine) {
        await enqueueCommand(labourId, command);
        syncManager.refreshPendingCount();
        return { success: true, offline: true };
      }

      const response = await client.endContraction(labourId, endTime, intensity, contractionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to end contraction');
      }
      return { success: true, offline: false };
    },

    onMutate: async ({ labourId, endTime, intensity, contractionId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.contractions.infinite(labourId),
      });

      const previousData = queryClient.getQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId)
      );

      queryClient.setQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((c) => {
                if (c.contraction_id === contractionId) {
                  return {
                    ...c,
                    duration: {
                      ...c.duration,
                      end_time: endTime.toISOString(),
                    },
                    intensity,
                  };
                }
                return c;
              }),
            })),
          };
        }
      );

      return { previousData };
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.contractions.infinite(variables.labourId),
          context.previousData
        );
      }
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to end contraction: ${error.message}`,
      });
    },

    onSuccess: (result, variables) => {
      if (result.offline) {
        notifications.show({
          ...Success,
          title: 'Saved Offline',
          message: 'Contraction will sync when back online',
        });
      }
      if (!isConnected && !result.offline) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contractions.infinite(variables.labourId),
        });
      }
    },
  });
}

export function useUpdateContractionOffline(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  return useMutation({
    mutationFn: async (params: {
      labourId: string;
      contractionId: string;
      startTime?: Date;
      endTime?: Date;
      intensity?: number;
    }) => {
      const command = {
        type: 'Contraction',
        payload: {
          type: 'UpdateContraction',
          payload: {
            labour_id: params.labourId,
            contraction_id: params.contractionId,
            start_time: params.startTime?.toISOString(),
            end_time: params.endTime?.toISOString(),
            intensity: params.intensity,
          },
        },
      };

      if (!navigator.onLine) {
        await enqueueCommand(params.labourId, command);
        syncManager.refreshPendingCount();
        return { success: true, offline: true };
      }

      const response = await client.updateContraction(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update contraction');
      }
      return { success: true, offline: false };
    },

    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.contractions.infinite(params.labourId),
      });

      const previousData = queryClient.getQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(params.labourId)
      );

      queryClient.setQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(params.labourId),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((c) => {
                if (c.contraction_id === params.contractionId) {
                  return {
                    ...c,
                    duration: {
                      start_time: params.startTime?.toISOString() || c.duration.start_time,
                      end_time: params.endTime?.toISOString() || c.duration.end_time,
                    },
                    intensity: params.intensity ?? c.intensity,
                  };
                }
                return c;
              }),
            })),
          };
        }
      );

      return { previousData };
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.contractions.infinite(variables.labourId),
          context.previousData
        );
      }
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to update contraction: ${error.message}`,
      });
    },

    onSuccess: (result, variables) => {
      if (result.offline) {
        notifications.show({
          ...Success,
          title: 'Saved Offline',
          message: 'Changes will sync when back online',
        });
      } else {
        notifications.show({
          ...Success,
          title: 'Success',
          message: 'Contraction updated',
        });
      }
      if (!isConnected && !result.offline) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contractions.infinite(variables.labourId),
        });
      }
    },
  });
}

export function useDeleteContractionOffline(client: LabourServiceClient) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  return useMutation({
    mutationFn: async ({
      labourId,
      contractionId,
    }: {
      labourId: string;
      contractionId: string;
    }) => {
      const command = {
        type: 'Contraction',
        payload: {
          type: 'DeleteContraction',
          payload: {
            labour_id: labourId,
            contraction_id: contractionId,
          },
        },
      };

      if (!navigator.onLine) {
        await enqueueCommand(labourId, command);
        syncManager.refreshPendingCount();
        return { success: true, offline: true };
      }

      const response = await client.deleteContraction(labourId, contractionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete contraction');
      }
      return { success: true, offline: false };
    },

    onMutate: async ({ labourId, contractionId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.contractions.infinite(labourId),
      });

      const previousData = queryClient.getQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId)
      );

      queryClient.setQueryData<InfiniteData<ContractionPage>>(
        queryKeys.contractions.infinite(labourId),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((c) => c.contraction_id !== contractionId),
            })),
          };
        }
      );

      return { previousData };
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.contractions.infinite(variables.labourId),
          context.previousData
        );
      }
      notifications.show({
        ...ErrorNotification,
        title: 'Error',
        message: `Failed to delete contraction: ${error.message}`,
      });
    },

    onSuccess: (result, variables) => {
      if (result.offline) {
        notifications.show({
          ...Success,
          title: 'Saved Offline',
          message: 'Deletion will sync when back online',
        });
      } else {
        notifications.show({
          ...Success,
          title: 'Success',
          message: 'Contraction deleted',
        });
      }
      if (!isConnected && !result.offline) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contractions.infinite(variables.labourId),
        });
      }
    },
  });
}
