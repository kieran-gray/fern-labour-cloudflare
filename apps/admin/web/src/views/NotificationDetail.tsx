import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  XCircle,
  FileText,
  Clock,
  Mail,
  Hash,
  User,
  Calendar,
  FileCode,
  Settings,
  ReceiptText,
} from "lucide-react";
import DOMPurify from "dompurify";
import { Sidebar } from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventTimeline } from "@/components/notification_event_timeline/EventTimeline";
import type {
  NotificationDetail,
  RenderedContent,
} from "@/components/notification/NotificationTypes";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface NotificationDetailViewProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const NotificationDetailView = ({
  user,
  onLogout,
}: NotificationDetailViewProps) => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!user || !notificationId) return;

    const fetchNotificationDetail = async () => {
      try {
        const response = await fetch(`/api/v1/notification/${notificationId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch notification details");
        }

        const data = await response.json();
        setNotification(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching notification details:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setNotification(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationDetail();
  }, [user, notificationId]);

  const handleRebuildReadModels = async () => {
    if (!notificationId) return;

    setAdminActionLoading(true);
    setAdminActionSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Admin",
          payload: {
            type: "RebuildReadModels",
            payload: {
              aggregate_id: notificationId,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to rebuild read models");
      }

      setAdminActionSuccess("Read models rebuilt successfully");
      setTimeout(() => setAdminActionSuccess(null), 3000);
    } catch (err) {
      console.error("Error rebuilding read models:", err);
      setError(
        err instanceof Error ? err.message : "Failed to rebuild read models",
      );
    } finally {
      setAdminActionLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return {
          label: "DELIVERED",
          icon: <CheckCircle2 className="size-5" />,
          color: "text-cp-green",
          bgColor: "bg-cp-green",
        };
      case "SENT":
        return {
          label: "SENT",
          icon: <Send className="size-5" />,
          color: "text-cp-blue",
          bgColor: "bg-cp-blue",
        };
      case "RENDERED":
        return {
          label: "RENDERED",
          icon: <FileCode className="size-5" />,
          color: "text-cp-gray",
          bgColor: "bg-cp-gray",
        };
      case "FAILED":
        return {
          label: "FAILED",
          icon: <XCircle className="size-5" />,
          color: "text-red-600",
          bgColor: "bg-red-600",
        };
      case "REQUESTED":
        return {
          label: "REQUESTED",
          icon: <FileText className="size-5" />,
          color: "text-cp-orange",
          bgColor: "bg-cp-orange",
        };
      default:
        return {
          label: status,
          icon: <Clock className="size-5" />,
          color: "text-cp-charcoal",
          bgColor: "bg-cp-charcoal",
        };
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
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

  const renderContent = (content: RenderedContent) => {
    if ("Email" in content) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
              &gt; SUBJECT
            </h3>
            <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2">
              {content.Email.subject}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
              &gt; HTML_BODY
            </h3>
            <div className="border-2 border-cp-black bg-white p-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(content.Email.html_body),
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if ("Sms" in content) {
      return (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
            &gt; MESSAGE
          </h3>
          <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2 whitespace-pre-wrap">
            {content.Sms.body}
          </p>
        </div>
      );
    }

    if ("WhatsApp" in content) {
      return (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
            &gt; MESSAGE
          </h3>
          <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2 whitespace-pre-wrap">
            {content.WhatsApp.body}
          </p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cp-beige scanlines">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
          <p className="text-lg text-cp-charcoal font-mono uppercase tracking-wider">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cp-beige scanlines">
        <div className="border-2 border-cp-black bg-cp-paper p-8 shadow-hard text-center max-w-md">
          <div className="border-b-2 border-cp-black pb-2 mb-4">
            <p className="font-mono font-bold uppercase tracking-widest text-cp-black text-sm">
              [!] ERROR
            </p>
          </div>
          <p className="text-sm text-cp-charcoal font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cp-beige scanlines">
        <div className="border-2 border-dashed border-cp-black bg-cp-paper p-8 shadow-hard text-center max-w-md">
          <p className="font-mono font-bold text-lg text-cp-black uppercase tracking-wider mb-2">
            NOTIFICATION_NOT_FOUND
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(notification.status);

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/notifications")}
              className="gap-2 text-cp-charcoal font-mono border-2 border-cp-black bg-cp-beige hover:bg-cp-paper uppercase text-xs font-bold shadow-hard-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <ArrowLeft className="size-4" />
              [BACK_TO_LIST]
            </Button>
          </div>

          {/* Header Section */}
          <div className="mb-6 flex items-start justify-between gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <PageHeader
                title="NOTIFICATION"
                highlightedTitle=".DETAIL"
                subtitle={`ID: ${notification.notification_id}`}
                icon={<ReceiptText className="size-8 text-cp-orange" />}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-2 border-cp-black bg-cp-beige hover:bg-cp-paper shadow-hard-sm font-mono uppercase text-xs font-bold text-cp-charcoal transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none"
                  disabled={adminActionLoading}
                >
                  <Settings className="size-4" />
                  [ADMIN_ACTIONS]
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 ml-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal font-mono"
              >
                <DropdownMenuItem
                  onClick={handleRebuildReadModels}
                  disabled={adminActionLoading}
                  className="cursor-pointer uppercase text-xs font-bold"
                >
                  {adminActionLoading ? "REBUILDING..." : "REBUILD_READ_MODELS"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Success Message */}
          {adminActionSuccess && (
            <div className="mb-6 border-2 border-cp-green bg-cp-paper p-4 shadow-hard">
              <p className="text-sm text-cp-green font-mono font-bold">
                [SUCCESS] {adminActionSuccess}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            {/* Status Card */}
            <SectionCard title="STATUS">
              <div
                className={`inline-flex items-center gap-3 border-2 border-cp-black ${statusInfo.bgColor}/10 px-4 py-3`}
              >
                <span className={statusInfo.color}>{statusInfo.icon}</span>
                <span
                  className={`text-lg font-bold uppercase tracking-wider font-mono ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
            </SectionCard>

            {/* Basic Information */}
            <SectionCard title="BASIC_INFORMATION">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 font-mono">
                <div className="flex items-start gap-3">
                  <User className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; USER_ID
                    </dt>
                    <dd className="text-xs text-cp-charcoal border-l-2 border-cp-black pl-2">
                      {notification.user_id}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; CHANNEL
                    </dt>
                    <dd className="text-xs text-cp-charcoal border-l-2 border-cp-black pl-2 uppercase">
                      {notification.channel}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Send className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; DESTINATION
                    </dt>
                    <dd className="text-xs text-cp-charcoal border-l-2 border-cp-black pl-2">
                      {notification.destination}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; TEMPLATE
                    </dt>
                    <dd className="text-xs text-cp-charcoal border-l-2 border-cp-black pl-2">
                      {notification.template}
                    </dd>
                  </div>
                </div>

                {notification.external_id && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <Hash className="size-5 text-cp-orange mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                        &gt; EXTERNAL_ID
                      </dt>
                      <dd className="text-xs text-cp-charcoal border-l-2 border-cp-black pl-2">
                        {notification.external_id}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </SectionCard>

            {/* Timeline */}
            <SectionCard title="TIMELINE">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 font-mono">
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; CREATED_AT
                    </dt>
                    <dd className="text-xs text-cp-charcoal">
                      {formatDateTime(notification.created_at)}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-cp-orange mt-0.5" />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                      &gt; UPDATED_AT
                    </dt>
                    <dd className="text-xs text-cp-charcoal">
                      {formatDateTime(notification.updated_at)}
                    </dd>
                  </div>
                </div>

                {notification.dispatched_at && (
                  <div className="flex items-start gap-3">
                    <Send className="size-5 text-cp-blue mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                        &gt; DISPATCHED_AT
                      </dt>
                      <dd className="text-xs text-cp-charcoal">
                        {formatDateTime(notification.dispatched_at)}
                      </dd>
                    </div>
                  </div>
                )}

                {notification.delivered_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-cp-green mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                        &gt; DELIVERED_AT
                      </dt>
                      <dd className="text-xs text-cp-charcoal">
                        {formatDateTime(notification.delivered_at)}
                      </dd>
                    </div>
                  </div>
                )}

                {notification.failed_at && (
                  <div className="flex items-start gap-3">
                    <XCircle className="size-5 text-red-600 mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-1">
                        &gt; FAILED_AT
                      </dt>
                      <dd className="text-xs text-cp-charcoal">
                        {formatDateTime(notification.failed_at)}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              {/* Horizontal separator */}
              <div className="my-6 border-t-2 border-dashed border-cp-black"></div>

              {/* Event Timeline */}
              <div>
                <h3 className="font-mono font-bold text-sm text-cp-black uppercase tracking-wider mb-4">
                  EVENT_HISTORY &gt;
                </h3>
                <EventTimeline notificationId={notification.notification_id} />
              </div>
            </SectionCard>

            {/* Rendered Content */}
            {notification.rendered_content && (
              <SectionCard title="RENDERED_CONTENT">
                <div className="font-mono">
                  {renderContent(notification.rendered_content)}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationDetailView;
