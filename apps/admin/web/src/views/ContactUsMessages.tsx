import { useEffect, useState, useMemo } from "react";
import { BarChart3, Inbox } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Sidebar } from "@/components/ui/Sidebar";
import { ContactMessageList } from "@/components/contact_message/ContactMessageList";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import type { ContactMessage } from "@/components/contact_message/ContactMessage";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface ContactUsMessagesProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const ContactUsMessages = ({ user, onLogout }: ContactUsMessagesProps) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [activityData, setActivityData] = useState<
    Array<{ count: number; date: string }>
  >([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timescale, setTimescale] = useState<7 | 30 | 180>(7);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;

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
    const fetchMessages = async () => {
      try {
        const url = new URL(
          "/api/v1/contact-messages/",
          window.location.origin,
        );
        url.searchParams.set("limit", String(limit + 1));
        url.searchParams.set("offset", "0");

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data: ContactMessage[] = await response.json();

        const hasMoreMessages = data.length > limit;
        if (hasMoreMessages) {
          data.pop();
        }

        setMessages(data);
        setHasMore(hasMoreMessages);
        setOffset(limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchActivityData = async () => {
      try {
        const response = await fetch(
          `/api/v1/contact-messages/activity/${timescale}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contact message activity");
        }

        const data: Array<{ count: number; date: string }> =
          await response.json();
        setActivityData(data);
      } catch (err) {
        console.error("Error fetching contact message activity:", err);
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

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const url = new URL("/api/v1/contact-messages/", window.location.origin);
      url.searchParams.set("limit", String(limit + 1));
      url.searchParams.set("offset", String(offset));

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch more messages");
      }

      const data: ContactMessage[] = await response.json();

      const hasMoreMessages = data.length > limit;
      if (hasMoreMessages) {
        data.pop();
      }

      setMessages((prev) => [...prev, ...data]);
      setHasMore(hasMoreMessages);
      setOffset((prev) => prev + limit);
    } catch (err) {
      console.error("Error fetching more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          <PageHeader
            title="CONTACT"
            highlightedTitle=".MESSAGES"
            subtitle=":: INBOX :: FORM_SUBMISSIONS ::"
            icon={<Inbox className="size-8 text-cp-orange" />}
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

          <ContactMessageList
            messages={messages}
            isLoading={loadingMessages}
            error={error}
          />

          {!loadingMessages && !error && hasMore && messages.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={loadMoreMessages}
                disabled={loadingMore}
                className="font-mono font-bold uppercase text-sm px-6 py-2 border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard hover:bg-[#ff7722] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                [{loadingMore ? "LOADING..." : "LOAD_MORE"}]
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContactUsMessages;
