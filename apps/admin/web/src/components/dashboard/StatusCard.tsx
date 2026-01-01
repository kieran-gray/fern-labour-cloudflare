import { type LucideIcon } from "lucide-react";
import { generateAsciiArtText } from "@/components/AsciiArt";

interface StatusCardProps {
  title: string;
  icon: LucideIcon;
  newCount: number;
  totalCount: number;
  loading: boolean;
  loadingCount: number;
  asciiMaxWidth: number;
  isMobile: boolean;
}

export function StatusCard({
  title,
  icon: Icon,
  newCount,
  totalCount,
  loading,
  loadingCount,
  asciiMaxWidth,
  isMobile,
}: StatusCardProps) {
  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard">
      <div className="border-b-2 border-cp-black bg-cp-beige p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-lg text-cp-black uppercase tracking-wider">
            [{title}]
          </h3>
          <Icon className="size-6 text-cp-blue" />
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex gap-2 items-end justify-between">
            <span className="font-mono text-cp-black dark:text-cp-charcoal leading-none tracking-normal whitespace-pre text-xs sm:text-sm max-w-full overflow-x-auto overflow-y-clip relative">
              {generateAsciiArtText(
                (loading ? loadingCount : newCount).toString().padStart(3, "0"),
                { maxWidth: asciiMaxWidth, mobile: isMobile },
              )}
            </span>
            <span className="font-mono text-sm text-cp-gray uppercase">
              NEW
            </span>
          </div>
        </div>
        <div className="space-y-2 border-t-2 border-cp-black pt-4">
          <div className="flex justify-between font-mono text-sm">
            <span className="text-cp-gray">TOTAL:</span>
            <span className="text-cp-charcoal font-bold">
              {loading ? "..." : totalCount}
            </span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-cp-gray">STATUS:</span>
            <span className="text-cp-green font-bold uppercase">
              {loading ? "● LOADING" : newCount > 0 ? "● ACTIVE" : "○ IDLE"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
