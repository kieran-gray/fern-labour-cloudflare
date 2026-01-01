import { type ReactNode } from "react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  cornerDecoration?: boolean;
}

export function SectionCard({
  title,
  children,
  cornerDecoration = true,
}: SectionCardProps) {
  return (
    <div className="border-2 border-cp-black bg-cp-paper shadow-hard relative overflow-hidden">
      {cornerDecoration && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-cp-black" />
      )}
      <div className="bg-cp-beige border-b-2 border-cp-black px-6 py-3">
        <h2 className="font-mono font-bold uppercase tracking-widest text-cp-black text-sm">
          {title} ///
        </h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}
