import { useState } from "react";
import { Terminal } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ServiceSelector } from "@/components/command_center/ServiceSelector";
import { CommandSelector } from "@/components/command_center/CommandSelector";
import { DynamicCommandForm } from "@/components/command_center/DynamicCommandForm";
import {
  services,
  getServiceById,
  getCommandById,
} from "@/config/commandCenter";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface CommandCenterProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

type ViewState =
  | { type: "service-selection" }
  | { type: "command-selection"; serviceId: string }
  | { type: "command-form"; serviceId: string; commandId: string };

const CommandCenter = ({ user, onLogout }: CommandCenterProps) => {
  const [viewState, setViewState] = useState<ViewState>({
    type: "service-selection",
  });

  const handleSelectService = (serviceId: string) => {
    setViewState({ type: "command-selection", serviceId });
  };

  const handleSelectCommand = (commandId: string) => {
    if (viewState.type === "command-selection") {
      setViewState({
        type: "command-form",
        serviceId: viewState.serviceId,
        commandId,
      });
    }
  };

  const handleBackToServices = () => {
    setViewState({ type: "service-selection" });
  };

  const handleBackToCommands = () => {
    if (viewState.type === "command-form") {
      setViewState({
        type: "command-selection",
        serviceId: viewState.serviceId,
      });
    }
  };

  const getCurrentService = () => {
    if (viewState.type === "service-selection") return null;
    return getServiceById(viewState.serviceId);
  };

  const getCurrentCommand = () => {
    if (viewState.type !== "command-form") return null;
    return getCommandById(viewState.serviceId, viewState.commandId);
  };

  const currentService = getCurrentService();
  const currentCommand = getCurrentCommand();

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          {/* Mission Control Header */}
          <div className="mb-8">
            <PageHeader
              title="COMMAND"
              highlightedTitle=".CENTER"
              subtitle=":: MISSION_CONTROL :: SYSTEM_OPERATIONS ::"
              icon={<Terminal className="size-8 text-cp-orange" />}
            />
          </div>

          {/* Navigation Breadcrumb */}
          {viewState.type !== "service-selection" && (
            <div className="mb-6 font-mono text-xs text-cp-gray uppercase flex flex-wrap items-center gap-2">
              <span>COMMAND_CENTER</span>
              <span>/</span>
              <span className="text-cp-orange wrap-break-words">
                {currentService?.name}
              </span>
              {viewState.type === "command-form" && (
                <>
                  <span>/</span>
                  <span className="text-cp-blue wrap-break-words">
                    {currentCommand?.name}
                  </span>
                </>
              )}
            </div>
          )}

          {viewState.type === "service-selection" && (
            <div className="mb-6 border-2 border-dashed border-cp-black bg-cp-paper px-4 py-3 shadow-hard">
              <p className="text-xs font-bold text-cp-gray mb-2 uppercase tracking-wider">
                &gt; MISSION_BRIEF
              </p>
              <p className="text-xs text-cp-charcoal font-mono leading-relaxed">
                Welcome to the Command Center. Select a service to view
                available operations, then choose a command to configure and
                execute. All commands are logged and monitored for system
                integrity.
              </p>
            </div>
          )}

          {/* Main Content */}
          <SectionCard
            title={
              viewState.type === "service-selection"
                ? "SELECT_SERVICE"
                : viewState.type === "command-selection"
                  ? "SELECT_COMMAND"
                  : "EXECUTE_COMMAND"
            }
          >
            {viewState.type === "service-selection" && (
              <ServiceSelector
                services={services}
                onSelectService={handleSelectService}
              />
            )}

            {viewState.type === "command-selection" && currentService && (
              <CommandSelector
                commands={currentService.commands}
                onSelectCommand={handleSelectCommand}
                onBack={handleBackToServices}
              />
            )}

            {viewState.type === "command-form" &&
              currentService &&
              currentCommand && (
                <DynamicCommandForm
                  command={currentCommand}
                  serviceName={currentService.name}
                  onBack={handleBackToCommands}
                />
              )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
