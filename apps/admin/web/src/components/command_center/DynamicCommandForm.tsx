import { useState } from "react";
import { ArrowRight, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { type Command } from "@/config/commandCenter";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
            name: formData.name,
          },
          metadata: formData.metadata ? JSON.parse(formData.metadata) : null,
          priority: formData.priority || "Normal",
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

      if (command.id === "mark_as_dispatched") {
        return {
          type: "Internal",
          payload: {
            type: "MarkAsDispatched",
            payload: {
              notification_id: formData.notification_id,
              external_id: formData.external_id || null,
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
                    onChange={(e) => handleChange(field.name, e.target.value)}
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
            </div>
          ))
        )}

        {/* Submit Button */}
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
