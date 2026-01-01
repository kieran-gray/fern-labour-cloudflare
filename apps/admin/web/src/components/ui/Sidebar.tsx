import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ChevronRight, ChevronLeft, LogOut, Menu } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";
import { ConfirmModal } from "./ConfirmModal";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  user?: CloudflareAccessIdentity | null;
  onLogout: () => void;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsExpanded(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  }, [location]);

  const isCurrentPath = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh bg-cp-beige border-r-4 border-double border-cp-black transition-all duration-300 flex flex-col",
          isExpanded
            ? "w-64 translate-x-0"
            : "-translate-x-full w-64 md:translate-x-0 md:w-16",
        )}
      >
        {/* Logo & Toggle Section */}
        <div className="border-b-4 border-double border-cp-black p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="font-mono flex font-bold text-sm text-cp-black uppercase tracking-wider truncate">
                ///{" "}
                <div className={cn("pl-2", !isExpanded && "md:hidden")}>
                  ADMIN<span className="text-cp-orange">.SYS</span>
                </div>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="">
            <div
              className={cn(
                "flex mt-1 mb-1 w-full",
                isExpanded ? "justify-end pr-1" : "justify-center",
              )}
            >
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="size-8 flex items-center justify-center border-2 border-cp-black bg-cp-orange text-cp-paper shadow-hard-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0"
              >
                {isExpanded ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border-l-4 relative group overflow-hidden",
                    isCurrent
                      ? "bg-cp-black text-cp-paper border-l-cp-orange sidebar-nav-active"
                      : "text-cp-charcoal hover:bg-cp-paper border-l-transparent hover:border-l-cp-black sidebar-nav-hover",
                  )}
                >
                  {/* Animated bracket indicator */}
                  <span
                    className={cn(
                      "absolute left-1 transition-all duration-200 text-cp-orange opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                    )}
                  >
                    &gt;
                  </span>

                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      isCurrent && "text-cp-orange",
                    )}
                  />
                  <span className={cn("truncate", !isExpanded && "md:hidden")}>
                    {item.name}
                  </span>

                  {/* Scanline texture overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

                  {!isExpanded && (
                    <div className="hidden md:block absolute left-full ml-2 px-3 py-2 bg-cp-black text-cp-paper border-2 border-cp-black font-mono text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-hard z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Theme Toggle Section */}
        <div className="border-t-4 border-double border-cp-black p-3">
          <ThemeToggle isExpanded={isExpanded} />
        </div>

        {/* User Section */}
        <div className="border-t-4 border-double border-cp-black">
          {user && (
            <div
              className={cn("p-3", isExpanded ? "space-y-2" : "md:space-y-3")}
            >
              <div className="flex items-center gap-3">
                <Avatar className="shrink-0">
                  <AvatarFallback>
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "font-mono flex-1 min-w-0",
                    !isExpanded && "md:hidden",
                  )}
                >
                  <p className="text-xs font-bold text-cp-black uppercase tracking-wider truncate">
                    {user.name || "USER"}
                  </p>
                  <p className="text-xs text-cp-gray truncate">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={cn(
                  "font-mono font-bold uppercase text-xs border-2 border-red-900 bg-red-600 text-white shadow-hard-sm transition-all duration-300 relative overflow-hidden",
                  "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none",
                  isExpanded ? "w-full py-3 px-3" : "aspect-square p-2",
                )}
                title={!isExpanded ? "TERMINATE SESSION" : undefined}
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)]" />

                <div className="relative z-10 flex items-center justify-center gap-2">
                  <LogOut className="size-4" />
                  {isExpanded && (
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs tracking-widest">TERMINATE</span>
                      <span className="text-[0.65rem] tracking-wider opacity-90">
                        SESSION
                      </span>
                    </div>
                  )}
                </div>
              </button>

              <ConfirmModal
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
                onConfirm={onLogout}
                title="TERMINATE SESSION"
                description="You are about to end your current administrative session. All unsaved changes will be lost and you will need to re-authenticate to access the system again."
                confirmText="TERMINATE"
                cancelText="ABORT"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button - Top Right Corner */}
      <div className="fixed top-4 right-4 z-40 md:hidden">
        {!isExpanded && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsExpanded(true)}
            className="border-2 border-cp-black bg-cp-paper shadow-hard hover:bg-cp-beige hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            aria-label="Open menu"
          >
            <Menu className="size-5 text-cp-black" />
          </Button>
        )}
      </div>

      {/* SPACER: HIDDEN ON MOBILE */}
      <div
        className={cn(
          "transition-all duration-300 shrink-0 hidden md:block",
          isExpanded ? "w-64" : "w-16",
        )}
      />
    </>
  );
}
