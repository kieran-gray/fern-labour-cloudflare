/**
 * Centralized query key factory for React Query cache management
 * Provides consistent and type-safe query keys across the application
 *
 * Key structure follows the pattern:
 * - [domain] - top level for broad invalidation
 * - [domain, 'list', ...filters] - for list queries (including infinite)
 * - [domain, 'detail', ...ids] - for single entity queries
 *
 */

export const queryKeys = {
  labour: {
    all: ['labour'] as const,
    lists: () => [...queryKeys.labour.all, 'list'] as const,
    list: (filters: { userId?: string; status?: string }) =>
      [...queryKeys.labour.lists(), filters] as const,
    details: () => [...queryKeys.labour.all, 'detail'] as const,
    detail: (labourId: string) => [...queryKeys.labour.details(), labourId] as const,
    history: (userId: string) =>
      [...queryKeys.labour.lists(), { userId, type: 'history' }] as const,
    subscribedLabours: (userId: string) =>
      [...queryKeys.labour.lists(), { userId, type: 'subscribed' }] as const,
    active: (userId: string) => [...queryKeys.labour.all, 'active', userId] as const,
  },

  contractions: {
    all: ['contractions'] as const,
    lists: () => [...queryKeys.contractions.all, 'list'] as const,
    list: (labourId: string) => [...queryKeys.contractions.lists(), labourId] as const,
    infinite: (labourId: string) => [...queryKeys.contractions.all, 'infinite', labourId] as const,
    details: () => [...queryKeys.contractions.all, 'detail'] as const,
    detail: (labourId: string, contractionId: string) =>
      [...queryKeys.contractions.details(), labourId, contractionId] as const,
  },

  labourUpdates: {
    all: ['labourUpdates'] as const,
    lists: () => [...queryKeys.labourUpdates.all, 'list'] as const,
    list: (labourId: string) => [...queryKeys.labourUpdates.lists(), labourId] as const,
    infinite: (labourId: string) => [...queryKeys.labourUpdates.all, 'infinite', labourId] as const,
    details: () => [...queryKeys.labourUpdates.all, 'detail'] as const,
    detail: (labourId: string, labourUpdateId: string) =>
      [...queryKeys.labourUpdates.details(), labourId, labourUpdateId] as const,
  },

  subscriptionToken: {
    all: ['subscriptionToken'] as const,
    detail: (labourId: string) => [...queryKeys.subscriptionToken.all, 'detail', labourId] as const,
  },

  subscriptions: {
    all: ['subscriptions'] as const,
    lists: () => [...queryKeys.subscriptions.all, 'list'] as const,
    listByLabour: (labourId: string) => [...queryKeys.subscriptions.lists(), { labourId }] as const,
    listByUser: (userId: string) => [...queryKeys.subscriptions.lists(), { userId }] as const,
    details: () => [...queryKeys.subscriptions.all, 'detail'] as const,
    detail: (labourId: string, subscriptionId: string) =>
      [...queryKeys.subscriptions.details(), labourId, subscriptionId] as const,
    userSubscription: (labourId: string, userId: string) =>
      [...queryKeys.subscriptions.all, 'userSubscription', labourId, userId] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    listByLabour: (labourId: string) => [...queryKeys.users.lists(), labourId] as const,
  },
} as const;
