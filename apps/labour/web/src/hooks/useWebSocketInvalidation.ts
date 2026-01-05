import { useEffect, useRef } from 'react';
import type { ContractionReadModel, LabourUpdateReadModel } from '@base/clients/labour_service';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../contexts/WebsocketContext';
import { useSyncState } from '../offline/syncManager';
import { queryKeys } from './queryKeys';
import {
  prependToInfiniteQuery,
  removeFromInfiniteQuery,
  updateInfiniteQueryItem,
} from './useInfiniteQueries';

type LabourEventData = {
  labour_id?: string;
  contraction_id?: string;
  labour_update_id?: string;
  subscription_id?: string;
  subscriber_id?: string;
  contraction?: ContractionReadModel;
  labour_update?: LabourUpdateReadModel;
};

type LabourEvent = {
  type: string;
  data: LabourEventData;
};

function invalidateOrCollect(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  pendingSet?: Set<string>
) {
  if (pendingSet) {
    pendingSet.add(JSON.stringify(queryKey));
  } else {
    queryClient.invalidateQueries({ queryKey });
  }
}

function processEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  event: LabourEvent,
  pendingInvalidations?: Set<string>
) {
  const { type, data } = event;

  switch (type) {
    case 'LabourPlanned':
      invalidateOrCollect(
        queryClient,
        queryKeys.labour.detail(data.labour_id!),
        pendingInvalidations
      );
      invalidateOrCollect(
        queryClient,
        queryKeys.labour.active(data.labour_id!),
        pendingInvalidations
      );
      invalidateOrCollect(queryClient, queryKeys.labour.lists(), pendingInvalidations);
      break;

    case 'LabourPlanUpdated':
      invalidateOrCollect(
        queryClient,
        queryKeys.labour.detail(data.labour_id!),
        pendingInvalidations
      );
      break;

    case 'LabourBegun':
      invalidateOrCollect(
        queryClient,
        queryKeys.labour.detail(data.labour_id!),
        pendingInvalidations
      );
      invalidateOrCollect(
        queryClient,
        queryKeys.labourUpdates.infinite(data.labour_id!),
        pendingInvalidations
      );
      break;

    case 'LabourCompleted':
      queryClient.removeQueries({ queryKey: queryKeys.labour.detail(data.labour_id!) });
      invalidateOrCollect(queryClient, queryKeys.labour.lists(), pendingInvalidations);
      break;

    case 'LabourDeleted':
      queryClient.removeQueries({ queryKey: queryKeys.labour.detail(data.labour_id!) });
      invalidateOrCollect(queryClient, queryKeys.labour.lists(), pendingInvalidations);
      break;

    case 'LabourInviteSent':
      break;

    case 'ContractionStarted':
      if (data.contraction) {
        prependToInfiniteQuery(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          data.contraction,
          'contraction_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      invalidateOrCollect(
        queryClient,
        queryKeys.labour.detail(data.labour_id!),
        pendingInvalidations
      );
      break;

    case 'ContractionEnded':
      if (data.contraction) {
        updateInfiniteQueryItem(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          data.contraction_id!,
          () => data.contraction!,
          'contraction_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      break;

    case 'ContractionUpdated':
      if (data.contraction) {
        updateInfiniteQueryItem(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          data.contraction_id!,
          () => data.contraction!,
          'contraction_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.contractions.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      break;

    case 'ContractionDeleted':
      removeFromInfiniteQuery(
        queryClient,
        queryKeys.contractions.infinite(data.labour_id!),
        data.contraction_id!,
        'contraction_id'
      );
      break;

    case 'LabourUpdatePosted':
      if (data.labour_update) {
        prependToInfiniteQuery(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          data.labour_update,
          'labour_update_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      break;

    case 'LabourUpdateMessageUpdated':
      if (data.labour_update) {
        updateInfiniteQueryItem(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          data.labour_update_id!,
          () => data.labour_update!,
          'labour_update_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      break;

    case 'LabourUpdateTypeUpdated':
      if (data.labour_update) {
        updateInfiniteQueryItem(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          data.labour_update_id!,
          () => data.labour_update!,
          'labour_update_id'
        );
      } else {
        invalidateOrCollect(
          queryClient,
          queryKeys.labourUpdates.infinite(data.labour_id!),
          pendingInvalidations
        );
      }
      break;

    case 'LabourUpdateDeleted':
      removeFromInfiniteQuery(
        queryClient,
        queryKeys.labourUpdates.infinite(data.labour_id!),
        data.labour_update_id!,
        'labour_update_id'
      );
      break;

    case 'SubscriberRequested':
    case 'SubscriberUnsubscribed':
    case 'SubscriberAccessLevelUpdated':
    case 'SubscriberBlocked':
    case 'SubscriberUnblocked':
    case 'SubscriberRoleUpdated':
      invalidateOrCollect(queryClient, queryKeys.subscriptions.all, pendingInvalidations);
      invalidateOrCollect(
        queryClient,
        queryKeys.users.listByLabour(data.labour_id!),
        pendingInvalidations
      );
      break;

    case 'SubscriberNotificationMethodsUpdated':
      invalidateOrCollect(
        queryClient,
        queryKeys.subscriptions.listByLabour(data.labour_id!),
        pendingInvalidations
      );
      invalidateOrCollect(
        queryClient,
        ['subscriptions', 'userSubscription', data.labour_id],
        pendingInvalidations
      );
      break;

    case 'SubscriberApproved':
    case 'SubscriberRemoved':
      invalidateOrCollect(queryClient, queryKeys.subscriptions.all, pendingInvalidations);
      invalidateOrCollect(
        queryClient,
        queryKeys.users.listByLabour(data.labour_id!),
        pendingInvalidations
      );
      break;

    case 'SubscriptionTokenSet':
      invalidateOrCollect(queryClient, queryKeys.subscriptionToken.all, pendingInvalidations);
      break;

    case 'SubscriptionTokenInvalidated':
      invalidateOrCollect(queryClient, queryKeys.subscriptionToken.all, pendingInvalidations);
      break;

    default:
      break;
  }
}

function handleEvent(queryClient: ReturnType<typeof useQueryClient>, event: LabourEvent) {
  processEvent(queryClient, event);
}

function handleEventWithBatching(
  queryClient: ReturnType<typeof useQueryClient>,
  event: LabourEvent,
  pendingInvalidations: Set<string>
) {
  processEvent(queryClient, event, pendingInvalidations);
}

export function useWebSocketInvalidation() {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const { status } = useSyncState();
  const isSyncing = status === 'syncing';
  const pendingInvalidationsRef = useRef<Set<string>>(new Set());
  const wasSyncingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      const event = parsed as LabourEvent;

      if (isSyncing) {
        handleEventWithBatching(queryClient, event, pendingInvalidationsRef.current);
      } else {
        handleEvent(queryClient, event);
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient, isSyncing]);

  useEffect(() => {
    // Sync complete, now invalidate queries.
    // Prevents UI flashing while commands catch up.
    if (wasSyncingRef.current && !isSyncing) {
      if (pendingInvalidationsRef.current.size > 0) {
        for (const keyJson of pendingInvalidationsRef.current) {
          const queryKey = JSON.parse(keyJson);
          queryClient.invalidateQueries({ queryKey });
        }
        pendingInvalidationsRef.current.clear();
      }
    }
    wasSyncingRef.current = isSyncing;
  }, [isSyncing, queryClient]);
}
