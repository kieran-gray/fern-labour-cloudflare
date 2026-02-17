import {
  Clock,
  CheckCircle2,
  Play,
  Zap,
  ArrowRight,
  Baby,
  CalendarClock,
  Trash2,
} from "lucide-react";
import type { LabourStatus } from "./LabourTypes";

function getPhaseInfo(phase: string) {
  switch (phase) {
    case "PLANNED":
      return {
        label: "PLANNED",
        icon: <CalendarClock className="size-4" />,
        color: "text-cp-gray",
        borderColor: "border-cp-gray",
        bgColor: "bg-cp-gray",
      };
    case "EARLY":
      return {
        label: "EARLY",
        icon: <Clock className="size-4" />,
        color: "text-cp-blue",
        borderColor: "border-cp-blue",
        bgColor: "bg-cp-blue",
      };
    case "ACTIVE":
      return {
        label: "ACTIVE",
        icon: <Play className="size-4" />,
        color: "text-cp-orange",
        borderColor: "border-cp-orange",
        bgColor: "bg-cp-orange",
      };
    case "TRANSITION":
      return {
        label: "TRANSITION",
        icon: <ArrowRight className="size-4" />,
        color: "text-purple-600",
        borderColor: "border-purple-600",
        bgColor: "bg-purple-600",
      };
    case "PUSHING":
      return {
        label: "PUSHING",
        icon: <Zap className="size-4" />,
        color: "text-red-600",
        borderColor: "border-red-600",
        bgColor: "bg-red-600",
      };
    case "COMPLETE":
      return {
        label: "COMPLETE",
        icon: <CheckCircle2 className="size-4" />,
        color: "text-cp-green",
        borderColor: "border-cp-green",
        bgColor: "bg-cp-green",
      };
    default:
      return {
        label: phase,
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

export function LabourCard({ labour }: { labour: LabourStatus }) {
  const phaseInfo = getPhaseInfo(labour.current_phase);
  const { date, time } = formatDateTime(labour.updated_at);
  const isDeleted = !!labour.deleted_at;

  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />

      {/* Header Strip */}
      <div className="bg-cp-beige border-b-2 border-cp-black px-4 py-2 flex justify-between items-center">
        <h3 className="font-mono font-bold uppercase tracking-widest text-cp-black text-xs">
          LABOUR /// {phaseInfo.label}
          {isDeleted && (
            <span className="text-red-600 ml-2">
              <Trash2 className="size-3 inline -mt-0.5" /> DELETED
            </span>
          )}
        </h3>
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${phaseInfo.bgColor}`} />
          <div className="w-2 h-2 border border-cp-black" />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 font-mono">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Labour Info */}
          <div className="flex flex-col gap-2 flex-1">
            {labour.labour_name && (
              <div className="flex items-center gap-2">
                <Baby className="size-4 text-cp-orange" />
                <span className="text-sm font-bold text-cp-black">
                  {labour.labour_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; MOTHER:
              </span>
              <span className="text-xs text-cp-charcoal font-bold">
                {labour.mother_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt; ID:
              </span>
            </div>
            <p className="text-xs text-cp-charcoal break-all border-l-2 border-cp-black pl-2">
              {labour.labour_id}
            </p>
          </div>

          {/* Status Badge and Date */}
          <div className="flex flex-row md:flex-col gap-2 justify-between md:items-end">
            {/* Phase Badge */}
            <div
              className={`flex items-center gap-2 border-2 ${phaseInfo.borderColor} px-2 py-1`}
            >
              <span className={phaseInfo.color}>{phaseInfo.icon}</span>
              <span
                className={`text-xs font-bold ${phaseInfo.color} uppercase tracking-wider`}
              >
                {phaseInfo.label}
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
