/**
 * Infinite Query Hooks for Paginated Data
 *
 * These hooks use useInfiniteQuery for efficient pagination of append-only streams
 * like contractions and labour updates. Key features:
 *
 * - Single cache entry per labour (no cursor in query key)
 * - Automatic page accumulation managed by React Query
 * - Helper functions for WebSocket cache updates
 * - Connection-aware polling fallback
 */

import type {
  ContractionReadModel,
  Cursor,
  LabourServiceClient,
  LabourUpdateReadModel,
  PaginatedResponse,
} from '@base/clients/labour_service';
import { useWebSocket } from '@base/contexts/WebsocketContext';
import { useAuth } from '@clerk/clerk-react';
import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

// Constants
const DEFAULT_PAGE_SIZE = 20;
const POLLING_INTERVAL_WHEN_DISCONNECTED = 30_000; // 30 seconds

// Helper to decode cursor string to Cursor object
function decodeCursor(cursorString: string): Cursor {
  try {
    const decoded = atob(cursorString);
    const [updatedAt, id] = decoded.split('|');
    return { id, updated_at: updatedAt };
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Hook to get paginated contractions using infinite query
 *
 * Features:
 * - Single cache entry for all pages
 * - Automatic polling fallback when WebSocket disconnected
 * - Ready for WebSocket cache updates via setQueryData
 */
export function useContractionsInfinite(
  client: LabourServiceClient,
  labourId: string | null,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const { userId } = useAuth();
  const { isConnected } = useWebSocket();

  return useInfiniteQuery({
    queryKey: labourId ? queryKeys.contractions.infinite(labourId) : [],
    queryFn: async ({ pageParam }) => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const cursor = pageParam ? decodeCursor(pageParam) : undefined;
      const response = await client.getContractions(labourId, pageSize, cursor);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load contractions');
      }

      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? undefined,
    enabled: !!labourId && !userId,
    refetchInterval: isConnected ? false : POLLING_INTERVAL_WHEN_DISCONNECTED,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get paginated labour updates using infinite query
 */
export function useLabourUpdatesInfinite(
  client: LabourServiceClient,
  labourId: string | null,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const { userId } = useAuth();
  const { isConnected } = useWebSocket();

  return useInfiniteQuery({
    queryKey: labourId ? queryKeys.labourUpdates.infinite(labourId) : [],
    queryFn: async ({ pageParam }) => {
      if (!labourId) {
        throw new Error('Labour ID is required');
      }

      const cursor = pageParam ? decodeCursor(pageParam) : undefined;
      const response = await client.getLabourUpdates(labourId, pageSize, cursor);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load labour updates');
      }

      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? undefined,
    enabled: !!labourId && !userId,
    refetchInterval: isConnected ? false : POLLING_INTERVAL_WHEN_DISCONNECTED,
    gcTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// Cache Update Helpers for WebSocket Events
// =============================================================================

type InfiniteContractionData = InfiniteData<PaginatedResponse<ContractionReadModel>, unknown>;
type InfiniteLabourUpdateData = InfiniteData<PaginatedResponse<LabourUpdateReadModel>, unknown>;

/**
 * Prepend a new item to the first page of an infinite query
 * Used when WebSocket notifies of a new item creation
 */
export function prependToInfiniteQuery<
  T extends { contraction_id?: string; labour_update_id?: string },
>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  newItem: T,
  idField: 'contraction_id' | 'labour_update_id'
) {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<T>, string | null>>(queryKey, (old) => {
    if (!old || old.pages.length === 0) {
      return old;
    }

    // Check if item already exists to prevent duplicates
    const exists = old.pages.some((page) =>
      page.data.some((item) => item[idField] === newItem[idField])
    );
    if (exists) {
      return old;
    }

    // Prepend to first page (newest items)
    const [firstPage, ...rest] = old.pages;
    return {
      ...old,
      pages: [
        {
          ...firstPage,
          data: [newItem, ...firstPage.data],
        },
        ...rest,
      ],
    };
  });
}

/**
 * Update an existing item in the infinite query cache
 * Used when WebSocket notifies of an item update
 */
export function updateInfiniteQueryItem<
  T extends { contraction_id?: string; labour_update_id?: string },
>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  itemId: string,
  updater: (item: T) => T,
  idField: 'contraction_id' | 'labour_update_id'
) {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<T>, string | null>>(queryKey, (old) => {
    if (!old) {
      return old;
    }

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((item) => (item[idField] === itemId ? updater(item) : item)),
      })),
    };
  });
}

/**
 * Remove an item from the infinite query cache
 * Used when WebSocket notifies of an item deletion
 */
export function removeFromInfiniteQuery<
  T extends { contraction_id?: string; labour_update_id?: string },
>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  itemId: string,
  idField: 'contraction_id' | 'labour_update_id'
) {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<T>, string | null>>(queryKey, (old) => {
    if (!old) {
      return old;
    }

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.filter((item) => item[idField] !== itemId),
      })),
    };
  });
}

// =============================================================================
// Convenience Helpers for Flattening and Deduplicating
// =============================================================================

/**
 * Flatten infinite query pages and deduplicate by ID
 * Use this in components to get a flat array of items
 */
export function flattenContractions(
  data: InfiniteContractionData | undefined
): ContractionReadModel[] {
  if (!data?.pages) {
    return [];
  }

  const seen = new Set<string>();
  const items: ContractionReadModel[] = [];

  for (const page of data.pages) {
    if (!page?.data) {
      continue;
    }
    for (const item of page.data) {
      if (!seen.has(item.contraction_id)) {
        seen.add(item.contraction_id);
        items.push(item);
      }
    }
  }

  return items.sort(
    (a, b) => new Date(a.duration.start_time).getTime() - new Date(b.duration.start_time).getTime()
  );
}

/**
 * Flatten infinite query pages and deduplicate labour updates
 */
export function flattenLabourUpdates(
  data: InfiniteLabourUpdateData | undefined
): LabourUpdateReadModel[] {
  if (!data?.pages) {
    return [];
  }

  const seen = new Set<string>();
  const items: LabourUpdateReadModel[] = [];

  for (const page of data.pages) {
    if (!page?.data) {
      continue;
    }
    for (const item of page.data) {
      if (!seen.has(item.labour_update_id)) {
        seen.add(item.labour_update_id);
        items.push(item);
      }
    }
  }

  return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
