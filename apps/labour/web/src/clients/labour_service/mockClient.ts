import dayjs from 'dayjs';
import { LabourServiceClient } from './client';
import {
  ApiResponse,
  CommandResponse,
  ContractionReadModel,
  Cursor,
  LabourPhase,
  LabourReadModel,
  LabourStatusReadModel,
  LabourUpdateReadModel,
  LabourUpdateType,
  PaginatedResponse,
  QueryResponse,
  SubscriberAccessLevel,
  SubscriberContactMethod,
  SubscriberRole,
  SubscriberStatus,
  SubscriptionReadModel,
  SubscriptionStatusReadModel,
  User,
} from './types';

interface MockStore {
  labour: LabourReadModel;
  contractions: ContractionReadModel[];
  updates: LabourUpdateReadModel[];
  subscriptions: SubscriptionReadModel[];
  users: User[];
}

const DEFAULT_LABOUR_ID = 'demo-labour-id';
const DEFAULT_USER_ID = 'demo-user-id';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createInitialStore = (): MockStore => {
  const now = dayjs();
  const labourStarted = now.subtract(12, 'hour');

  return {
    users: [
      {
        user_id: DEFAULT_USER_ID,
        issuer: 'demo-issuer',
        email: 'sarah.jenkins@example.com',
        first_name: 'Sarah',
        last_name: 'Jenkins',
        name: 'Sarah Jenkins',
      },
      {
        user_id: 'user-tom',
        issuer: 'demo-issuer',
        email: 'tom.jenkins@example.com',
        first_name: 'Tom',
        last_name: 'Jenkins',
        name: 'Tom Jenkins',
      },
      {
        user_id: 'user-mary',
        issuer: 'demo-issuer',
        email: 'mary.smith@example.com',
        first_name: 'Mary',
        last_name: 'Smith',
        name: 'Mary Smith',
      },
      {
        user_id: 'user-emily',
        issuer: 'demo-issuer',
        email: 'emily.wilson@example.com',
        first_name: 'Emily',
        last_name: 'Wilson',
        name: 'Emily Wilson',
      },
      {
        user_id: 'user-jane',
        issuer: 'demo-issuer',
        email: 'jane.doe@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        name: 'Jane Doe',
      },
      {
        user_id: 'user-neighbor',
        issuer: 'demo-issuer',
        email: 'nosy.neighbor@example.com',
        first_name: 'Nosy',
        last_name: 'Neighbor',
        name: 'Nosy Neighbor',
      },
      {
        user_id: 'user-cousin',
        issuer: 'demo-issuer',
        email: 'distant.cousin@example.com',
        first_name: 'Distant',
        last_name: 'Cousin',
        name: 'Distant Cousin',
      }
    ],
    labour: {
      labour_id: DEFAULT_LABOUR_ID,
      mother_id: DEFAULT_USER_ID,
      mother_name: 'Sarah Jenkins',
      current_phase: LabourPhase.ACTIVE,
      first_labour: true,
      due_date: now.add(2, 'day').toISOString(),
      labour_name: 'Baby Jenkins',
      start_time: labourStarted.toISOString(),
      end_time: null,
      notes: 'Water broke at home. Trying to stay relaxed.',
      created_at: labourStarted.toISOString(),
      updated_at: now.toISOString(),
    },
    contractions: [
      {
        labour_id: DEFAULT_LABOUR_ID,
        contraction_id: 'c1',
        duration: {
          start_time: labourStarted.add(30, 'minute').toISOString(),
          end_time: labourStarted.add(30, 'minute').add(45, 'second').toISOString(),
        },
        duration_seconds: 45,
        intensity: 2,
        created_at: labourStarted.add(30, 'minute').toISOString(),
        updated_at: labourStarted.add(30, 'minute').add(45, 'second').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        contraction_id: 'c2',
        duration: {
          start_time: labourStarted.add(55, 'minute').toISOString(),
          end_time: labourStarted.add(55, 'minute').add(52, 'second').toISOString(),
        },
        duration_seconds: 52,
        intensity: 3,
        created_at: labourStarted.add(55, 'minute').toISOString(),
        updated_at: labourStarted.add(55, 'minute').add(52, 'second').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        contraction_id: 'c3',
        duration: {
          start_time: now.subtract(2, 'hour').toISOString(),
          end_time: now.subtract(2, 'hour').add(65, 'second').toISOString(),
        },
        duration_seconds: 65,
        intensity: 6,
        created_at: now.subtract(2, 'hour').toISOString(),
        updated_at: now.subtract(2, 'hour').add(65, 'second').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        contraction_id: 'c4',
        duration: {
          start_time: now.subtract(1, 'hour').add(45, 'minute').toISOString(),
          end_time: now.subtract(1, 'hour').add(46, 'minute').add(10, 'second').toISOString(),
        },
        duration_seconds: 85,
        intensity: 7,
        created_at: now.subtract(1, 'hour').add(45, 'minute').toISOString(),
        updated_at: now.subtract(1, 'hour').add(46, 'minute').add(10, 'second').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        contraction_id: 'c5',
        duration: {
          start_time: now.subtract(12, 'minute').toISOString(),
          end_time: now.subtract(11, 'minute').toISOString(),
        },
        duration_seconds: 60,
        intensity: 8,
        created_at: now.subtract(12, 'minute').toISOString(),
        updated_at: now.subtract(11, 'minute').toISOString(),
      },
    ].reverse(),
    updates: [
      {
        labour_id: DEFAULT_LABOUR_ID,
        labour_update_id: 'u1',
        labour_update_type: LabourUpdateType.STATUS_UPDATE,
        message: "Feeling some mild cramping, trying to rest.",
        edited: false,
        application_generated: false,
        created_at: labourStarted.add(15, 'minute').toISOString(),
        updated_at: labourStarted.add(15, 'minute').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        labour_update_id: 'u2',
        labour_update_type: LabourUpdateType.STATUS_UPDATE,
        message: "Waters might have broken? Calling the midwife to check.",
        edited: false,
        application_generated: false,
        created_at: labourStarted.add(2, 'hour').toISOString(),
        updated_at: labourStarted.add(2, 'hour').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        labour_update_id: 'u3',
        labour_update_type: LabourUpdateType.ANNOUNCEMENT,
        message: "It's official! Things are moving along. Contractions are 10 mins apart.",
        edited: false,
        application_generated: false,
        created_at: now.subtract(3, 'hour').toISOString(),
        updated_at: now.subtract(3, 'hour').toISOString(),
      },
      {
        labour_id: DEFAULT_LABOUR_ID,
        labour_update_id: 'u4',
        labour_update_type: LabourUpdateType.STATUS_UPDATE,
        message: "Tom is packing the car now. Bags are by the door.",
        edited: false,
        application_generated: false,
        created_at: now.subtract(1, 'hour').toISOString(),
        updated_at: now.subtract(1, 'hour').toISOString(),
      },
    ].reverse(),
    subscriptions: [
      {
        subscription_id: 's1',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-tom',
        role: SubscriberRole.BIRTH_PARTNER,
        status: SubscriberStatus.SUBSCRIBED,
        access_level: SubscriberAccessLevel.SUPPORTER,
        contact_methods: [SubscriberContactMethod.EMAIL, SubscriberContactMethod.SMS],
        created_at: labourStarted.subtract(5, 'day').toISOString(),
        updated_at: labourStarted.subtract(5, 'day').toISOString(),
      },
      {
        subscription_id: 's2',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-mary',
        role: SubscriberRole.SUPPORT_PERSON,
        status: SubscriberStatus.SUBSCRIBED,
        access_level: SubscriberAccessLevel.SUPPORTER,
        contact_methods: [SubscriberContactMethod.SMS],
        created_at: labourStarted.subtract(2, 'day').toISOString(),
        updated_at: labourStarted.subtract(2, 'day').toISOString(),
      },
      {
        subscription_id: 's3',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-emily',
        role: SubscriberRole.SUPPORT_PERSON,
        status: SubscriberStatus.SUBSCRIBED,
        access_level: SubscriberAccessLevel.SUPPORTER,
        contact_methods: [SubscriberContactMethod.WHATSAPP],
        created_at: labourStarted.subtract(1, 'day').toISOString(),
        updated_at: labourStarted.subtract(1, 'day').toISOString(),
      },
      {
        subscription_id: 's4',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-jane',
        role: SubscriberRole.LOVED_ONE,
        status: SubscriberStatus.SUBSCRIBED,
        access_level: SubscriberAccessLevel.BASIC,
        contact_methods: [SubscriberContactMethod.EMAIL],
        created_at: labourStarted.subtract(12, 'hour').toISOString(),
        updated_at: labourStarted.subtract(12, 'hour').toISOString(),
      },
      {
        subscription_id: 's5',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-neighbor',
        role: SubscriberRole.LOVED_ONE,
        status: SubscriberStatus.BLOCKED,
        access_level: SubscriberAccessLevel.BASIC,
        contact_methods: [],
        created_at: labourStarted.subtract(6, 'hour').toISOString(),
        updated_at: labourStarted.subtract(1, 'hour').toISOString(),
      },
      {
        subscription_id: 's6',
        labour_id: DEFAULT_LABOUR_ID,
        subscriber_id: 'user-cousin',
        role: SubscriberRole.LOVED_ONE,
        status: SubscriberStatus.REQUESTED,
        access_level: SubscriberAccessLevel.BASIC,
        contact_methods: [],
        created_at: now.subtract(30, 'minute').toISOString(),
        updated_at: now.subtract(30, 'minute').toISOString(),
      },
    ]
  };
};

let store = createInitialStore();

export const resetMockStore = () => {
  store = createInitialStore();
};

export class MockLabourServiceClient extends LabourServiceClient {
  private async mockDelay<T>(data: T, ms = 100): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
  }

  private success<T>(data: T): ApiResponse<T> {
    return { success: true, data };
  }

  private commandSuccess(): CommandResponse {
    return { success: true };
  }

  async rebuildReadModels(aggregateId: string): Promise<CommandResponse> {
    console.log('[Mock] Rebuild read models', aggregateId);
    return this.mockDelay(this.commandSuccess());
  }
  async startContraction(
    labourId: string,
    contractionId: string,
    startTime?: Date
  ): Promise<CommandResponse> {
    console.log('[Mock] Start Contraction');
    const start = startTime ? dayjs(startTime) : dayjs();

    const newContraction: ContractionReadModel = {
      labour_id: labourId,
      contraction_id: contractionId,
      duration: {
        start_time: start.toISOString(),
        end_time: start.toISOString(),
      },
      duration_seconds: 0,
      intensity: null,
      created_at: start.toISOString(),
      updated_at: start.toISOString(),
    };

    store.contractions.unshift(newContraction);
    return this.mockDelay(this.commandSuccess());
  }

  async endContraction(
    labourId: string,
    intensity: number,
    contractionId: string,
    endTime?: Date
  ): Promise<CommandResponse> {
    console.log('[Mock] End Contraction');
    const end = endTime ? dayjs(endTime) : dayjs();

    const index = store.contractions.findIndex(c => c.contraction_id === contractionId);

    if (index !== -1) {
      const c = store.contractions[index];
      const start = dayjs(c.duration.start_time);

      c.duration.end_time = end.toISOString();
      c.duration_seconds = end.diff(start, 'second');
      c.intensity = intensity;
      c.updated_at = end.toISOString();

      store.contractions[index] = { ...c };
    } else {
      const start = dayjs().subtract(1, 'minute');
      const newContraction: ContractionReadModel = {
        labour_id: labourId,
        contraction_id: contractionId,
        duration: {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
        duration_seconds: end.diff(start, 'second'),
        intensity,
        created_at: start.toISOString(),
        updated_at: end.toISOString(),
      };
      store.contractions.unshift(newContraction);
    }

    return this.mockDelay(this.commandSuccess());
  }

  async updateContraction(params: {
    labourId: string;
    contractionId: string;
    startTime?: Date;
    endTime?: Date;
    intensity?: number;
  }): Promise<CommandResponse> {
    console.log('[Mock] Update Contraction');
    const index = store.contractions.findIndex((c) => c.contraction_id === params.contractionId);
    if (index !== -1) {
      const c = store.contractions[index];
      if (params.startTime) {
        c.duration.start_time = params.startTime.toISOString();
      }
      if (params.endTime) {
        c.duration.end_time = params.endTime.toISOString();
      }
      if (params.intensity !== undefined) {
        c.intensity = params.intensity;
      }
      store.contractions[index] = { ...c };
    }
    return this.mockDelay(this.commandSuccess());
  }

  async deleteContraction(_labourId: string, contractionId: string): Promise<CommandResponse> {
    console.log('[Mock] Delete Contraction');
    store.contractions = store.contractions.filter((c) => c.contraction_id !== contractionId);
    return this.mockDelay(this.commandSuccess());
  }

  async planLabour(params: {
    firstLabour: boolean;
    dueDate: Date;
    labourName?: string;
  }): Promise<ApiResponse<{ labour_id: string }>> {
    console.log('[Mock] Plan Labour');
    store.labour = {
      ...store.labour,
      first_labour: params.firstLabour,
      due_date: params.dueDate.toISOString(),
      labour_name: params.labourName || null,
      current_phase: LabourPhase.PLANNED,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return this.mockDelay(this.success({ labour_id: store.labour.labour_id }));
  }

  async updateLabourPlan(params: {
    labourId: string;
    firstLabour: boolean;
    dueDate: Date;
    labourName?: string;
  }): Promise<CommandResponse> {
    console.log('[Mock] Update Labour Plan');
    store.labour = {
      ...store.labour,
      first_labour: params.firstLabour,
      due_date: params.dueDate.toISOString(),
      labour_name: params.labourName || null,
    };
    return this.mockDelay(this.commandSuccess());
  }

  async beginLabour(_labourId: string): Promise<CommandResponse> {
    console.log('[Mock] Begin Labour');
    store.labour.current_phase = LabourPhase.EARLY;
    store.labour.start_time = new Date().toISOString();
    return this.mockDelay(this.commandSuccess());
  }

  async completeLabour(params: { labourId: string; notes: string }): Promise<CommandResponse> {
    console.log('[Mock] Complete Labour');
    store.labour.current_phase = LabourPhase.COMPLETED;
    store.labour.end_time = new Date().toISOString();
    store.labour.notes = params.notes;
    return this.mockDelay(this.commandSuccess());
  }

  async sendLabourInvite(_labourId: string, inviteEmail: string): Promise<CommandResponse> {
    console.log('[Mock] Send Invite', inviteEmail);
    return this.mockDelay(this.commandSuccess());
  }

  async deleteLabour(_labourId: string): Promise<CommandResponse> {
    console.log('[Mock] Delete Labour');
    return this.mockDelay(this.commandSuccess());
  }

  async postLabourUpdate(
    labourId: string,
    updateType: LabourUpdateType,
    message: string
  ): Promise<CommandResponse> {
    console.log('[Mock] Post Update');
    store.updates.unshift({
      labour_id: labourId,
      labour_update_id: generateId(),
      labour_update_type: updateType,
      message,
      edited: false,
      application_generated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return this.mockDelay(this.commandSuccess());
  }

  async updateLabourUpdateMessage(
    _labourId: string,
    labourUpdateId: string,
    message: string
  ): Promise<CommandResponse> {
    console.log('[Mock] Update Message');
    const update = store.updates.find((u) => u.labour_update_id === labourUpdateId);
    if (update) {
      update.message = message;
      update.edited = true;
      update.updated_at = new Date().toISOString();
    }
    return this.mockDelay(this.commandSuccess());
  }

  async updateLabourUpdateType(
    _labourId: string,
    labourUpdateId: string,
    updateType: LabourUpdateType
  ): Promise<CommandResponse> {
    console.log('[Mock] Update Type');
    const update = store.updates.find((u) => u.labour_update_id === labourUpdateId);
    if (update) {
      update.labour_update_type = updateType;
      update.edited = true;
      update.updated_at = new Date().toISOString();
    }
    return this.mockDelay(this.commandSuccess());
  }

  async deleteLabourUpdate(_labourId: string, labourUpdateId: string): Promise<CommandResponse> {
    console.log('[Mock] Delete Update');
    store.updates = store.updates.filter((u) => u.labour_update_id !== labourUpdateId);
    return this.mockDelay(this.commandSuccess());
  }

  async requestAccess(_labourId: string, _token: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async unsubscribe(_labourId: string, _subscriptionId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async updateNotificationMethods(
    _labourId: string,
    _subscriptionId: string,
    _methods: SubscriberContactMethod[]
  ): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async updateAccessLevel(
    _labourId: string,
    _subscriptionId: string,
    _accessLevel: SubscriberAccessLevel
  ): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async approveSubscriber(_labourId: string, _subscriptionId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async removeSubscriber(_labourId: string, _subscriptionId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async blockSubscriber(_labourId: string, _subscriptionId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async unblockSubscriber(_labourId: string, _subscriptionId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }
  async updateSubscriberRole(
    _labourId: string,
    subscriptionId: string,
    role: SubscriberRole
  ): Promise<CommandResponse> {
    console.log('[Mock] Update Role', subscriptionId, role);
    const sub = store.subscriptions.find(s => s.subscription_id === subscriptionId);
    if (sub) {
      sub.role = role;
      sub.updated_at = new Date().toISOString();
    }
    return this.mockDelay(this.commandSuccess());
  }

  async invalidateSubscriptionToken(_labourId: string): Promise<CommandResponse> {
    return this.mockDelay(this.commandSuccess());
  }

  async getLabour(_labourId: string): Promise<QueryResponse<LabourReadModel>> {
    return this.mockDelay(this.success(store.labour));
  }

  async getLabourHistory(): Promise<ApiResponse<LabourStatusReadModel[]>> {
    const status: LabourStatusReadModel = {
      labour_id: store.labour.labour_id,
      mother_id: store.labour.mother_id,
      mother_name: store.labour.mother_name,
      current_phase: store.labour.current_phase,
      labour_name: store.labour.labour_name,
      created_at: store.labour.created_at,
      updated_at: store.labour.updated_at,
    };
    return this.mockDelay(this.success([status]));
  }

  async getActiveLabour(): Promise<ApiResponse<LabourStatusReadModel | null>> {
    const status: LabourStatusReadModel = {
      labour_id: store.labour.labour_id,
      mother_id: store.labour.mother_id,
      mother_name: store.labour.mother_name,
      current_phase: store.labour.current_phase,
      labour_name: store.labour.labour_name,
      created_at: store.labour.created_at,
      updated_at: store.labour.updated_at,
    };
    return this.mockDelay(this.success(status));
  }

  async getContractions(
    _labourId: string,
    _limit: number = 20,
    _cursor?: Cursor
  ): Promise<QueryResponse<PaginatedResponse<ContractionReadModel>>> {
    return this.mockDelay(
      this.success({
        data: store.contractions,
        has_more: false,
        next_cursor: null,
      })
    );
  }

  async getContractionById(
    _labourId: string,
    contractionId: string
  ): Promise<QueryResponse<PaginatedResponse<ContractionReadModel>>> {
    const c = store.contractions.find((x) => x.contraction_id === contractionId);
    return this.mockDelay(
      this.success({
        data: c ? [c] : [],
        has_more: false,
        next_cursor: null,
      })
    );
  }

  async getLabourUpdates(
    _labourId: string,
    _limit: number = 20,
    _cursor?: Cursor
  ): Promise<QueryResponse<PaginatedResponse<LabourUpdateReadModel>>> {
    return this.mockDelay(
      this.success({
        data: store.updates,
        has_more: false,
        next_cursor: null,
      })
    );
  }

  async getLabourUpdateById(
    _labourId: string,
    labourUpdateId: string
  ): Promise<QueryResponse<PaginatedResponse<LabourUpdateReadModel>>> {
    const u = store.updates.find((x) => x.labour_update_id === labourUpdateId);
    return this.mockDelay(
      this.success({
        data: u ? [u] : [],
        has_more: false,
        next_cursor: null,
      })
    );
  }

  async getSubscriptionToken(_labourId: string): Promise<QueryResponse<{ token: string }>> {
    return this.mockDelay(this.success({ token: 'demo-token-123' }));
  }

  async getLabourSubscriptions(
    _labourId: string
  ): Promise<QueryResponse<PaginatedResponse<SubscriptionReadModel>>> {
    return this.mockDelay(
      this.success({
        data: store.subscriptions,
        has_more: false,
        next_cursor: null,
      })
    );
  }

  async getUserSubscription(_labourId: string): Promise<QueryResponse<SubscriptionReadModel>> {
    return this.mockDelay(this.success(store.subscriptions[0]));
  }

  async getUserSubscriptions(): Promise<ApiResponse<SubscriptionStatusReadModel[]>> {
    return this.mockDelay(this.success([]));
  }

  async getSubscribedLabours(): Promise<ApiResponse<LabourStatusReadModel[]>> {
    return this.mockDelay(this.success([]));
  }

  async getUsers(_labourId: string): Promise<QueryResponse<User[]>> {
    return this.mockDelay(this.success(store.users));
  }
}
