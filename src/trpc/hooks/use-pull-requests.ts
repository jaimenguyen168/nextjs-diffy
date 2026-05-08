"use client";

import { trpc } from "@/trpc/client";

export function usePullRequest(repositoryId: string, prNumber: number) {
  return trpc.pullRequest.get.useQuery(
    { repositoryId, prNumber },
    { enabled: !isNaN(prNumber) },
  );
}

export function usePullRequestFiles(repositoryId: string, prNumber: number) {
  return trpc.pullRequest.files.useQuery(
    { repositoryId, prNumber },
    { enabled: !isNaN(prNumber) },
  );
}
