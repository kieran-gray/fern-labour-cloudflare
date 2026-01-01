import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Mail,
  Bug,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { ContactMessage } from "./ContactMessage";

interface ContactMessageCardProps {
  message: ContactMessage;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

function getCategoryInfo(category: string) {
  switch (category) {
    case "ERROR":
      return {
        label: "BUG_REPORT",
        variant: "destructive" as const,
        icon: <Bug className="size-4" />,
        color: "text-red-600",
        borderColor: "border-red-600",
        bgColor: "bg-red-600",
      };
    case "IDEA":
      return {
        label: "FEATURE_REQUEST",
        variant: "warning" as const,
        icon: <Lightbulb className="size-4" />,
        color: "text-cp-orange",
        borderColor: "border-cp-orange",
        bgColor: "bg-cp-orange",
      };
    case "TESTIMONIAL":
      return {
        label: "TESTIMONIAL",
        variant: "success" as const,
        icon: <Megaphone className="size-4" />,
        color: "text-cp-green",
        borderColor: "border-cp-green",
        bgColor: "bg-cp-green",
      };
    case "OTHER":
      return {
        label: "GENERAL_FEEDBACK",
        variant: "info" as const,
        icon: <MessageSquare className="size-4" />,
        color: "text-cp-blue",
        borderColor: "border-cp-blue",
        bgColor: "bg-cp-blue",
      };
    default:
      return {
        label: category,
        variant: "secondary" as const,
        icon: <MessageSquare className="size-4" />,
        color: "text-cp-gray",
        borderColor: "border-cp-gray",
        bgColor: "bg-cp-gray",
      };
  }
}

function formatDateTime(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { date: formattedDate, time: formattedTime };
}

export function ContactMessageCard({ message }: ContactMessageCardProps) {
  const categoryInfo = getCategoryInfo(message.category);
  const isTestimonial = message.category === "TESTIMONIAL";
  const rating = message.data?.rating ? parseInt(message.data.rating) : null;
  const hasConsent = message.data?.consent === "true";
  const { date, time } = formatDateTime(message.received_at);

  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />

      {/* Header Section with Category Badge */}
      <div className="bg-cp-beige border-b-2 border-cp-black px-6 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* From Info */}
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-cp-black">
              <AvatarFallback className="font-mono font-bold">
                {getInitials(message.name, message.email)}
              </AvatarFallback>
            </Avatar>
            <div className="font-mono">
              <p className="font-bold text-cp-black text-sm uppercase tracking-wider">
                {message.name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-cp-gray">
                <Mail className="size-3" />
                <span>{message.email}</span>
              </div>
            </div>
          </div>

          {/* Category Badge and Date */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Badge */}
            <div
              className={`flex items-center gap-2 border-2 ${categoryInfo.borderColor} px-2 py-1`}
            >
              <span className={categoryInfo.color}>{categoryInfo.icon}</span>
              <span
                className={`text-xs font-bold uppercase tracking-wider font-mono ${categoryInfo.color}`}
              >
                {categoryInfo.label}
              </span>
            </div>

            {/* Date/Time */}
            <div className="text-right text-xs text-cp-gray font-mono">
              <p className="font-bold">{date}</p>
              <div className="flex items-center justify-end gap-1">
                <Clock className="size-3" />
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Section */}
      <div className="px-6 py-5 font-mono">
        {/* Testimonial Rating Section */}
        {isTestimonial && rating !== null && (
          <div className="mb-5 border-2 border-dashed border-cp-black bg-cp-beige p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cp-gray">
                  &gt; RATING
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < rating
                          ? "fill-cp-orange text-cp-orange"
                          : "fill-cp-gray/30 text-cp-gray/30"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold text-cp-charcoal">
                    {rating} / 5
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cp-gray">
                  &gt; MARKETING_CONSENT
                </p>
                <div className="flex items-center gap-2">
                  {hasConsent ? (
                    <>
                      <CheckCircle2 className="size-5 text-cp-green" />
                      <span className="text-sm font-bold text-cp-green uppercase">
                        GRANTED
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-5 text-red-600" />
                      <span className="text-sm font-bold text-red-600 uppercase">
                        DENIED
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cp-gray">
            &gt; MESSAGE
          </p>
          <div className="border-2 border-cp-black bg-cp-beige p-4 text-xs leading-relaxed text-cp-charcoal whitespace-pre-wrap">
            {message.message}
          </div>
        </div>
      </div>
    </div>
  );
}
