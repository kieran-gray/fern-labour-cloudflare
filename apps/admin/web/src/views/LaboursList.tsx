import { useEffect, useState } from "react";
import { Baby } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { LabourCard } from "@/components/labour/LabourCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { LabourStatus } from "@/components/labour/LabourTypes";
import type { PaginatedResponse } from "@/components/notification/NotificationTypes";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface LaboursListProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const LaboursList = ({ user, onLogout }: LaboursListProps) => {
  const [labours, setLabours] = useState<LabourStatus[]>([]);
  const [loadingLabours, setLoadingLabours] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchLabours = async () => {
      try {
        const url = new URL("/api/v1/admin/labours", window.location.origin);
        url.searchParams.set("limit", "10");

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch labours");
        }

        const data: PaginatedResponse<LabourStatus> = await response.json();
        setLabours(data.data);
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch (err) {
        console.error("Error fetching labours:", err);
        setLabours([]);
      } finally {
        setLoadingLabours(false);
      }
    };

    fetchLabours();
  }, [user]);

  const loadMoreLabours = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const url = new URL("/api/v1/admin/labours", window.location.origin);
      url.searchParams.set("limit", "10");
      url.searchParams.set("cursor", nextCursor);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch more labours");
      }

      const data: PaginatedResponse<LabourStatus> = await response.json();
      setLabours((prev) => [...prev, ...data.data]);
      setNextCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err) {
      console.error("Error fetching more labours:", err);
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
            title="LABOURS"
            subtitle=":: VIEW_ALL_LABOURS ::"
            icon={<Baby className="size-8 text-cp-orange" />}
          />

          {loadingLabours ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 size-12 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
                <p className="text-sm text-cp-charcoal font-mono uppercase tracking-wider">
                  LOADING_LABOURS...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="border-2 border-cp-black bg-cp-paper p-6 shadow-hard">
              <p className="text-sm text-cp-charcoal font-mono">
                <strong>[ERROR]</strong> {error}
              </p>
            </div>
          ) : labours.length === 0 ? (
            <div className="border-2 border-dashed border-cp-black bg-cp-paper p-12 text-center shadow-hard">
              <Baby className="mx-auto mb-4 size-12 text-cp-gray" />
              <h3 className="font-mono font-bold mb-2 text-lg text-cp-black uppercase tracking-wider">
                NO_LABOURS_YET
              </h3>
              <p className="text-sm text-cp-gray font-mono">
                &gt; Labours will appear here when they are created.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {labours
                .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                .map((labour) => (
                  <LabourCard key={labour.labour_id} labour={labour} />
                ))}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={loadMoreLabours}
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

export default LaboursList;
