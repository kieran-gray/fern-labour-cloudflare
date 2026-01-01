import { useState } from "react";
import {
  Clock,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  FileCode,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event, EventsResponse } from "./EventTypes";

interface EventTimelineProps {
  notificationId: string;
}

export const EventTimeline = ({ notificationId }: EventTimelineProps) => {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/notification/events/${notificationId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification events");
      }

      const data: EventsResponse = await response.json();

      const eventsArray = Object.values(data).sort(
        (a, b) => a.metadata.sequence - b.metadata.sequence,
      );

      setEvents(eventsArray);
    } catch (err) {
      console.error("Error fetching notification events:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getEventInfo = (event: Event) => {
    const { type, data } = event.event;

    switch (type) {
      case "NotificationRequested":
        return {
          label: "NOTIFICATION_REQUESTED",
          code: "REQ",
          icon: <FileText className="size-5" />,
          color: "text-cp-orange",
          bgColor: "bg-cp-orange",
          borderColor: "border-cp-orange",
          details: [
            { label: "CHANNEL", value: data.channel.toUpperCase() },
            {
              label: "DESTINATION",
              value: `${data.destination.type.toUpperCase()}: ${data.destination.value}`,
            },
            { label: "TEMPLATE", value: data.template_data.type.toUpperCase() },
          ],
        };

      case "RenderedContentStored": {
        const contentType =
          Object.keys(data.rendered_content)[0] || "Unknown";
        return {
          label: "CONTENT_RENDERED",
          code: "RND",
          icon: <FileCode className="size-5" />,
          color: "text-cp-gray",
          bgColor: "bg-cp-gray",
          borderColor: "border-cp-gray",
          details: [{ label: "CONTENT_TYPE", value: contentType.toUpperCase() }],
        };
      }

      case "NotificationDispatched":
        return {
          label: "NOTIFICATION_DISPATCHED",
          code: "DSP",
          icon: <Send className="size-5" />,
          color: "text-cp-blue",
          bgColor: "bg-cp-blue",
          borderColor: "border-cp-blue",
          details: [{ label: "EXTERNAL_ID", value: data.external_id }],
        };

      case "NotificationDelivered":
        return {
          label: "NOTIFICATION_DELIVERED",
          code: "DEL",
          icon: <CheckCircle2 className="size-5" />,
          color: "text-cp-green",
          bgColor: "bg-cp-green",
          borderColor: "border-cp-green",
          details: [],
        };

      case "NotificationFailed":
        return {
          label: "NOTIFICATION_FAILED",
          code: "ERR",
          icon: <XCircle className="size-5" />,
          color: "text-red-600",
          bgColor: "bg-red-600",
          borderColor: "border-red-600",
          details: [{ label: "ERROR", value: data.error }],
        };

      default:
        return {
          label: "UNKNOWN_EVENT",
          code: "UNK",
          icon: <Activity className="size-5" />,
          color: "text-cp-charcoal",
          bgColor: "bg-cp-charcoal",
          borderColor: "border-cp-charcoal",
          details: [],
        };
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {!loading && (
        <div className="flex justify-center">
          <Button
            onClick={fetchEvents}
            className="gap-2 border-2 border-cp-black bg-cp-orange text-cp-paper hover:bg-[#ff7722] shadow-hard-sm font-mono font-bold uppercase text-sm px-6 py-3 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {events ? (
              <>
                <RefreshCw className="size-4" />
                Refresh Events
              </>
            ) : (
              <>
                <Activity className="size-4" />
                Load Event History
              </>
            )}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="text-center border-2 border-dashed border-cp-black bg-cp-paper p-6">
            <div className="mx-auto mb-3 size-8 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
            <p className="text-xs text-cp-charcoal uppercase tracking-wider">
              {events ? "REFRESHING_EVENT_LOG..." : "LOADING_EVENT_LOG..."}
            </p>
            <p className="text-xs text-cp-gray mt-1">
              &gt; ACCESSING_AGGREGATE_STREAM
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-600 bg-cp-paper p-4 shadow-hard">
          <p className="text-xs text-red-600 font-bold">[ERROR] {error}</p>
        </div>
      )}

      {events && events.length === 0 && (
        <div className="border-2 border-dashed border-cp-black bg-cp-paper p-8 text-center">
          <Activity className="mx-auto mb-3 size-10 text-cp-gray" />
          <p className="text-xs text-cp-charcoal font-bold uppercase tracking-wider">
            NO_EVENTS_FOUND
          </p>
          <p className="text-xs text-cp-gray mt-1">
            &gt; Event stream is empty
          </p>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event, index) => {
            const eventInfo = getEventInfo(event);
            return (
              <div key={index} className="border-2 border-cp-black bg-cp-beige">
                {/* Event header bar */}
                <div className="border-b-2 border-cp-black bg-cp-beige px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={eventInfo.color}>{eventInfo.icon}</span>
                      <span className={`text-xs font-bold ${eventInfo.color}`}>
                        {eventInfo.label}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-cp-gray font-bold">
                    #{String(event.metadata.sequence).padStart(3, "0")}
                  </span>
                </div>

                {/* Event body */}
                <div className="p-3 space-y-3">
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-cp-gray">
                    <Clock className="size-3" />
                    <span>{formatDateTime(event.metadata.timestamp)}</span>
                  </div>

                  {/* Event details */}
                  {eventInfo.details.length > 0 && (
                    <div className="space-y-2">
                      {eventInfo.details.map((detail, detailIndex) => (
                        <div
                          key={detailIndex}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span className="text-cp-gray font-bold uppercase min-w-[100px]">
                            {detail.label}:
                          </span>
                          <span className="text-cp-charcoal break-all flex-1">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User ID */}
                  <div className="text-xs text-cp-gray pt-2 border-t border-cp-black/20">
                    USER: {event.metadata.user_id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
