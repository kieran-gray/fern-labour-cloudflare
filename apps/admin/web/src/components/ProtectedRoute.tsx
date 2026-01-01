import type { ReactNode } from "react";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface ProtectedRouteProps {
  children: ReactNode;
  user: CloudflareAccessIdentity | null;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
}

export function ProtectedRoute({
  children,
  user,
  isLoading,
  error,
}: ProtectedRouteProps) {
  if (isLoading) {
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
              [!] AUTHENTICATION_ERROR
            </p>
          </div>
          <p className="text-sm text-cp-charcoal font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cp-beige scanlines">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
          <p className="text-lg text-cp-charcoal font-mono uppercase tracking-wider">
            AUTHENTICATING...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
