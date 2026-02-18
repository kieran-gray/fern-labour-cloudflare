export interface EventMetadata {
  aggregate_id: string;
  sequence: number;
  event_version: number;
  timestamp: string;
  user_id: string;
}

export interface NotificationRequestedData {
  notification_id: string;
  channel: string;
  destination: {
    type: string;
    value: string;
  };
  template_data: {
    type: string;
    [key: string]: unknown;
  };
  scheduled_at?: string | null;
  metadata: Record<string, unknown> | null;
}

export interface RenderedContentStoredData {
  notification_id: string;
  rendered_content: {
    Email?: {
      subject: string;
      html_body: string;
    };
    Sms?: {
      body: string;
    };
    WhatsApp?: {
      template_sid: string;
      content_variables: string;
    };
  };
}

export interface NotificationDispatchedData {
  notification_id: string;
  external_id: string;
}

export interface NotificationScheduledData {
  notification_id: string;
  external_id: string | null;
  provider: string;
}

export interface NotificationDeliveredData {
  notification_id: string;
}

export interface NotificationFailedData {
  notification_id: string;
  error?: string;
  reason?: string | null;
  provider?: string;
  external_id?: string;
}

export interface NotificationContentRedacted {
  notification_id: string;
}

export interface NotificationDeleted {
  notification_id: string;
}

export type NotificationEvent =
  | { type: "NotificationRequested"; data: NotificationRequestedData }
  | { type: "RenderedContentStored"; data: RenderedContentStoredData }
  | { type: "NotificationScheduled"; data: NotificationScheduledData }
  | { type: "NotificationDispatched"; data: NotificationDispatchedData }
  | { type: "NotificationDelivered"; data: NotificationDeliveredData }
  | { type: "NotificationFailed"; data: NotificationFailedData }
  | { type: "NotificationDeliveryFailed"; data: NotificationFailedData }
  | { type: "NotificationContentRedacted"; data: NotificationContentRedacted }
  | { type: "NotificationDeleted"; data: NotificationDeleted };

export interface Event {
  metadata: EventMetadata;
  event: NotificationEvent;
}

export type EventsResponse = Record<string, Event>;
