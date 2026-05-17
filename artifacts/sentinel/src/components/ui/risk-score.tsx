import { cn } from "@/lib/utils";

interface RiskScoreProps {
  score: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function RiskScore({ score, className, size = 'md' }: RiskScoreProps) {
  const getColor = (s: number) => {
    if (s < 30) return "text-green-500";
    if (s < 70) return "text-orange-500";
    return "text-destructive font-bold drop-shadow-[0_0_8px_rgba(var(--destructive),0.5)]";
  };

  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-4xl"
  };

  return (
    <div className={cn("font-mono tracking-tighter flex items-baseline gap-1", getColor(score), className)}>
      <span className={sizes[size]}>{score}</span>
      {size !== 'sm' && <span className="text-xs opacity-50 uppercase tracking-widest">Risk</span>}
    </div>
  );
}
