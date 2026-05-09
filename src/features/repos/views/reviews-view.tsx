"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTextIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ReviewCard,
  StatusIcon,
  STATUS_FILTERS,
  type ReviewStatus,
} from "@/features/repos/components/review-card";

export function ReviewsView() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("all");

  const reviews = trpc.review.list.useQuery(
    { limit: 50 },
    {
      refetchInterval: (query) => {
        const hasActive = query.state.data?.some(
          (r) => r.status === "PENDING" || r.status === "PROCESSING",
        );
        return hasActive ? 3000 : false;
      },
    },
  );

  const triggerReview = trpc.review.trigger.useMutation({
    onSuccess: () => reviews.refetch(),
  });

  const statusCounts: Record<ReviewStatus, number> = {
    all:        reviews.data?.length ?? 0,
    COMPLETED:  reviews.data?.filter((r) => r.status === "COMPLETED").length ?? 0,
    PROCESSING: reviews.data?.filter((r) => r.status === "PROCESSING").length ?? 0,
    PENDING:    reviews.data?.filter((r) => r.status === "PENDING").length ?? 0,
    FAILED:     reviews.data?.filter((r) => r.status === "FAILED").length ?? 0,
  };

  const filteredReviews = reviews.data?.filter(
    (r) => statusFilter === "all" || r.status === statusFilter,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-1">{statusCounts.all} total reviews</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => reviews.refetch()}
          disabled={reviews.isFetching}
        >
          <RefreshCwIcon className={cn("size-4", reviews.isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap p-1 bg-muted/50 rounded-lg w-fit">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              statusFilter === status
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <StatusIcon status={status} className="size-3.5" />
            {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            <span className={cn("ml-1 text-xs tabular-nums", statusFilter === status ? "text-muted-foreground" : "text-muted-foreground/70")}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {reviews.isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.error ? (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{reviews.error.message}</p>
          </CardContent>
        </Card>
      ) : filteredReviews?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
              <FileTextIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">
              {statusFilter === "all" ? "No reviews yet" : `No ${statusFilter.toLowerCase()} reviews`}
            </p>
            {statusFilter === "all" && (
              <p className="text-sm text-muted-foreground mt-1">
                Run your first AI review on a pull request!
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReviews?.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRetry={
                review.status === "FAILED"
                  ? () => triggerReview.mutate({ repositoryId: review.repository.id, prNumber: review.prNumber })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewsViewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-96 rounded-lg" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
