import {
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  FileText,
  FileCode,
} from "lucide-react";
import { Button } from "../ui/button";
import type { NotificationStatus } from "./NotificationTypes";

interface NotificationCardProps {
  notification: NotificationStatus;
  onViewDetail: (notificationId: string) => void;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "DELIVERED":
      return {
        label: "DELIVERED",
        icon: <CheckCircle2 className="size-4" />,
        color: "text-cp-green",
        borderColor: "border-cp-green",
        bgColor: "bg-cp-green",
      };
    case "SENT":
      return {
        label: "SENT",
        icon: <Send className="size-4" />,
        color: "text-cp-blue",
        borderColor: "border-cp-blue",
        bgColor: "bg-cp-blue",
      };
    case "RENDERED":
      return {
        label: "RENDERED",
        icon: <FileCode className="size-4" />,
        color: "text-cp-gray",
        borderColor: "border-cp-gray",
        bgColor: "bg-cp-gray",
      };
    case "FAILED":
      return {
        label: "FAILED",
        icon: <XCircle className="size-4" />,
        color: "text-red-600",
        borderColor: "border-red-600",
        bgColor: "bg-red-600",
      };
    case "REQUESTED":
      return {
        label: "REQUESTED",
        icon: <FileText className="size-4" />,
        color: "text-cp-orange",
        borderColor: "border-cp-orange",
        bgColor: "bg-cp-orange",
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

export function NotificationCard({
  notification,
  onViewDetail,
}: NotificationCardProps) {
  const statusInfo = getStatusInfo(notification.status);
  const { date, time } = formatDateTime(notification.updated_at);

  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />

      {/* Header Strip */}
      <div className="bg-cp-beige border-b-2 border-cp-black px-4 py-2 flex justify-between items-center">
        <h3 className="font-mono font-bold uppercase tracking-widest text-cp-black text-xs">
          NOTIFICATION /// {statusInfo.label}
        </h3>
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${statusInfo.bgColor}`} />
          <div className="w-2 h-2 border border-cp-black" />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 font-mono">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Notification Info */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; ID:
              </span>
            </div>
            <p className="text-xs text-cp-charcoal break-all border-l-2 border-cp-black pl-2">
              {notification.notification_id}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-cp-gray uppercase">&gt; USER:</span>
              <span className="text-xs text-cp-charcoal font-bold">
                {notification.user_id}
              </span>
            </div>
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

        {/* Actions Section */}
        <div className="flex justify-end mt-4 pt-4 border-t-2 border-dashed border-cp-black">
          <Button
            onClick={() => onViewDetail(notification.notification_id)}
            className="font-mono font-bold uppercase text-xs px-4 py-2 border-2 border-cp-black bg-cp-beige text-cp-charcoal shadow-hard-sm hover:bg-cp-paper transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            [VIEW_DETAILS]
          </Button>
        </div>
      </div>
    </div>
  );
}
