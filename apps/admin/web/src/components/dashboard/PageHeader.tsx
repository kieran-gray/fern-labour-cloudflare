import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  icon?: ReactNode;
}

export function PageHeader({
  title,
  highlightedTitle,
  subtitle,
  icon,
}: PageHeaderProps) {
  return (
    <div className="mb-6 border-b-4 border-double border-cp-black pb-4">
      <div className={icon ? "flex items-bottom gap-3 mb-2" : ""}>
        {icon}
        <h1 className="font-mono font-bold text-2xl sm:text-3xl text-cp-black dark:text-cp-charcoal uppercase tracking-wider mb-2">
          {title}
          {highlightedTitle && (
            <span className="text-cp-orange">{highlightedTitle}</span>
          )}
        </h1>
      </div>
      <p className="text-sm text-cp-gray font-mono">{subtitle}</p>
    </div>
  );
}
