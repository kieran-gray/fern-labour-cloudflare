import { useState } from "react";
import {
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Eye,
} from "lucide-react";
import { type Command, TEMPLATE_SCHEMAS } from "@/config/commandCenter";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { NotificationContentRenderer } from "@/components/notification/NotificationContentRenderer";
import type { RenderedContent } from "@/components/notification/NotificationTypes";

interface DynamicCommandFormProps {
  command: Command;
  serviceName: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export function DynamicCommandForm({
  command,
  serviceName,
  onBack,
  onSuccess,
}: DynamicCommandFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<RenderedContent | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const buildRequestPayload = () => {
    if (serviceName === "NOTIFICATION_SERVICE") {
      if (command.id === "request_notification") {
        return {
          channel: formData.channel,
          destination: formData.destination,
          template_data: {
            type: formData.template,
            ...templateData,
          },
          metadata: formData.metadata ? JSON.parse(formData.metadata) : null,
          scheduled_at: formData.scheduled_at || null,
        };
      }

      if (command.id === "delete_durable_object") {
        return {
          type: "Admin",
          payload: {
            type: "DeleteDurableObject",
            payload: {
              aggregate_id: formData.aggregate_id,
            },
          },
        };
      }

      if (command.id === "rebuild_read_models") {
        return {
          type: "Admin",
          payload: {
            type: "RebuildReadModels",
            payload: {
              aggregate_id: formData.aggregate_id,
            },
          },
        };
      }

      if (command.id === "store_rendered_content") {
        return {
          type: "Internal",
          payload: {
            type: "StoreRenderedContent",
            payload: {
              notification_id: formData.notification_id,
              rendered_content: JSON.parse(formData.rendered_content),
            },
          },
        };
      }

      if (command.id === "mark_as_scheduled") {
        return {
          type: "Internal",
          payload: {
            type: "MarkAsScheduled",
            payload: {
              notification_id: formData.notification_id,
              external_id: formData.external_id || null,
              provider: formData.provider,
            },
          },
        };
      }

      if (command.id === "mark_as_dispatched") {
        return {
          type: "Internal",
          payload: {
            type: "MarkAsDispatched",
            payload: {
              notification_id: formData.notification_id,
              external_id: formData.external_id || null,
              sent_via_provider: formData.sent_via_provider,
            },
          },
        };
      }

      if (command.id === "mark_as_delivered") {
        return {
          type: "Internal",
          payload: {
            type: "MarkAsDelivered",
            payload: {
              notification_id: formData.notification_id,
              provider: formData.provider,
            },
          },
        };
      }

      if (command.id === "mark_as_failed") {
        return {
          type: "Internal",
          payload: {
            type: "MarkAsFailed",
            payload: {
              notification_id: formData.notification_id,
              reason: formData.reason || null,
              provider: formData.provider,
            },
          },
        };
      }
    }

    return formData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      for (const field of command.fields) {
        if (field.type === "json" && formData[field.name]) {
          try {
            JSON.parse(formData[field.name]);
          } catch {
            throw new Error(`Invalid JSON in ${field.label}`);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation error");
      return;
    }

    setShowConfirmModal(true);
  };

  const handlePreview = async () => {
    if (!formData.template || !formData.channel) {
      setPreviewError("Please select a channel and template first");
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent(null);

    try {
      const payload = {
        notification_id: crypto.randomUUID(),
        channel: formData.channel,
        template_data: {
          type: formData.template,
          ...templateData,
        },
      };

      const response = await fetch("/api/v1/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Template not supported for this channel");
      }

      const data = await response.json();
      const content: RenderedContent = data.rendered_content;

      setPreviewContent(content);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const getConfirmationMessage = () => {
    return `You are about to execute ${command.name} on ${serviceName}. This action will be processed immediately. Are you sure you want to continue?`;
  };

  const executeCommand = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = buildRequestPayload();

      const response = await fetch(command.endpoint, {
        method: command.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to execute command`);
      }

      setSuccess(true);
      setFormData({});
      setTemplateData({});

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-2 px-4 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal hover:text-cp-black font-mono text-xs uppercase font-bold shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
      >
        <ArrowRight className="size-3 rotate-180" />
        [BACK_TO_COMMANDS]
      </button>

      {/* Command Info */}
      <div className="border-2 border-cp-blue bg-cp-paper px-4 py-3 shadow-hard">
        <div className="flex items-start gap-3">
          <Send className="size-5 text-cp-blue mt-0.5 shrink-0" />
          <div className="text-xs text-cp-charcoal font-mono">
            <p className="font-bold uppercase tracking-wider mb-2 text-cp-blue">
              &gt; EXECUTING: {command.name}
            </p>
            <p className="leading-relaxed">{command.description}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="border-2 border-cp-green bg-cp-paper p-4 shadow-hard">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-cp-green" />
            <p className="text-sm text-cp-green font-mono font-bold">
              [SUCCESS] Command executed successfully
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border-2 border-red-600 bg-cp-paper p-4 shadow-hard">
          <div className="flex items-center gap-3">
            <XCircle className="size-5 text-red-600" />
            <p className="text-sm text-red-600 font-mono font-bold">
              [ERROR] {error}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {command.fields.length === 0 ? (
          <div className="border-2 border-dashed border-cp-black bg-cp-beige p-6 text-center">
            <p className="text-xs text-cp-gray font-mono uppercase">
              This command requires no parameters
            </p>
          </div>
        ) : (
          command.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cp-gray font-mono">
                    &gt; {field.label}
                    {field.required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </span>
                  {field.description && (
                    <span className="text-xs text-cp-gray font-mono">
                      {field.description}
                    </span>
                  )}
                </div>

                {field.type === "select" ? (
                  <select
                    value={formData[field.name] || ""}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      handleChange(field.name, newValue);
                      if (field.name === "template") {
                        setTemplateData({});
                      }
                    }}
                    required={field.required}
                    className="w-full px-3 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cp-orange focus:border-cp-orange"
                  >
                    <option value="">-- SELECT --</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cp-orange focus:border-cp-orange resize-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cp-orange focus:border-cp-orange"
                  />
                )}
              </label>

              {/* Dynamic Template Fields */}
              {field.name === "template" &&
                formData.template &&
                TEMPLATE_SCHEMAS[formData.template] && (
                  <div className="mt-6 border-2 border-cp-black bg-cp-beige shadow-hard overflow-hidden">
                    {/* Header Bar */}
                    <div className="bg-cp-black px-3 py-1.5 flex items-center gap-2 text-cp-paper border-b-2 border-cp-black">
                      <Info className="size-3.5" />
                      <span className="text-xs font-bold font-mono uppercase tracking-widest">
                        TEMPLATE_DATA :: {formData.template.toUpperCase()}
                      </span>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="p-4 space-y-4">
                      {Object.entries(TEMPLATE_SCHEMAS[formData.template]).map(
                        ([key, typeDesc]) => (
                          <div key={key} className="space-y-1">
                            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-cp-charcoal">
                              &gt; {key.replace(/_/g, " ")}
                              {!typeDesc.includes("optional") && (
                                <span className="text-red-600 ml-1">*</span>
                              )}
                            </label>

                            {key === "notes" ||
                            key === "update" ||
                            key === "announcement" ? (
                              <textarea
                                value={templateData[key] || ""}
                                onChange={(e) =>
                                  setTemplateData((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter ${key}...`}
                                rows={3}
                                className="w-full px-3 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cp-blue focus:border-cp-blue resize-none shadow-sm"
                                required={!typeDesc.includes("optional")}
                              />
                            ) : (
                              <input
                                type="text"
                                value={templateData[key] || ""}
                                onChange={(e) =>
                                  setTemplateData((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter ${key}...`}
                                className="w-full px-3 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cp-blue focus:border-cp-blue shadow-sm"
                                required={!typeDesc.includes("optional")}
                              />
                            )}
                            <p className="text-[10px] text-cp-gray font-mono uppercase">
                              Type: {typeDesc}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))
        )}

        {/* Preview Section */}
        {command.id === "request_notification" && (
          <div className="pt-4 border-t-2 border-cp-black space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                disabled={previewLoading || loading}
                onClick={handlePreview}
                className="flex-1 font-mono font-bold uppercase text-sm px-6 py-3 border-2 border-cp-black bg-cp-blue text-cp-paper shadow-hard hover:bg-[#3366cc] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previewLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    GENERATING_PREVIEW...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Eye className="size-4" />
                    [PREVIEW_NOTIFICATION]
                  </span>
                )}
              </Button>

              <Button
                type="submit"
                disabled={loading || previewLoading}
                className="flex-1 font-mono font-bold uppercase text-sm px-6 py-3 border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard hover:bg-[#ff7722] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    EXECUTING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="size-4" />
                    [EXECUTE_COMMAND]
                  </span>
                )}
              </Button>
            </div>

            {/* Preview Results */}
            {previewContent && (
              <div className="border-2 border-cp-black bg-cp-paper shadow-hard overflow-hidden">
                <div className="bg-cp-black px-3 py-1.5 flex items-center justify-between text-cp-paper border-b-2 border-cp-black">
                  <div className="flex items-center gap-2">
                    <Eye className="size-3.5" />
                    <span className="text-xs font-bold font-mono uppercase tracking-widest">
                      PREVIEW_RESULT
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewContent(null)}
                    className="text-[10px] font-mono hover:text-cp-orange"
                  >
                    [CLOSE]
                  </button>
                </div>
                <div className="p-4 bg-paper max-h-[400px] overflow-auto">
                  <NotificationContentRenderer content={previewContent} />
                </div>
              </div>
            )}

            {previewError && (
              <div className="border-2 border-red-600 bg-red-50 p-3 shadow-hard">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="size-4" />
                  <span className="text-xs font-bold font-mono uppercase">
                    [PREVIEW_ERROR] {previewError}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Standard Submit Button (for non-request commands) */}
        {command.id !== "request_notification" && (
          <div className="pt-4 border-t-2 border-cp-black">
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-mono font-bold uppercase text-sm px-6 py-3 border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard hover:bg-[#ff7722] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  EXECUTING_COMMAND...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="size-4" />
                  [EXECUTE_COMMAND]
                </span>
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={executeCommand}
        title="CONFIRM_COMMAND_EXECUTION"
        description={getConfirmationMessage()}
        confirmText="EXECUTE"
        cancelText="CANCEL"
        variant="warning"
      />
    </div>
  );
}
