"use client";

import { trpc } from "@/trpc";
import type { GitHubRepo } from "@/features/repos/types";

export function useConnectedRepos() {
  return trpc.repository.list.useQuery();
}

export function useGithubRepos(enabled: boolean) {
  return trpc.repository.fetchFromGithub.useQuery(undefined, { enabled });
}

export function useConnectRepos(onSuccess?: () => void) {
  const utils = trpc.useUtils();

  return trpc.repository.connect.useMutation({
    onSuccess: () => {
      utils.repository.list.invalidate();
      onSuccess?.();
    },
  });
}

export function useDisconnectRepo() {
  const utils = trpc.useUtils();

  return trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      utils.repository.list.invalidate();
    },
  });
}

export function useReposPage() {
  const connectedRepos = useConnectedRepos();

  const connectedIds = new Set(
    connectedRepos.data?.map((repo) => repo.githubId) ?? [],
  );

  function getAvailableRepos(githubRepos: GitHubRepo[]) {
    return githubRepos.filter((repo) => !connectedIds.has(repo.githubId));
  }

  function getFilteredRepos(repos: GitHubRepo[], query: string) {
    if (!query) return repos;
    const lower = query.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(lower) ||
        repo.description?.toLowerCase().includes(lower),
    );
  }

  return {
    connectedRepos,
    connectedIds,
    getAvailableRepos,
    getFilteredRepos,
  };
}
