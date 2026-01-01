import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { NotificationCommandForm } from "@/components/notification/NotificationCommandForm";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface SendNotificationProps {
  user: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

const SendNotification = ({ user, onLogout }: SendNotificationProps) => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate("/notifications");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-cp-beige scanlines flex max-w-full">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-full">
        <div className="max-w-3xl mx-auto w-full">
          {/* Header Section */}
          <div className="mb-8">
            <PageHeader
              title="SEND"
              highlightedTitle=".NOTIFICATION"
              subtitle=":: DISPATCH_COMMAND :: NOTIFICATION_SERVICE ::"
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 border-2 border-cp-blue bg-cp-paper px-4 py-3 shadow-hard">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-cp-blue mt-0.5 shrink-0" />
              <div className="text-xs text-cp-charcoal font-mono">
                <p className="font-bold uppercase tracking-wider mb-2 text-cp-blue">
                  &gt; HOW_IT_WORKS
                </p>
                <p className="leading-relaxed">
                  This form sends a{" "}
                  <code className="bg-cp-beige border border-cp-black px-1 py-0.5 font-bold">
                    RequestNotification
                  </code>{" "}
                  command to the notification service, triggering the pipeline:
                  <br />
                  <span className="text-cp-gray">
                    REQUEST → RENDER → DISPATCH → DELIVER
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="mb-6">
            <SectionCard title="NOTIFICATION_DETAILS">
              <NotificationCommandForm onSuccess={handleSuccess} />
            </SectionCard>
          </div>

          {/* Available Templates Info */}
          <div className="border-2 border-dashed border-cp-black bg-cp-paper px-4 py-3 shadow-hard">
            <p className="text-xs font-bold text-cp-gray mb-3 uppercase tracking-wider">
              &gt; AVAILABLE_TEMPLATES
            </p>
            <ul className="text-xs text-cp-charcoal font-mono space-y-2">
              <li className="border-l-2 border-cp-orange pl-2">
                <span className="font-bold text-cp-black">HELLOWORLD</span> -
                Simple greeting template
              </li>
              <li className="border-l-2 border-cp-orange pl-2">
                <span className="font-bold text-cp-black">CONTACTUS</span> -
                Contact form confirmation
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SendNotification;
