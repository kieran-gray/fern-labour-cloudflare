import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Avatar, AvatarFallback } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { User, LogOut, ChevronDown, Menu, X, Shield } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { CloudflareAccessIdentity } from "@/hooks/useCloudflareAccess";

interface HeaderProps {
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

export function Header({ user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const isCurrentPath = (href: string) => {
    return location.pathname === href;
  };

  const openMenu = () => {
    setIsVisible(true);
    setTimeout(() => setMobileMenuOpen(true), 10);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => setIsVisible(false), 200);
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-4 border-double border-cp-black bg-cp-beige">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border-2 border-cp-black bg-cp-black text-cp-paper">
                <Shield className="size-5" />
              </div>
              <div>
                <h1 className="font-mono font-bold text-base sm:text-lg text-cp-black uppercase tracking-wider">
                  ADMIN<span className="text-cp-orange sm:inline">.SYSTEM</span>
                </h1>
                <p className="hidden sm:block text-xs text-cp-gray font-mono">
                  :: MANAGEMENT_TERMINAL ::
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = isCurrentPath(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-2",
                      isCurrent
                        ? "bg-cp-black text-cp-paper border-cp-black"
                        : "text-cp-charcoal border-transparent hover:bg-cp-paper hover:border-cp-black",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section - User Menu and Mobile Toggle */}
            <div className="flex items-center gap-2">
              {/* User Dropdown - Desktop */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden sm:flex items-center gap-2 px-3 border-2 border-transparent hover:border-cp-black hover:bg-cp-paper"
                    >
                      <Avatar className="size-8 border-2 border-cp-black">
                        <AvatarFallback className="bg-cp-black text-cp-paper font-mono">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden text-left md:block font-mono">
                        <p className="text-xs font-bold text-cp-black uppercase tracking-wider">
                          {user.name || "USER"}
                        </p>
                        <p className="text-xs text-cp-gray">{user.email}</p>
                      </div>
                      <ChevronDown className="size-4 text-cp-gray" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-2 border-cp-black bg-cp-paper font-mono"
                  >
                    <DropdownMenuLabel className="font-bold uppercase tracking-wider text-xs">
                      MY_ACCOUNT
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-cp-black" />
                    <DropdownMenuItem disabled className="text-xs">
                      <User className="mr-2 size-4" />
                      <span>PROFILE</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-cp-black" />
                    <DropdownMenuItem
                      onClick={onLogout}
                      className="text-red-600 focus:text-red-600 text-xs font-bold uppercase"
                    >
                      <LogOut className="mr-2 size-4" />
                      <span>LOG_OUT</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden border-2 border-cp-black hover:bg-cp-paper"
                onClick={isVisible ? closeMenu : openMenu}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {isVisible ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isVisible && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-99 bg-cp-black/20 backdrop-blur-sm transition-all duration-200 sm:hidden",
              mobileMenuOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className={cn(
              "fixed left-4 right-4 top-20 z-100 transition-all duration-200 sm:hidden",
              mobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            )}
          >
            <div className="border-2 border-cp-black bg-cp-paper shadow-hard">
              {/* User info section for mobile */}
              {user && (
                <div className="border-b-2 border-cp-black bg-cp-beige p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="size-10 border-2 border-cp-black">
                      <AvatarFallback className="bg-cp-black text-cp-paper font-mono font-bold">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-mono flex-1 min-w-0">
                      <p className="text-sm font-bold text-cp-black uppercase tracking-wider truncate">
                        {user.name || "USER"}
                      </p>
                      <p className="text-xs text-cp-gray truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      onLogout();
                      closeMenu();
                    }}
                    className="w-full font-mono font-bold uppercase text-xs px-4 py-2 border-2 border-red-600 bg-cp-paper text-red-600 hover:bg-red-600 hover:text-cp-paper"
                  >
                    <LogOut className="size-4 mr-2" />
                    LOG_OUT
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <nav className="p-4 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = isCurrentPath(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider transition-colors border-2",
                        isCurrent
                          ? "bg-cp-black text-cp-paper border-cp-black"
                          : "text-cp-charcoal border-transparent hover:bg-cp-beige hover:border-cp-black",
                      )}
                    >
                      <Icon className="size-5" />
                      <span>{item.name}</span>
                      {isCurrent && (
                        <div className="ml-auto size-2 bg-cp-orange" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
