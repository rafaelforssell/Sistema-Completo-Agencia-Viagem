import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground hover:bg-muted",
  info: "bg-primary/10 text-primary hover:bg-primary/10",
  success: "bg-success/10 text-success hover:bg-success/10",
  warning: "bg-warning/15 text-warning-foreground hover:bg-warning/15",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("font-medium", TONE_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}
