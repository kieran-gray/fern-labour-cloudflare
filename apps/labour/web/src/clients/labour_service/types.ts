/**
 * TypeScript types for Labour Service V2 API Commands
 * Generated from Rust command definitions in packages/labour-shared/src/commands/
 */

// Value Objects / Enums

export enum SubscriberContactMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum SubscriberAccessLevel {
  BASIC = 'BASIC',
  SUPPORTER = 'SUPPORTER',
}

export enum SubscriberRole {
  BIRTH_PARTNER = 'BIRTH_PARTNER',
  SUPPORT_PERSON = 'SUPPORT_PERSON',
  LOVED_ONE = 'LOVED_ONE',
}

export enum SubscriberStatus {
  REQUESTED = 'REQUESTED',
  SUBSCRIBED = 'SUBSCRIBED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  REMOVED = 'REMOVED',
  BLOCKED = 'BLOCKED',
}

export enum LabourUpdateType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  PRIVATE_NOTE = 'PRIVATE_NOTE',
}

// Admin Commands

export type RebuildReadModelsCommand = {
  type: 'RebuildReadModels';
  payload: {
    aggregate_id: string;
  };
};

export type AdminCommand = RebuildReadModelsCommand;

// Contraction Commands

export type StartContractionCommand = {
  type: 'StartContraction';
  payload: {
    labour_id: string;
    start_time: string; // ISO 8601 datetime
    contraction_id: string; // Client-generated UUID v7
  };
};

export type EndContractionCommand = {
  type: 'EndContraction';
  payload: {
    labour_id: string;
    end_time: string; // ISO 8601 datetime
    intensity: number; // u8 in Rust, 0-255
    contraction_id: string; // Must match the started contraction
  };
};

export type UpdateContractionCommand = {
  type: 'UpdateContraction';
  payload: {
    labour_id: string;
    contraction_id: string;
    start_time?: string; // ISO 8601 datetime
    end_time?: string; // ISO 8601 datetime
    intensity?: number; // u8 in Rust, 0-255
  };
};

export type DeleteContractionCommand = {
  type: 'DeleteContraction';
  payload: {
    labour_id: string;
    contraction_id: string;
  };
};

export type ContractionCommand =
  | StartContractionCommand
  | EndContractionCommand
  | UpdateContractionCommand
  | DeleteContractionCommand;

// Labour Commands

export type PlanLabourCommand = {
  type: 'PlanLabour';
  payload: {
    first_labour: boolean;
    due_date: string; // ISO 8601 datetime
    labour_name?: string;
  };
};

export type UpdateLabourPlanCommand = {
  type: 'UpdateLabourPlan';
  payload: {
    labour_id: string;
    first_labour: boolean;
    due_date: string; // ISO 8601 datetime
    labour_name?: string;
  };
};

export type BeginLabourCommand = {
  type: 'BeginLabour';
  payload: {
    labour_id: string;
  };
};

export type CompleteLabourCommand = {
  type: 'CompleteLabour';
  payload: {
    labour_id: string;
    notes: string;
  };
};

export type SendLabourInviteCommand = {
  type: 'SendLabourInvite';
  payload: {
    labour_id: string;
    invite_email: string;
  };
};

export type DeleteLabourCommand = {
  type: 'DeleteLabour';
  payload: {
    labour_id: string;
  };
};

export type LabourCommand =
  | UpdateLabourPlanCommand
  | BeginLabourCommand
  | CompleteLabourCommand
  | SendLabourInviteCommand
  | DeleteLabourCommand;

// Public Labour Commands (for unauthenticated users)
export type PublicCommand = PlanLabourCommand;

// Labour Update Commands

export type PostLabourUpdateCommand = {
  type: 'PostLabourUpdate';
  payload: {
    labour_id: string;
    labour_update_type: LabourUpdateType;
    message: string;
  };
};

export type UpdateLabourUpdateMessageCommand = {
  type: 'UpdateLabourUpdateMessage';
  payload: {
    labour_id: string;
    labour_update_id: string;
    message: string;
  };
};

export type UpdateLabourUpdateTypeCommand = {
  type: 'UpdateLabourUpdateType';
  payload: {
    labour_id: string;
    labour_update_id: string;
    labour_update_type: LabourUpdateType;
  };
};

export type DeleteLabourUpdateCommand = {
  type: 'DeleteLabourUpdate';
  payload: {
    labour_id: string;
    labour_update_id: string;
  };
};

export type LabourUpdateCommand =
  | PostLabourUpdateCommand
  | UpdateLabourUpdateMessageCommand
  | UpdateLabourUpdateTypeCommand
  | DeleteLabourUpdateCommand;

// Subscriber Commands

export type RequestAccessCommand = {
  type: 'RequestAccess';
  payload: {
    labour_id: string;
    token: string;
  };
};

export type UnsubscribeCommand = {
  type: 'Unsubscribe';
  payload: {
    labour_id: string;
    subscription_id: string;
  };
};

export type UpdateNotificationMethodsCommand = {
  type: 'UpdateNotificationMethods';
  payload: {
    labour_id: string;
    subscription_id: string;
    notification_methods: SubscriberContactMethod[];
  };
};

export type UpdateAccessLevelCommand = {
  type: 'UpdateAccessLevel';
  payload: {
    labour_id: string;
    subscription_id: string;
    access_level: SubscriberAccessLevel;
  };
};

export type SubscriberCommand =
  | RequestAccessCommand
  | UnsubscribeCommand
  | UpdateNotificationMethodsCommand
  | UpdateAccessLevelCommand;

// Subscription Commands

export type ApproveSubscriberCommand = {
  type: 'ApproveSubscriber';
  payload: {
    labour_id: string;
    subscription_id: string;
  };
};

export type RemoveSubscriberCommand = {
  type: 'RemoveSubscriber';
  payload: {
    labour_id: string;
    subscription_id: string;
  };
};

export type BlockSubscriberCommand = {
  type: 'BlockSubscriber';
  payload: {
    labour_id: string;
    subscription_id: string;
  };
};

export type UnblockSubscriberCommand = {
  type: 'UnblockSubscriber';
  payload: {
    labour_id: string;
    subscription_id: string;
  };
};

export type UpdateSubscriberRoleCommand = {
  type: 'UpdateSubscriberRole';
  payload: {
    labour_id: string;
    subscription_id: string;
    role: SubscriberRole;
  };
};

export type InvalidateSubscriptionTokenCommand = {
  type: 'InvalidateSubscriptionToken';
  payload: { labour_id: string };
};

export type SubscriptionCommand =
  | ApproveSubscriberCommand
  | RemoveSubscriberCommand
  | BlockSubscriberCommand
  | UnblockSubscriberCommand
  | UpdateSubscriberRoleCommand
  | InvalidateSubscriptionTokenCommand;

// Top-level API Command (matches Rust ApiCommand enum)

export type ApiCommand =
  | { type: 'Admin'; payload: AdminCommand }
  | { type: 'Contraction'; payload: ContractionCommand }
  | { type: 'Labour'; payload: LabourCommand }
  | { type: 'LabourUpdate'; payload: LabourUpdateCommand }
  | { type: 'Subscriber'; payload: SubscriberCommand }
  | { type: 'Subscription'; payload: SubscriptionCommand };

// Query Types

export type Cursor = {
  id: string;
  updated_at: string;
};

// Labour Queries

export type GetLabourQuery = {
  type: 'GetLabour';
  payload: {
    labour_id: string;
  };
};

export type LabourQuery = GetLabourQuery;

// Contraction Queries

export type GetContractionsQuery = {
  type: 'GetContractions';
  payload: {
    labour_id: string;
    limit: number;
    cursor?: Cursor;
  };
};

export type GetContractionByIdQuery = {
  type: 'GetContractionById';
  payload: {
    labour_id: string;
    contraction_id: string;
  };
};

export type ContractionQuery = GetContractionsQuery | GetContractionByIdQuery;

// Labour Update Queries

export type GetLabourUpdatesQuery = {
  type: 'GetLabourUpdates';
  payload: {
    labour_id: string;
    limit: number;
    cursor?: Cursor;
  };
};

export type GetLabourUpdateByIdQuery = {
  type: 'GetLabourUpdateById';
  payload: {
    labour_id: string;
    labour_update_id: string;
  };
};

export type LabourUpdateQuery = GetLabourUpdatesQuery | GetLabourUpdateByIdQuery;

// Subscription Queries

export type GetSubscriptionTokenQuery = {
  type: 'GetSubscriptionToken';
  payload: {
    labour_id: string;
  };
};

export type GetLabourSubscriptionsQuery = {
  type: 'GetLabourSubscriptions';
  payload: {
    labour_id: string;
  };
};

export type GetUserSubscriptionsQuery = {
  type: 'GetUserSubscriptions';
  payload: {
    limit: number;
    cursor?: Cursor;
  };
};

export type GetUserSubscriptionQuery = {
  type: 'GetUserSubscription';
  payload: {
    labour_id: string;
  };
};

export type SubscriptionQuery =
  | GetSubscriptionTokenQuery
  | GetLabourSubscriptionsQuery
  | GetUserSubscriptionsQuery
  | GetUserSubscriptionQuery;

// User Queries

export type GetUsersQuery = {
  type: 'GetUsers';
  payload: {
    labour_id: string;
  };
};

export type UserQuery = GetUsersQuery;

// Top-level API Query (matches Rust ApiQuery enum)

export type ApiQuery =
  | { type: 'Labour'; payload: LabourQuery }
  | { type: 'Contraction'; payload: ContractionQuery }
  | { type: 'LabourUpdate'; payload: LabourUpdateQuery }
  | { type: 'Subscription'; payload: SubscriptionQuery }
  | { type: 'User'; payload: UserQuery };

// Read Model Types

export enum LabourPhase {
  PLANNED = 'PLANNED',
  EARLY = 'EARLY',
  ACTIVE = 'ACTIVE',
  TRANSITION = 'TRANSITION',
  PUSHING = 'PUSHING',
  COMPLETED = 'COMPLETED',
}

export type LabourReadModel = {
  labour_id: string;
  mother_id: string;
  mother_name: string;
  current_phase: LabourPhase;
  first_labour: boolean;
  due_date: string;
  labour_name: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LabourStatusReadModel = {
  labour_id: string;
  mother_id: string;
  mother_name: string;
  current_phase: LabourPhase;
  labour_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Duration = {
  start_time: string;
  end_time: string;
};

export type ContractionReadModel = {
  labour_id: string;
  contraction_id: string;
  duration: Duration;
  duration_seconds: number;
  intensity: number | null;
  created_at: string;
  updated_at: string;
};

export type LabourUpdateReadModel = {
  labour_id: string;
  labour_update_id: string;
  labour_update_type: LabourUpdateType;
  message: string;
  edited: boolean;
  application_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionReadModel = {
  subscription_id: string;
  labour_id: string;
  subscriber_id: string;
  role: SubscriberRole;
  status: SubscriberStatus;
  access_level: SubscriberAccessLevel;
  contact_methods: SubscriberContactMethod[];
  created_at: string;
  updated_at: string;
};

export type SubscriptionStatusReadModel = {
  subscription_id: string;
  labour_id: string;
  subscriber_id: string;
  status: SubscriberStatus;
  created_at: string;
  updated_at: string;
};

export type User = {
  user_id: string;
  issuer: string;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CommandResponse = ApiResponse<void>;

export type QueryResponse<T> = ApiResponse<T>;

export type PlanLabourPayload = PlanLabourCommand['payload'];
export type UpdateLabourPlanPayload = UpdateLabourPlanCommand['payload'];
export type BeginLabourPayload = BeginLabourCommand['payload'];
export type CompleteLabourPayload = CompleteLabourCommand['payload'];
export type SendLabourInvitePayload = SendLabourInviteCommand['payload'];
export type DeleteLabourPayload = DeleteLabourCommand['payload'];

export type StartContractionPayload = StartContractionCommand['payload'];
export type EndContractionPayload = EndContractionCommand['payload'];
export type UpdateContractionPayload = UpdateContractionCommand['payload'];
export type DeleteContractionPayload = DeleteContractionCommand['payload'];

export type PostLabourUpdatePayload = PostLabourUpdateCommand['payload'];
export type UpdateLabourUpdateMessagePayload = UpdateLabourUpdateMessageCommand['payload'];
export type UpdateLabourUpdateTypePayload = UpdateLabourUpdateTypeCommand['payload'];
export type DeleteLabourUpdatePayload = DeleteLabourUpdateCommand['payload'];

export type RequestAccessPayload = RequestAccessCommand['payload'];
export type UnsubscribePayload = UnsubscribeCommand['payload'];
export type UpdateNotificationMethodsPayload = UpdateNotificationMethodsCommand['payload'];
export type UpdateAccessLevelPayload = UpdateAccessLevelCommand['payload'];

export type ApproveSubscriberPayload = ApproveSubscriberCommand['payload'];
export type RemoveSubscriberPayload = RemoveSubscriberCommand['payload'];
export type BlockSubscriberPayload = BlockSubscriberCommand['payload'];
export type UnblockSubscriberPayload = UnblockSubscriberCommand['payload'];
export type UpdateSubscriberRolePayload = UpdateSubscriberRoleCommand['payload'];

export type RebuildReadModelsPayload = RebuildReadModelsCommand['payload'];

export interface CreateCheckoutSessionRequest {
  subscription_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  session_id: string;
}
