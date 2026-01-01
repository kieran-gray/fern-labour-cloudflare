import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "../ui/ConfirmModal";

interface NotificationCommandFormProps {
  onSuccess?: () => void;
}

type Channel = "email" | "sms" | "whatsapp";
type Template = "ContactUs" | "HelloWorld";

interface FormData {
  channel: Channel;
  destination: string;
  template: Template;
  name: string;
  isHighPriority: boolean;
}

export function NotificationCommandForm({
  onSuccess,
}: NotificationCommandFormProps) {
  const [formData, setFormData] = useState<FormData>({
    channel: "email",
    destination: "",
    template: "HelloWorld",
    name: "",
    isHighPriority: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        channel: formData.channel,
        destination: formData.destination,
        template_data: {
          type: formData.template,
          name: formData.name,
        },
        ...(formData.isHighPriority && { priority: "high" }),
        metadata: null,
      };

      const response = await fetch("/api/v1/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send notification command: ${response.status} ${errorText}`,
        );
      }

      setSuccess(
        `Notification command sent successfully! Status: ${response.status}`,
      );

      setFormData({
        channel: "email",
        destination: "",
        template: "HelloWorld",
        name: "",
        isHighPriority: false,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error sending notification command:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (formData.channel) {
      case "email":
        return "user@example.com";
      case "sms":
        return "+1234567890";
      case "whatsapp":
        return "+1234567890";
      default:
        return "";
    }
  };

  const getConfirmDescription = () => {
    return `You are about to send a ${
      formData.isHighPriority ? "HIGH PRIORITY" : ""
    } notification via ${formData.channel.toUpperCase()} to ${
      formData.destination
    } using the ${formData.template} template.`;
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-6 font-mono">
        {/* Channel Selection */}
        <div className="space-y-2">
          <Label
            htmlFor="channel"
            className="text-cp-gray font-bold uppercase text-xs tracking-wider"
          >
            &gt; CHANNEL *
          </Label>
          <select
            id="channel"
            value={formData.channel}
            onChange={(e) =>
              setFormData({ ...formData, channel: e.target.value as Channel })
            }
            className="w-full border-2 border-cp-black bg-cp-beige px-3 py-2 text-xs text-cp-charcoal uppercase font-bold focus:border-cp-orange focus:outline-none focus:ring-2 focus:ring-cp-orange/20"
            required
          >
            <option value="email">EMAIL</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WHATSAPP</option>
          </select>
        </div>

        {/* Destination Input */}
        <div className="space-y-2">
          <Label
            htmlFor="destination"
            className="text-cp-gray font-bold uppercase text-xs tracking-wider"
          >
            &gt; DESTINATION *
          </Label>
          <input
            id="destination"
            type="text"
            value={formData.destination}
            onChange={(e) =>
              setFormData({ ...formData, destination: e.target.value })
            }
            placeholder={getPlaceholder()}
            className="w-full border-2 border-cp-black bg-cp-beige px-3 py-2 text-xs text-cp-charcoal placeholder:text-cp-gray focus:border-cp-orange focus:outline-none focus:ring-2 focus:ring-cp-orange/20"
            required
          />
          <p className="text-xs text-cp-gray">
            {formData.channel === "email"
              ? "> Email address where the notification will be sent"
              : "> Phone number in international format (e.g., +1234567890)"}
          </p>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label
            htmlFor="template"
            className="text-cp-gray font-bold uppercase text-xs tracking-wider"
          >
            &gt; TEMPLATE *
          </Label>
          <select
            id="template"
            value={formData.template}
            onChange={(e) =>
              setFormData({ ...formData, template: e.target.value as Template })
            }
            className="w-full border-2 border-cp-black bg-cp-beige px-3 py-2 text-xs text-cp-charcoal uppercase font-bold focus:border-cp-orange focus:outline-none focus:ring-2 focus:ring-cp-orange/20"
            required
          >
            <option value="HelloWorld">HELLO_WORLD</option>
            <option value="ContactUs">CONTACT_US</option>
          </select>
        </div>

        {/* Template Data - Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-cp-gray font-bold uppercase text-xs tracking-wider"
          >
            &gt; NAME *
          </Label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter name for template"
            className="w-full border-2 border-cp-black bg-cp-beige px-3 py-2 text-xs text-cp-charcoal placeholder:text-cp-gray focus:border-cp-orange focus:outline-none focus:ring-2 focus:ring-cp-orange/20"
            required
          />
          <p className="text-xs text-cp-gray">
            &gt; Name that will be used in the notification template
          </p>
        </div>

        {/* Priority Checkbox */}
        <div className="flex items-start space-x-3 border-2 border-dashed border-cp-black p-3 bg-cp-beige">
          <input
            id="priority"
            type="checkbox"
            checked={formData.isHighPriority}
            onChange={(e) =>
              setFormData({ ...formData, isHighPriority: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 border-2 border-cp-black text-cp-orange focus:ring-2 focus:ring-cp-orange/20"
          />
          <div className="space-y-1">
            <Label
              htmlFor="priority"
              className="text-cp-charcoal font-bold uppercase text-xs tracking-wider"
            >
              HIGH_PRIORITY
            </Label>
            <p className="text-xs text-cp-gray">
              &gt; Mark as high priority for faster processing
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-2 border-red-600 bg-cp-paper px-4 py-3 shadow-hard">
            <p className="text-xs text-red-600 font-bold">[ERROR] {error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="border-2 border-cp-green bg-cp-paper px-4 py-3 shadow-hard">
            <p className="text-xs text-cp-green font-bold">
              [SUCCESS] {success}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-mono font-bold uppercase text-sm px-6 py-3 border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard transition-all hover:bg-[#ff7722] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          <Send className="size-5" />
          {isSubmitting ? "SENDING..." : "SEND_NOTIFICATION"}
        </Button>
      </form>

      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmedSubmit}
        title="SEND NOTIFICATION"
        description={getConfirmDescription()}
        confirmText="SEND"
        cancelText="CANCEL"
        variant="warning"
      />
    </>
  );
}
