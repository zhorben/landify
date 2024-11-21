import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ActionButton({
  onClick,
  disabled,
  loading,
  compact,
  children,
  className = "",
}: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${compact ? "px-4 py-2 h-8 text-sm" : "px-8 py-2.5 h-11"}
        bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Creating...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
