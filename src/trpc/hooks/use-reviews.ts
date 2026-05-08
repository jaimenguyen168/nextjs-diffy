"use client";

import { trpc } from "@/trpc/client";

export function useLatestReview(repositoryId: string, prNumber: number) {
  return trpc.review.getLatestForPR.useQuery(
    { repositoryId, prNumber },
    {
      enabled: !isNaN(prNumber),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PENDING" || status === "PROCESSING") return 2000;
        return false;
      },
    },
  );
}

export function useTriggerReview(
  repositoryId: string,
  prNumber: number,
  onSuccess?: () => void,
) {
  const utils = trpc.useUtils();

  return trpc.review.trigger.useMutation({
    onSuccess: () => {
      utils.review.getLatestForPR.invalidate({ repositoryId, prNumber });
      utils.pullRequest.get.invalidate({ repositoryId, prNumber });
      utils.pullRequest.list.invalidate({ repositoryId });
      onSuccess?.();
    },
  });
}
