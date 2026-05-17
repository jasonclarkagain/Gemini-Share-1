import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'flagged' | 'approved' | 'rejected';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    queued: "bg-muted text-muted-foreground border-muted-border",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    flagged: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border uppercase tracking-wider",
      variants[status],
      className
    )}>
      {status}
    </span>
  );
}
