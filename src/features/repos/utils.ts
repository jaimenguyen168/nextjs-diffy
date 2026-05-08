import {
  BugIcon,
  ShieldIcon,
  ZapIcon,
  PaintbrushIcon,
  LightbulbIcon,
  CircleDotIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldXIcon,
} from "lucide-react";

export function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getRiskConfig(score: number) {
  if (score < 25) {
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      markerColor: "#10b981",
      label: "Low Risk",
      icon: ShieldCheckIcon,
    };
  }
  if (score < 50) {
    return {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      markerColor: "#f59e0b",
      label: "Medium Risk",
      icon: CircleDotIcon,
    };
  }
  if (score < 75) {
    return {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      markerColor: "#f97316",
      label: "High Risk",
      icon: ShieldAlertIcon,
    };
  }
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    markerColor: "#ef4444",
    label: "Critical Risk",
    icon: ShieldXIcon,
  };
}

export function getSeverityStyles(severity: string) {
  switch (severity) {
    case "critical":
      return {
        bar: "bg-red-500",
        badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
      };
    case "high":
      return {
        bar: "bg-orange-500",
        badge: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
      };
    case "medium":
      return {
        bar: "bg-amber-500",
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        badge: "border-border bg-muted text-muted-foreground",
      };
  }
}

export function getCategoryIcon(category?: string) {
  switch (category) {
    case "bug":
      return BugIcon;
    case "security":
      return ShieldIcon;
    case "performance":
      return ZapIcon;
    case "style":
      return PaintbrushIcon;
    case "suggestion":
      return LightbulbIcon;
    default:
      return CircleDotIcon;
  }
}
