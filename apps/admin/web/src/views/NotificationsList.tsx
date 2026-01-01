import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BarChart3, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Sidebar } from "@/components/ui/Sidebar";
import { NotificationCard } from "@/components/notification/NotificationCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type {
  NotificationStatus,
  PaginatedResponse,
} from "@/components/notification/NotificationTypes";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface NotificationsListProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const NotificationsList = ({ user, onLogout }: NotificationsListProps) => {
  const [notifications, setNotifications] = useState<NotificationStatus[]>([]);
  const [activityData, setActivityData] = useState<
    Array<{ count: number; date: string }>
  >([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rebuildingActivity, setRebuildingActivity] = useState(false);
  const [error] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timescale, setTimescale] = useState<7 | 30 | 180>(7);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTheme = () => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setIsDarkMode(hasDarkClass);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const url = new URL("/api/v1/notifications", window.location.origin);
        url.searchParams.set("limit", "5");

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data: PaginatedResponse<NotificationStatus> =
          await response.json();
        setNotifications(data.data);
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchActivityData = async () => {
      try {
        const response = await fetch(
          `/api/v1/notifications/activity/${timescale}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notification activity");
        }

        const data: Array<{ count: number; date: string }> =
          await response.json();
        setActivityData(data);
      } catch (err) {
        console.error("Error fetching notification activity:", err);
        setActivityData([]);
      }
    };

    fetchActivityData();
  }, [user, timescale]);

  const chartData = useMemo(() => {
    const now = new Date();

    if (timescale === 180) {
      const monthCounts = new Map<string, number>();
      const monthLabels: string[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });

        monthCounts.set(monthKey, 0);
        monthLabels.push(label);
      }

      activityData.forEach((activity) => {
        const activityDate = new Date(activity.date);
        const monthKey = `${activityDate.getFullYear()}-${String(
          activityDate.getMonth() + 1,
        ).padStart(2, "0")}`;

        if (monthCounts.has(monthKey)) {
          monthCounts.set(
            monthKey,
            monthCounts.get(monthKey)! + activity.count,
          );
        }
      });

      return Array.from(monthCounts.values()).map((value, index) => ({
        label: monthLabels[index],
        value,
      }));
    }

    const dateCounts = new Map<string, number>();
    const dateLabels: string[] = [];

    for (let i = timescale - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateKey = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "numeric",
      });

      dateCounts.set(dateKey, 0);
      dateLabels.push(label);
    }

    activityData.forEach((activity) => {
      const activityDate = new Date(activity.date);
      const dateKey = activityDate.toISOString().split("T")[0];

      if (dateCounts.has(dateKey)) {
        dateCounts.set(dateKey, activity.count);
      }
    });

    return Array.from(dateCounts.values()).map((value, index) => ({
      label: dateLabels[index],
      value,
    }));
  }, [activityData, timescale]);

  const loadMoreNotifications = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const url = new URL("/api/v1/notifications", window.location.origin);
      url.searchParams.set("limit", "5");
      url.searchParams.set("cursor", nextCursor);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch more notifications");
      }

      const data: PaginatedResponse<NotificationStatus> = await response.json();
      setNotifications((prev) => [...prev, ...data.data]);
      setNextCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err) {
      console.error("Error fetching more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewDetail = (notificationId: string) => {
    navigate(`/notifications/${notificationId}`);
  };

  const handleRebuildActivity = async () => {
    setRebuildingActivity(true);
    try {
      const response = await fetch("/api/v1/admin/rebuild-activity", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to rebuild activity");
      }

      const activityResponse = await fetch(
        `/api/v1/notifications/activity/${timescale}`,
      );
      if (activityResponse.ok) {
        const data: Array<{ count: number; date: string }> =
          await activityResponse.json();
        setActivityData(data);
      }
    } catch (err) {
      console.error("Error rebuilding activity:", err);
    } finally {
      setRebuildingActivity(false);
    }
  };

  const getTimescaleLabel = () => {
    switch (timescale) {
      case 7:
        return "LAST_7_DAYS";
      case 30:
        return "LAST_MONTH";
      case 180:
        return "LAST_6_MONTHS";
      default:
        return "LAST_7_DAYS";
    }
  };

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          <PageHeader
            title="NOTIFICATIONS"
            subtitle=":: VIEW_AND_MANAGE ::"
            icon={<Bell className="size-8 text-cp-orange" />}
          />

          {/* Activity Chart */}
          <div className="mb-6 border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
            <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />
            <div className="bg-cp-beige border-b-2 border-cp-black px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-cp-blue" />
                  <h2 className="font-mono font-bold uppercase tracking-widest text-cp-black text-sm">
                    ACTIVITY_CHART /// {getTimescaleLabel()}
                  </h2>
                </div>
                <button
                  onClick={handleRebuildActivity}
                  disabled={rebuildingActivity}
                  className="flex items-center gap-1.5 px-2 py-1 border-2 border-cp-black bg-cp-paper text-cp-charcoal hover:bg-cp-beige shadow-hard-sm font-mono text-xs font-bold uppercase transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rebuild activity data"
                >
                  <RefreshCw
                    className={`size-3 ${
                      rebuildingActivity ? "animate-spin" : ""
                    }`}
                  />
                  {rebuildingActivity ? "REBUILDING" : "REBUILD"}
                </button>
              </div>

              {/* Timescale Toggle */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-cp-charcoal font-bold">
                  TIMESCALE:
                </span>
                <div className="inline-flex border-2 border-cp-black shadow-hard-sm bg-cp-paper dark:bg-cp-charcoal">
                  <button
                    onClick={() => setTimescale(7)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase border-r-2 border-cp-black transition-all ${
                      timescale === 7
                        ? "bg-cp-blue text-cp-paper dark:bg-cp-orange"
                        : "bg-cp-paper dark:bg-cp-charcoal text-cp-charcoal dark:text-cp-beige hover:bg-cp-beige dark:hover:bg-cp-gray"
                    }`}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setTimescale(30)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase border-r-2 border-cp-black transition-all ${
                      timescale === 30
                        ? "bg-cp-blue text-cp-paper dark:bg-cp-orange"
                        : "bg-cp-paper dark:bg-cp-charcoal text-cp-charcoal dark:text-cp-beige hover:bg-cp-beige dark:hover:bg-cp-gray"
                    }`}
                  >
                    1M
                  </button>
                  <button
                    onClick={() => setTimescale(180)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-all ${
                      timescale === 180
                        ? "bg-cp-blue text-cp-paper dark:bg-cp-orange"
                        : "bg-cp-paper dark:bg-cp-charcoal text-cp-charcoal dark:text-cp-beige hover:bg-cp-beige dark:hover:bg-cp-gray"
                    }`}
                  >
                    6M
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-cp-paper">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 5, left: -25 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{
                        fill: isDarkMode
                          ? "rgb(218, 218, 218)"
                          : "rgb(16, 16, 16)",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                      stroke={
                        isDarkMode ? "rgb(218, 218, 218)" : "rgb(16, 16, 16)"
                      }
                      strokeWidth={2}
                      label={{
                        value: "DATE",
                        position: "insideBottom",
                        offset: -5,
                        style: {
                          fill: isDarkMode
                            ? "rgb(255, 176, 0)"
                            : "rgb(255, 95, 0)",
                          fontFamily: "monospace",
                          fontSize: 10,
                          fontWeight: "bold",
                        },
                      }}
                    />
                    <YAxis
                      tick={{
                        fill: isDarkMode
                          ? "rgb(218, 218, 218)"
                          : "rgb(16, 16, 16)",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                      stroke={
                        isDarkMode ? "rgb(218, 218, 218)" : "rgb(16, 16, 16)"
                      }
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode
                          ? "rgb(28, 28, 28)"
                          : "rgb(253, 246, 227)",
                        border: isDarkMode
                          ? "2px solid rgb(80, 80, 80)"
                          : "2px solid rgb(16, 16, 16)",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: isDarkMode
                          ? "rgb(218, 218, 218)"
                          : "rgb(16, 16, 16)",
                        fontWeight: "bold",
                      }}
                      itemStyle={{
                        color: isDarkMode
                          ? "rgb(255, 176, 0)"
                          : "rgb(255, 95, 0)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill={isDarkMode ? "rgb(255, 176, 0)" : "rgb(255, 95, 0)"}
                      stroke={
                        isDarkMode ? "rgb(80, 80, 80)" : "rgb(16, 16, 16)"
                      }
                      strokeWidth={2}
                      radius={[0, 0, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {loadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 size-12 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
                <p className="text-sm text-cp-charcoal font-mono uppercase tracking-wider">
                  LOADING_NOTIFICATIONS...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="border-2 border-cp-black bg-cp-paper p-6 shadow-hard">
              <p className="text-sm text-cp-charcoal font-mono">
                <strong>[ERROR]</strong> {error}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="border-2 border-dashed border-cp-black bg-cp-paper p-12 text-center shadow-hard">
              <Bell className="mx-auto mb-4 size-12 text-cp-gray" />
              <h3 className="font-mono font-bold mb-2 text-lg text-cp-black uppercase tracking-wider">
                NO_NOTIFICATIONS_YET
              </h3>
              <p className="text-sm text-cp-gray font-mono">
                &gt; Notifications will appear here when they are sent.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications
                .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                .map((notification) => (
                  <NotificationCard
                    key={notification.notification_id}
                    notification={notification}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={loadMoreNotifications}
                    disabled={loadingMore}
                    className="font-mono font-bold uppercase text-sm px-6 py-2 border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard hover:bg-[#ff7722] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    [{loadingMore ? "LOADING..." : "LOAD_MORE"}]
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsList;
