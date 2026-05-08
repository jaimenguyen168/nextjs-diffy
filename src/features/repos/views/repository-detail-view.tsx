"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PullRequestCard } from "@/features/repos/components/pull-request-card";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  GitBranch,
  Globe,
  Lock,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryDetailViewProps {
  id: string;
}

export function RepositoryDetailView({ id }: RepositoryDetailViewProps) {
  const [prState, setPrState] = useState<"open" | "closed" | "all">("open");

  const repository = trpc.repository.list.useQuery(undefined, {
    select: (repos) => repos.find((r) => r.id === id),
  });

  const pullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: prState },
    {
      enabled: !!id,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        const hasActiveReview = data.some(
          (pr) =>
            pr.review?.status === "PENDING" ||
            pr.review?.status === "PROCESSING",
        );
        return hasActiveReview ? 2000 : false;
      },
    },
  );

  const openPRs = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "open" },
    { enabled: !!id },
  );
  const closedPRs = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "closed" },
    { enabled: !!id },
  );
  const allPRs = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "all" },
    { enabled: !!id },
  );

  const prCounts = {
    open: openPRs.data?.length ?? 0,
    closed: closedPRs.data?.length ?? 0,
    all: allPRs.data?.length ?? 0,
  };

  if (!pullRequests.data) {
    return <RepositoryDetailSkeleton />;
  }

  if (!repository.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <GitBranch className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Repository not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This repository may have been disconnected.
          </p>
          <Link href="/repos" className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to repositories
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/repos">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {repository.data.fullName}
              </h1>
              <Badge variant="outline" className="gap-1">
                {repository.data.private ? (
                  <>
                    <Lock className="size-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Public
                  </>
                )}
              </Badge>
            </div>
            <a
              href={repository.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1"
            >
              View on GitHub
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => pullRequests.refetch()}
          disabled={pullRequests.isFetching}
        >
          <RefreshCw
            className={cn("size-4", pullRequests.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <div className="border-b border-border/60">
        <div className="flex items-center gap-1">
          {(["open", "closed", "all"] as const).map((state) => (
            <button
              key={state}
              onClick={() => setPrState(state)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                prState === state
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {state === "open" && (
                  <GitPullRequest className="size-4 text-emerald-500" />
                )}
                {state === "closed" && (
                  <GitMerge className="size-4 text-purple-500" />
                )}
                {state === "all" && (
                  <GitBranch className="size-4 text-muted-foreground" />
                )}
                {state.charAt(0).toUpperCase() + state.slice(1)}
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
                    prState === state
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {prCounts[state]}
                </span>
              </span>
              {prState === state && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {pullRequests.isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : pullRequests.error ? (
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="size-6 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">
                Failed to load pull requests.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pullRequests.error.message}
              </p>
            </CardContent>
          </Card>
        ) : pullRequests.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <GitPullRequest className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">No pull requests found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {prState === "all"
                  ? "This repository has no pull requests yet."
                  : `No ${prState} pull requests found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          pullRequests.data?.map((pr) => (
            <PullRequestCard key={pr.id} pr={pr} repositoryId={id} />
          ))
        )}
      </div>
    </div>
  );
}

export function RepositoryDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
