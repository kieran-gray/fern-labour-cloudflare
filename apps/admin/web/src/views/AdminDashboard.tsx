import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import type { ContactMessage } from "@/components/contact_message/ContactMessage";
import type { NotificationStatus } from "@/components/notification/NotificationTypes";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";
import { Bell, Mail } from "lucide-react";
import { generateAsciiArtText } from "@/components/AsciiArt";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

const LAST_VISIT_KEY = "admin_last_visit";

interface AdminDashboardProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [notifications, setNotifications] = useState<NotificationStatus[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [asciiMaxWidth, setAsciiMaxWidth] = useState(15);
  const [headerText, setHeaderText] = useState("FERN LABOUR ADMIN");
  const [displayedLetters, setDisplayedLetters] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingNotificationCount, setLoadingNotificationCount] = useState(0);
  const [loadingMessageCount, setLoadingMessageCount] = useState(0);

  useEffect(() => {
    if (displayedLetters < headerText.length) {
      const timer = setTimeout(() => {
        setDisplayedLetters((prev) => prev + 1);
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [displayedLetters, headerText.length]);

  useEffect(() => {
    setDisplayedLetters(0);
  }, [headerText]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingNotificationCount(Math.floor(Math.random() * 1000));
        setLoadingMessageCount(Math.floor(Math.random() * 1000));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    const calculateMaxWidth = () => {
      const width = window.innerWidth;

      setIsMobile(width < 768);

      if (width < 640) {
        setAsciiMaxWidth(5);
      } else if (width < 768) {
        setAsciiMaxWidth(6);
      } else if (width < 1024) {
        setAsciiMaxWidth(8);
      } else {
        setAsciiMaxWidth(16);
      }
    };

    calculateMaxWidth();

    window.addEventListener("resize", calculateMaxWidth);
    return () => window.removeEventListener("resize", calculateMaxWidth);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const lastVisitTime = lastVisit ? new Date(lastVisit) : new Date(0);

        const [notificationsRes, messagesRes] = await Promise.all([
          fetch("/api/v1/notifications?limit=100"),
          fetch("/api/v1/contact-messages/"),
        ]);

        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          const allNotifications = notificationsData.data || [];
          setNotifications(allNotifications);

          const newCount = allNotifications.filter(
            (n: NotificationStatus) => new Date(n.updated_at) > lastVisitTime,
          ).length;
          setNewNotificationsCount(newCount);
        }

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData);

          const newCount = messagesData.filter(
            (m: ContactMessage) => new Date(m.received_at) > lastVisitTime,
          ).length;
          setNewMessagesCount(newCount);
        }

        localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 pb-20 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          {/* ASCII Art Title Space */}
          <div className="mb-12 border-4 border-double border-cp-black bg-cp-paper p-4 sm:p-8 shadow-hard max-w-full">
            <div className="flex items-center justify-center max-w-full overflow-hidden">
              <div className="font-mono text-cp-black dark:text-cp-charcoal leading-none tracking-normal whitespace-pre text-xs sm:text-sm max-w-full overflow-x-auto overflow-y-clip relative">
                {generateAsciiArtText(headerText.slice(0, displayedLetters), {
                  maxWidth: asciiMaxWidth,
                  mobile: isMobile,
                  lineSpacing: 0.5,
                })}
              </div>
            </div>
            <div className="mt-4 border-t-2 border-cp-black pt-4 text-center">
              <p className="font-mono text-xs sm:text-sm text-cp-gray uppercase tracking-widest">
                // ADMINISTRATIVE CONTROL PANEL //
              </p>
            </div>
          </div>

          {/* System Status */}
          <PageHeader
            title="SYSTEM"
            highlightedTitle=".STATUS"
            subtitle=":: UPDATES_SINCE_LAST_LOGIN ::"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusCard
              title="CONTACT_MESSAGES"
              icon={Mail}
              newCount={newMessagesCount}
              totalCount={messages.length}
              loading={loading}
              loadingCount={loadingMessageCount}
              asciiMaxWidth={asciiMaxWidth}
              isMobile={isMobile}
            />

            <StatusCard
              title="NOTIFICATIONS"
              icon={Bell}
              newCount={newNotificationsCount}
              totalCount={notifications.length}
              loading={loading}
              loadingCount={loadingNotificationCount}
              asciiMaxWidth={asciiMaxWidth}
              isMobile={isMobile}
            />
          </div>

          {/* System Info Footer */}
          <div className="mt-8 border-2 border-cp-black bg-cp-paper p-4 shadow-hard">
            <div className="font-mono text-xs text-cp-gray space-y-1">
              <div className="flex justify-between">
                <span>&gt; SYSTEM_TIME:</span>
                <span className="text-cp-charcoal">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>&gt; OPERATOR:</span>
                <span className="text-cp-charcoal uppercase">
                  {user?.email || "UNKNOWN"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>&gt; ACCESS_LEVEL:</span>
                <span className="text-cp-green font-bold">ADMINISTRATOR</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
