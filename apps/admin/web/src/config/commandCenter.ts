export type FieldType =
  | "text"
  | "email"
  | "select"
  | "textarea"
  | "number"
  | "json";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  fields: FormField[];
  category?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  color: string;
  commands: Command[];
}

export const services: Service[] = [
  {
    id: "notification",
    name: "NOTIFICATION_SERVICE",
    description: "Dispatch notifications via email, SMS, and WhatsApp",
    color: "cp-orange",
    commands: [
      {
        id: "request_notification",
        name: "REQUEST_NOTIFICATION",
        description: "Send a notification through the complete pipeline.",
        endpoint: "/api/v1/notification",
        method: "POST",
        category: "DISPATCH",
        fields: [
          {
            name: "channel",
            label: "CHANNEL",
            type: "select",
            required: true,
            options: [
              { value: "EMAIL", label: "EMAIL" },
              { value: "SMS", label: "SMS" },
              { value: "WHATSAPP", label: "WHATSAPP" },
            ],
          },
          {
            name: "destination",
            label: "DESTINATION",
            type: "text",
            placeholder: "user@example.com or +1234567890",
            required: true,
          },
          {
            name: "template",
            label: "TEMPLATE",
            type: "select",
            required: true,
            options: [
              { value: "ContactUs", label: "CONTACT_US" },
              { value: "LabourUpdateData", label: "LABOUR_UPDATE" },
              { value: "LabourAnnouncementData", label: "LABOUR_ANNOUNCEMENT" },
              { value: "LabourBegunData", label: "LABOUR_BEGUN" },
              { value: "LabourCompletedData", label: "LABOUR_COMPLETED" },
              {
                value: "LabourCompletedWithNoteData",
                label: "LABOUR_COMPLETED_WITH_NOTE",
              },
              { value: "LabourInviteData", label: "LABOUR_INVITE" },
              { value: "SubscriberInviteData", label: "SUBSCRIBER_INVITE" },
              { value: "SubscriberRequestedData", label: "SUBSCRIBER_REQUESTED" },
              { value: "SubscriberApprovedData", label: "SUBSCRIBER_APPROVED" },
            ],
          },
          {
            name: "metadata",
            label: "METADATA",
            type: "json",
            placeholder: '{"key": "value"}',
            required: false,
          },
        ],
      },
      {
        id: "store_rendered_content",
        name: "STORE_RENDERED_CONTENT",
        description: "Manually store rendered content for a notification",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
          {
            name: "rendered_content",
            label: "RENDERED_CONTENT",
            type: "json",
            placeholder: '{"Email": {"subject": "...", "html_body": "..."}}',
            required: true,
            description: "Rendered content object (Email/Sms/WhatsApp format)",
          },
        ],
      },
      {
        id: "mark_as_dispatched",
        name: "MARK_AS_DISPATCHED",
        description: "Mark a notification as dispatched",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
          {
            name: "external_id",
            label: "EXTERNAL_ID",
            type: "text",
            placeholder: "provider-message-id-123",
            required: false,
            description: "External provider message ID",
          },
          {
            name: "sent_via_provider",
            label: "PROVIDER",
            type: "select",
            required: true,
            options: [
              { value: "twilio", label: "TWILIO" },
              { value: "resend", label: "RESEND" },
            ],
          },
        ],
      },
      {
        id: "mark_as_delivered",
        name: "MARK_AS_DELIVERED",
        description: "Mark a notification as successfully delivered",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
          {
            name: "provider",
            label: "PROVIDER",
            type: "select",
            required: true,
            options: [
              { value: "twilio", label: "TWILIO" },
              { value: "resend", label: "RESEND" },
            ],
          },
        ],
      },
      {
        id: "mark_as_failed",
        name: "MARK_AS_FAILED",
        description: "Mark a notification as failed with optional error reason",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
          {
            name: "reason",
            label: "FAILURE_REASON",
            type: "textarea",
            placeholder: "Delivery failed: Invalid email address",
            required: false,
            description: "Optional error reason",
          },
          {
            name: "provider",
            label: "PROVIDER",
            type: "select",
            required: true,
            options: [
              { value: "twilio", label: "TWILIO" },
              { value: "resend", label: "RESEND" },
            ],
          },
        ],
      },
      {
        id: "mark_content_redacted",
        name: "MARK_CONTENT_REDACTED",
        description:
          "Mark a notification as having its content successfully redacted",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
        ],
      },
      {
        id: "delete_notification",
        name: "DELETE_NOTIFICATION",
        description:
          "Marks a notification as deleted. It will be cleaned up via a weekly scheduled cron job.",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "INTERNAL_OPS",
        fields: [
          {
            name: "notification_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "UUID of the notification",
          },
        ],
      },
      {
        id: "rebuild_read_models",
        name: "REBUILD_READ_MODELS",
        description:
          "Rebuild all read model projections for a specific notification",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "MAINTENANCE",
        fields: [
          {
            name: "aggregate_id",
            label: "NOTIFICATION_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "Notification aggregate ID (UUID)",
          },
        ],
      },
      {
        id: "rebuild_activity",
        name: "REBUILD_ANALYTICS",
        description: "Rebuild notification activity analytics from scratch",
        endpoint: "/api/v1/admin/rebuild-activity",
        method: "POST",
        category: "MAINTENANCE",
        fields: [],
      },
      {
        id: "delete_durable_object",
        name: "DELETE_DURABLE_OBJECT",
        description: "Delete a Durable Object by its aggregate ID",
        endpoint: "/api/v1/admin/command",
        method: "POST",
        category: "MAINTENANCE",
        fields: [
          {
            name: "aggregate_id",
            label: "AGGREGATE_ID",
            type: "text",
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            required: true,
            description: "Aggregate ID (UUID) of the Durable Object",
          },
        ],
      },
    ],
  },
  {
    id: "contact",
    name: "CONTACT_SERVICE",
    description: "Manage contact form submissions",
    color: "cp-blue",
    commands: [],
  },
];

export const TEMPLATE_SCHEMAS: Record<string, Record<string, string>> = {
  ContactUs: {
    name: "string",
  },
  LabourUpdateData: {
    birthing_person_name: "string",
    subscriber_first_name: "string",
    update: "string",
    link: "string",
    notes: "string (optional)",
  },
  LabourAnnouncementData: {
    birthing_person_name: "string",
    birthing_person_first_name: "string",
    subscriber_first_name: "string",
    announcement: "string",
    link: "string",
  },
  LabourBegunData: {
    birthing_person_name: "string",
    birthing_person_first_name: "string",
    subscriber_first_name: "string",
    link: "string",
  },
  LabourCompletedData: {
    birthing_person_name: "string",
    birthing_person_first_name: "string",
    subscriber_first_name: "string",
    link: "string",
  },
  LabourCompletedWithNoteData: {
    birthing_person_name: "string",
    birthing_person_first_name: "string",
    subscriber_first_name: "string",
    update: "string",
    link: "string",
  },
  LabourInviteData: {
    birthing_person_name: "string",
    birthing_person_first_name: "string",
    link: "string",
  },
  SubscriberInviteData: {
    subscriber_name: "string",
    link: "string",
  },
  SubscriberRequestedData: {
    birthing_person_first_name: "string",
    subscriber_name: "string",
    link: "string",
  },
  SubscriberApprovedData: {
    subscriber_first_name: "string",
    birthing_person_name: "string",
    link: "string",
  },
};

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function getCommandById(
  serviceId: string,
  commandId: string,
): Command | undefined {
  const service = getServiceById(serviceId);
  return service?.commands.find((c) => c.id === commandId);
}
