import {
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserMinus,
  ShieldOff,
} from "lucide-react";
import type { SubscriptionStatus } from "./SubscriptionTypes";

function getStatusInfo(status: string) {
  switch (status) {
    case "SUBSCRIBED":
      return {
        label: "SUBSCRIBED",
        icon: <CheckCircle2 className="size-4" />,
        color: "text-cp-green",
        borderColor: "border-cp-green",
        bgColor: "bg-cp-green",
      };
    case "REQUESTED":
      return {
        label: "REQUESTED",
        icon: <UserPlus className="size-4" />,
        color: "text-cp-orange",
        borderColor: "border-cp-orange",
        bgColor: "bg-cp-orange",
      };
    case "UNSUBSCRIBED":
      return {
        label: "UNSUBSCRIBED",
        icon: <UserMinus className="size-4" />,
        color: "text-cp-gray",
        borderColor: "border-cp-gray",
        bgColor: "bg-cp-gray",
      };
    case "REMOVED":
      return {
        label: "REMOVED",
        icon: <XCircle className="size-4" />,
        color: "text-red-600",
        borderColor: "border-red-600",
        bgColor: "bg-red-600",
      };
    case "BLOCKED":
      return {
        label: "BLOCKED",
        icon: <ShieldOff className="size-4" />,
        color: "text-red-700",
        borderColor: "border-red-700",
        bgColor: "bg-red-700",
      };
    default:
      return {
        label: status,
        icon: <Clock className="size-4" />,
        color: "text-cp-charcoal",
        borderColor: "border-cp-charcoal",
        bgColor: "bg-cp-charcoal",
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

export function SubscriptionCard({
  subscription,
}: {
  subscription: SubscriptionStatus;
}) {
  const statusInfo = getStatusInfo(subscription.status);
  const { date, time } = formatDateTime(subscription.updated_at);

  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />

      {/* Header Strip */}
      <div className="bg-cp-beige border-b-2 border-cp-black px-4 py-2 flex justify-between items-center">
        <h3 className="font-mono font-bold uppercase tracking-widest text-cp-black text-xs">
          SUBSCRIPTION /// {statusInfo.label}
        </h3>
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${statusInfo.bgColor}`} />
          <div className="w-2 h-2 border border-cp-black" />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 font-mono">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Subscription Info */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; SUBSCRIBER:
              </span>
              <span className="text-xs text-cp-charcoal font-bold">
                {subscription.subscriber_id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; LABOUR_ID:
              </span>
              <span className="text-xs text-cp-charcoal font-bold break-all">
                {subscription.labour_id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; ID:
              </span>
            </div>
            <p className="text-xs text-cp-charcoal break-all border-l-2 border-cp-black pl-2">
              {subscription.subscription_id}
            </p>
          </div>

          {/* Status Badge and Date */}
          <div className="flex flex-row md:flex-col gap-2 justify-between md:items-end">
            {/* Status Badge */}
            <div
              className={`flex items-center gap-2 border-2 ${statusInfo.borderColor} px-2 py-1`}
            >
              <span className={statusInfo.color}>{statusInfo.icon}</span>
              <span
                className={`text-xs font-bold ${statusInfo.color} uppercase tracking-wider`}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* Date/Time */}
            <div className="text-right text-xs text-cp-gray">
              <p className="font-bold">{date}</p>
              <div className="flex items-center justify-end gap-1">
                <Clock className="size-3" />
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
