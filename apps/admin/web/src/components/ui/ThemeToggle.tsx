import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  isExpanded?: boolean;
}

export const ThemeToggle = ({ isExpanded = false }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme =
      (stored as "light" | "dark") || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "font-mono font-bold uppercase text-xs border-2 border-cp-black bg-cp-paper shadow-hard-sm transition-all duration-300 relative overflow-hidden",
        "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none",
        isExpanded ? "w-full py-3 px-3" : "aspect-square p-2",
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={
        !isExpanded
          ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
          : undefined
      }
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        <div className="relative size-4 shrink-0">
          {theme === "light" ? (
            <Sun className="size-4 text-cp-orange" />
          ) : (
            <Moon className="size-4 text-cp-orange text-glow" />
          )}
        </div>
        {isExpanded && (
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs tracking-widest text-cp-charcoal">
              {theme === "light" ? "LIGHT" : "DARK"}
            </span>
            <span className="text-[0.65rem] tracking-wider opacity-90 text-cp-gray">
              MODE
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
