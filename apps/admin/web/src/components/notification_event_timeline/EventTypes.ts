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

export interface NotificationDeliveredData {
  notification_id: string;
}

export interface NotificationFailedData {
  notification_id: string;
  error: string;
}

export type NotificationEvent =
  | { type: "NotificationRequested"; data: NotificationRequestedData }
  | { type: "RenderedContentStored"; data: RenderedContentStoredData }
  | { type: "NotificationDispatched"; data: NotificationDispatchedData }
  | { type: "NotificationDelivered"; data: NotificationDeliveredData }
  | { type: "NotificationFailed"; data: NotificationFailedData };

export interface Event {
  metadata: EventMetadata;
  event: NotificationEvent;
}

export type EventsResponse = Record<string, Event>;
