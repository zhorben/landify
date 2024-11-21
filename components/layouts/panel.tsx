"use client";

interface PanelProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function Panel({ children, header, className = "" }: PanelProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {header && (
        <div className="px-6 py-4 border-b border-zinc-200 bg-white">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
