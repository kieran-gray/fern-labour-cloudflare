export interface NotificationStatus {
  notification_id: string;
  user_id: string;
  status: string;
  updated_at: string;
}

export type RenderedContent =
  | { Email: { subject: string; html_body: string } }
  | { Sms: { body: string } }
  | { WhatsApp: { body: string } };

export interface NotificationDetail {
  notification_id: string;
  user_id: string;
  status: string;
  channel: string;
  destination: string;
  template: string;
  rendered_content: RenderedContent | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}
