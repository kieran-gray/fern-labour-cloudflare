/**
 * Labour Service Client
 *
 * This client provides methods to interact with the Cloudflare Workers API
 * using the command pattern defined in the Rust backend.
 */

import type {
  AdminCommand,
  ApiResponse,
  CommandResponse,
  ContractionCommand,
  ContractionQuery,
  ContractionReadModel,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  Cursor,
  LabourCommand,
  LabourQuery,
  LabourReadModel,
  LabourStatusReadModel,
  LabourUpdateCommand,
  LabourUpdateQuery,
  LabourUpdateReadModel,
  LabourUpdateType,
  PaginatedResponse,
  QueryResponse,
  SubscriberAccessLevel,
  SubscriberCommand,
  SubscriberContactMethod,
  SubscriberRole,
  SubscriptionCommand,
  SubscriptionQuery,
  SubscriptionReadModel,
  SubscriptionStatusReadModel,
  User,
  UserQuery,
} from './types';

export interface LabourServiceConfig {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  websocket?: {
    isConnected: boolean;
    sendMessage: (message: {
      kind: 'Command' | 'Query';
      payload: any;
    }) => Promise<{ data?: any; error?: string }>;
  };
}

export class LabourServiceClient {
  private config: LabourServiceConfig;

  constructor(config: LabourServiceConfig) {
    this.config = config;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.getAccessToken) {
      const token = await this.config.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async sendCommand<T = void>(command: unknown): Promise<ApiResponse<T>> {
    if (this.config.websocket?.isConnected) {
      try {
        const response = await this.config.websocket.sendMessage({
          kind: 'Command',
          payload: command,
        });

        if (response.error) {
          return {
            success: false,
            error: response.error,
          };
        }

        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        console.warn('[Client] WebSocket command failed, falling back to HTTP', error);
      }
    }

    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/command`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = response.status === 204 ? undefined : await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async executeRawCommand(command: unknown): Promise<ApiResponse<void>> {
    return this.sendCommand(command);
  }

  private async sendPlanLabour(dto: {
    first_labour: boolean;
    due_date: string;
    labour_name?: string;
  }): Promise<ApiResponse<{ labour_id: string }>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/labour/plan`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Admin Commands

  async rebuildReadModels(aggregateId: string): Promise<CommandResponse> {
    const command: AdminCommand = {
      type: 'RebuildReadModels',
      payload: { aggregate_id: aggregateId },
    };
    return this.sendCommand({ type: 'Admin', payload: command });
  }

  // Contraction Commands

  async startContraction(
    labourId: string,
    startTime: Date,
    contractionId: string
  ): Promise<CommandResponse> {
    const command: ContractionCommand = {
      type: 'StartContraction',
      payload: {
        labour_id: labourId,
        start_time: startTime.toISOString(),
        contraction_id: contractionId,
      },
    };
    return this.sendCommand({ type: 'Contraction', payload: command });
  }

  async endContraction(
    labourId: string,
    endTime: Date,
    intensity: number,
    contractionId: string
  ): Promise<CommandResponse> {
    const command: ContractionCommand = {
      type: 'EndContraction',
      payload: {
        labour_id: labourId,
        end_time: endTime.toISOString(),
        intensity,
        contraction_id: contractionId,
      },
    };
    return this.sendCommand({ type: 'Contraction', payload: command });
  }

  async updateContraction(params: {
    labourId: string;
    contractionId: string;
    startTime?: Date;
    endTime?: Date;
    intensity?: number;
  }): Promise<CommandResponse> {
    const command: ContractionCommand = {
      type: 'UpdateContraction',
      payload: {
        labour_id: params.labourId,
        contraction_id: params.contractionId,
        start_time: params.startTime?.toISOString(),
        end_time: params.endTime?.toISOString(),
        intensity: params.intensity,
      },
    };
    return this.sendCommand({ type: 'Contraction', payload: command });
  }

  async deleteContraction(labourId: string, contractionId: string): Promise<CommandResponse> {
    const command: ContractionCommand = {
      type: 'DeleteContraction',
      payload: {
        labour_id: labourId,
        contraction_id: contractionId,
      },
    };
    return this.sendCommand({ type: 'Contraction', payload: command });
  }

  // Labour Commands

  async planLabour(params: {
    firstLabour: boolean;
    dueDate: Date;
    labourName?: string;
  }): Promise<ApiResponse<{ labour_id: string }>> {
    return this.sendPlanLabour({
      first_labour: params.firstLabour,
      due_date: params.dueDate.toISOString(),
      labour_name: params.labourName,
    });
  }

  async updateLabourPlan(params: {
    labourId: string;
    firstLabour: boolean;
    dueDate: Date;
    labourName?: string;
  }): Promise<CommandResponse> {
    const command: LabourCommand = {
      type: 'UpdateLabourPlan',
      payload: {
        labour_id: params.labourId,
        first_labour: params.firstLabour,
        due_date: params.dueDate.toISOString(),
        labour_name: params.labourName,
      },
    };
    return this.sendCommand({ type: 'Labour', payload: command });
  }

  async beginLabour(labourId: string): Promise<CommandResponse> {
    const command: LabourCommand = {
      type: 'BeginLabour',
      payload: { labour_id: labourId },
    };
    return this.sendCommand({ type: 'Labour', payload: command });
  }

  async completeLabour(params: { labourId: string; notes: string }): Promise<CommandResponse> {
    const command: LabourCommand = {
      type: 'CompleteLabour',
      payload: { labour_id: params.labourId, notes: params.notes },
    };
    return this.sendCommand({ type: 'Labour', payload: command });
  }

  async sendLabourInvite(labourId: string, inviteEmail: string): Promise<CommandResponse> {
    const command: LabourCommand = {
      type: 'SendLabourInvite',
      payload: {
        labour_id: labourId,
        invite_email: inviteEmail,
      },
    };
    return this.sendCommand({ type: 'Labour', payload: command });
  }

  async deleteLabour(labourId: string): Promise<CommandResponse> {
    const command: LabourCommand = {
      type: 'DeleteLabour',
      payload: { labour_id: labourId },
    };
    return this.sendCommand({ type: 'Labour', payload: command });
  }

  // Labour Update Commands

  async postLabourUpdate(
    labourId: string,
    updateType: LabourUpdateType,
    message: string
  ): Promise<CommandResponse> {
    const command: LabourUpdateCommand = {
      type: 'PostLabourUpdate',
      payload: {
        labour_id: labourId,
        labour_update_type: updateType,
        message,
      },
    };
    return this.sendCommand({ type: 'LabourUpdate', payload: command });
  }

  async updateLabourUpdateMessage(
    labourId: string,
    labourUpdateId: string,
    message: string
  ): Promise<CommandResponse> {
    const command: LabourUpdateCommand = {
      type: 'UpdateLabourUpdateMessage',
      payload: {
        labour_id: labourId,
        labour_update_id: labourUpdateId,
        message,
      },
    };
    return this.sendCommand({ type: 'LabourUpdate', payload: command });
  }

  async updateLabourUpdateType(
    labourId: string,
    labourUpdateId: string,
    updateType: LabourUpdateType
  ): Promise<CommandResponse> {
    const command: LabourUpdateCommand = {
      type: 'UpdateLabourUpdateType',
      payload: {
        labour_id: labourId,
        labour_update_id: labourUpdateId,
        labour_update_type: updateType,
      },
    };
    return this.sendCommand({ type: 'LabourUpdate', payload: command });
  }

  async deleteLabourUpdate(labourId: string, labourUpdateId: string): Promise<CommandResponse> {
    const command: LabourUpdateCommand = {
      type: 'DeleteLabourUpdate',
      payload: {
        labour_id: labourId,
        labour_update_id: labourUpdateId,
      },
    };
    return this.sendCommand({ type: 'LabourUpdate', payload: command });
  }

  // Subscriber Commands

  async requestAccess(labourId: string, token: string): Promise<CommandResponse> {
    const command: SubscriberCommand = {
      type: 'RequestAccess',
      payload: {
        labour_id: labourId,
        token,
      },
    };
    return this.sendCommand({ type: 'Subscriber', payload: command });
  }

  async unsubscribe(labourId: string, subscriptionId: string): Promise<CommandResponse> {
    const command: SubscriberCommand = {
      type: 'Unsubscribe',
      payload: { labour_id: labourId, subscription_id: subscriptionId },
    };
    return this.sendCommand({ type: 'Subscriber', payload: command });
  }

  async updateNotificationMethods(
    labourId: string,
    subscriptionId: string,
    methods: SubscriberContactMethod[]
  ): Promise<CommandResponse> {
    const command: SubscriberCommand = {
      type: 'UpdateNotificationMethods',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
        notification_methods: methods,
      },
    };
    return this.sendCommand({ type: 'Subscriber', payload: command });
  }

  async updateAccessLevel(
    labourId: string,
    subscriptionId: string,
    accessLevel: SubscriberAccessLevel
  ): Promise<CommandResponse> {
    const command: SubscriberCommand = {
      type: 'UpdateAccessLevel',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
        access_level: accessLevel,
      },
    };
    return this.sendCommand({ type: 'Subscriber', payload: command });
  }

  // Subscription Commands

  async approveSubscriber(labourId: string, subscriptionId: string): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'ApproveSubscriber',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
      },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  async removeSubscriber(labourId: string, subscriptionId: string): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'RemoveSubscriber',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
      },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  async blockSubscriber(labourId: string, subscriptionId: string): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'BlockSubscriber',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
      },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  async unblockSubscriber(labourId: string, subscriptionId: string): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'UnblockSubscriber',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
      },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  async updateSubscriberRole(
    labourId: string,
    subscriptionId: string,
    role: SubscriberRole
  ): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'UpdateSubscriberRole',
      payload: {
        labour_id: labourId,
        subscription_id: subscriptionId,
        role,
      },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  async invalidateSubscriptionToken(labourId: string): Promise<CommandResponse> {
    const command: SubscriptionCommand = {
      type: 'InvalidateSubscriptionToken',
      payload: { labour_id: labourId },
    };
    return this.sendCommand({ type: 'Subscription', payload: command });
  }

  // Query Methods

  private async sendQuery<T>(query: unknown): Promise<QueryResponse<T>> {
    if (this.config.websocket?.isConnected) {
      try {
        const response = await this.config.websocket.sendMessage({
          kind: 'Query',
          payload: query,
        });

        if (response.error) {
          return {
            success: false,
            error: response.error,
          };
        }

        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        console.warn('[Client] WebSocket query failed, falling back to HTTP', error);
      }
    }

    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/query`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Labour Queries

  async getLabour(labourId: string): Promise<QueryResponse<LabourReadModel>> {
    const query: LabourQuery = {
      type: 'GetLabour',
      payload: { labour_id: labourId },
    };
    return this.sendQuery({ type: 'Labour', payload: query });
  }

  async getLabourHistory(): Promise<ApiResponse<LabourStatusReadModel[]>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/labour/history`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getActiveLabour(): Promise<ApiResponse<LabourStatusReadModel | null>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/labour/active`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Contraction Queries

  async getContractions(
    labourId: string,
    limit: number = 20,
    cursor?: Cursor
  ): Promise<QueryResponse<PaginatedResponse<ContractionReadModel>>> {
    const query: ContractionQuery = {
      type: 'GetContractions',
      payload: {
        labour_id: labourId,
        limit,
        cursor,
      },
    };
    return this.sendQuery({ type: 'Contraction', payload: query });
  }

  async getContractionById(
    labourId: string,
    contractionId: string
  ): Promise<QueryResponse<PaginatedResponse<ContractionReadModel>>> {
    const query: ContractionQuery = {
      type: 'GetContractionById',
      payload: {
        labour_id: labourId,
        contraction_id: contractionId,
      },
    };
    return this.sendQuery({ type: 'Contraction', payload: query });
  }

  // Labour Update Queries

  async getLabourUpdates(
    labourId: string,
    limit: number = 20,
    cursor?: Cursor
  ): Promise<QueryResponse<PaginatedResponse<LabourUpdateReadModel>>> {
    const query: LabourUpdateQuery = {
      type: 'GetLabourUpdates',
      payload: {
        labour_id: labourId,
        limit,
        cursor,
      },
    };
    return this.sendQuery({ type: 'LabourUpdate', payload: query });
  }

  async getLabourUpdateById(
    labourId: string,
    labourUpdateId: string
  ): Promise<QueryResponse<PaginatedResponse<LabourUpdateReadModel>>> {
    const query: LabourUpdateQuery = {
      type: 'GetLabourUpdateById',
      payload: {
        labour_id: labourId,
        labour_update_id: labourUpdateId,
      },
    };
    return this.sendQuery({ type: 'LabourUpdate', payload: query });
  }

  // Subscription Queries

  async getSubscriptionToken(labourId: string): Promise<QueryResponse<{ token: string }>> {
    const query: SubscriptionQuery = {
      type: 'GetSubscriptionToken',
      payload: {
        labour_id: labourId,
      },
    };
    return this.sendQuery({ type: 'Subscription', payload: query });
  }

  async getLabourSubscriptions(
    labourId: string
  ): Promise<QueryResponse<PaginatedResponse<SubscriptionReadModel>>> {
    const query: SubscriptionQuery = {
      type: 'GetLabourSubscriptions',
      payload: {
        labour_id: labourId,
      },
    };
    return this.sendQuery({ type: 'Subscription', payload: query });
  }

  async getUserSubscription(labourId: string): Promise<QueryResponse<SubscriptionReadModel>> {
    const query: SubscriptionQuery = {
      type: 'GetUserSubscription',
      payload: {
        labour_id: labourId,
      },
    };
    return this.sendQuery({ type: 'Subscription', payload: query });
  }

  async getUserSubscriptions(): Promise<ApiResponse<SubscriptionStatusReadModel[]>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/subscriptions/list`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getSubscribedLabours(): Promise<ApiResponse<LabourStatusReadModel[]>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/subscriptions/labours`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // User Queries

  async getUsers(labourId: string): Promise<QueryResponse<User[]>> {
    const query: UserQuery = {
      type: 'GetUsers',
      payload: {
        labour_id: labourId,
      },
    };
    return this.sendQuery({ type: 'User', payload: query });
  }

  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<ApiResponse<CreateCheckoutSessionResponse>> {
    const headers = await this.getHeaders();
    const url = `${this.config.baseUrl}/api/v1/payments/checkout`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
