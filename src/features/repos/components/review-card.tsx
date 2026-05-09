"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
  GitPullRequestIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskConfig, getTimeAgo } from "@/features/repos/utils";

export type ReviewStatus =
  | "all"
  | "COMPLETED"
  | "PROCESSING"
  | "PENDING"
  | "FAILED";

export const STATUS_FILTERS = [
  "all",
  "COMPLETED",
  "PROCESSING",
  "PENDING",
  "FAILED",
] as const;

export const STATUS_CONFIG: Record<string, { bg: string; label: string }> = {
  COMPLETED: { bg: "bg-emerald-500/10", label: "Completed" },
  PROCESSING: { bg: "bg-blue-500/10", label: "Processing" },
  PENDING: { bg: "bg-amber-500/10", label: "Pending" },
  FAILED: { bg: "bg-red-500/10", label: "Failed" },
};

export function StatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  switch (status) {
    case "COMPLETED":
      return (
        <CheckCircleIcon
          className={cn("text-emerald-600 dark:text-emerald-400", className)}
        />
      );
    case "PROCESSING":
      return (
        <Loader2Icon
          className={cn("text-blue-600 dark:text-blue-400", className)}
        />
      );
    case "PENDING":
      return (
        <ClockIcon
          className={cn("text-amber-600 dark:text-amber-400", className)}
        />
      );
    case "FAILED":
      return (
        <XCircleIcon
          className={cn("text-red-600 dark:text-red-400", className)}
        />
      );
    default:
      return (
        <GitPullRequestIcon
          className={cn("text-muted-foreground", className)}
        />
      );
  }
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "success" | "info" | "warning" | "destructive"
  > = {
    COMPLETED: "success",
    PROCESSING: "info",
    PENDING: "warning",
    FAILED: "destructive",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

interface ReviewCardProps {
  review: {
    id: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    status: string;
    summary: string | null;
    riskScore: number | null;
    comments: unknown;
    error: string | null;
    createdAt: Date;
    repository: { id: string; fullName: string };
  };
  onRetry?: () => void;
}

export function ReviewCard({ review, onRetry }: ReviewCardProps) {
  const commentCount = Array.isArray(review.comments)
    ? review.comments.length
    : 0;
  const riskConfig =
    review.riskScore !== null ? getRiskConfig(review.riskScore) : null;

  const statusMessage =
    {
      PENDING: "Queued — will start shortly",
      PROCESSING: "Analyzing code…",
      FAILED: review.error || "Analysis failed",
    }[review.status] ?? null;

  return (
    <Card className="group hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={cn(
                "mt-1 p-2 rounded-lg shrink-0",
                STATUS_CONFIG[review.status]?.bg ?? "bg-muted",
              )}
            >
              <StatusIcon status={review.status} className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
                  className="font-medium hover:text-primary transition-colors truncate"
                >
                  {review.prTitle}
                </Link>
                <StatusBadge status={review.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">
                  {review.repository.fullName}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>#{review.prNumber}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {getTimeAgo(review.createdAt)}
                </span>
              </div>
              {review.status === "COMPLETED" && (
                <div className="flex items-center gap-4 pt-1">
                  {riskConfig && review.riskScore !== null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium",
                        riskConfig.color,
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          riskConfig.bg.replace("/10", ""),
                        )}
                      />
                      {riskConfig.label}
                      <span className="text-muted-foreground font-normal tabular-nums">
                        {review.riskScore}
                      </span>
                    </span>
                  )}
                  {commentCount > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <AlertTriangleIcon className="size-3.5" />
                      {commentCount}{" "}
                      {commentCount === 1 ? "comment" : "comments"}
                    </span>
                  )}
                </div>
              )}
              {review.summary && review.status === "COMPLETED" && (
                <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                  {review.summary}
                </p>
              )}
              {statusMessage && review.status !== "COMPLETED" && (
                <p
                  className={cn(
                    "text-sm pt-1",
                    review.status === "FAILED"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  {statusMessage}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={review.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              <ExternalLinkIcon className="size-4" />
            </a>
            {review.status === "FAILED" && onRetry ? (
              <Button onClick={onRetry}>Retry</Button>
            ) : (
              <Link
                href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
              >
                <Button size="sm" variant="outline">
                  {review.status === "COMPLETED" ? "View" : "Pending"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
