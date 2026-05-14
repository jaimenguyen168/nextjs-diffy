"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  XIcon,
  FolderGit2Icon,
  RefreshCwIcon,
  SearchIcon,
  CheckCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGithubRepos,
  useConnectRepos,
  useDisconnectRepo,
  useReposPage,
} from "@/trpc/hooks/use-repos";
import { ConnectedRepoCard } from "../components/connected-repo-card";
import { RepoSelectItem } from "../components/repo-select-item";
import { ConnectGithub } from "../components/connect-github";

export function ReposView() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { connectedRepos, getAvailableRepos, getFilteredRepos } =
    useReposPage();

  const githubRepos = useGithubRepos(showGitHubRepos);

  const connectMutation = useConnectRepos(() => {
    setSelectedRepos(new Set());
    setShowGitHubRepos(false);
  });

  const disconnectMutation = useDisconnectRepo();

  const availableRepos = getAvailableRepos(githubRepos.data ?? []);
  const filteredRepos = getFilteredRepos(availableRepos, searchQuery);

  const toggleRepo = (githubId: number) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(githubId)) {
        next.delete(githubId);
      } else {
        next.add(githubId);
      }
      return next;
    });
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos
      .filter((r) => selectedRepos.has(r.githubId))
      .map((r) => ({
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        htmlUrl: r.htmlUrl,
      }));
    connectMutation.mutate({ repos: reposToConnect });
  };

  const handleToggleAddPanel = () => {
    setShowGitHubRepos((prev) => !prev);
    setSearchQuery("");
    setSelectedRepos(new Set());
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground mt-1">
            Select repositories to connect to your account.
          </p>
        </div>
        <Button
          onClick={handleToggleAddPanel}
          variant={showGitHubRepos ? "outline" : "default"}
        >
          {showGitHubRepos ? (
            <>
              <XIcon className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="size-4" />
              Add Repository
            </>
          )}
        </Button>
      </div>

      {showGitHubRepos && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Import GitHub Repositories</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select repositories to import from GitHub.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => githubRepos.refetch()}
                disabled={githubRepos.isFetching}
              >
                <RefreshCwIcon
                  className={cn(
                    "size-4",
                    githubRepos.isFetching && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {githubRepos.isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : githubRepos.error ? (
              <div className="p-6">
                {githubRepos.error.data?.code === "PRECONDITION_FAILED" ? (
                  <ConnectGithub
                    title="Github account not connected"
                    description="Connect your Github account to view your repositories."
                  />
                ) : (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                    <p className="text-sm text-destructive">
                      {githubRepos.error.message}
                    </p>
                  </div>
                )}
              </div>
            ) : availableRepos.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircleIcon className="size-6 text-emerald-500" />
                </div>
                <p className="mt-4 font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All your repos are already connected!
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-border/60 flex items-center gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repos"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() =>
                        setSelectedRepos(
                          new Set(filteredRepos.map((r) => r.githubId)),
                        )
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Select all
                    </button>
                    {selectedRepos.size > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <button
                          onClick={() => setSelectedRepos(new Set())}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="max-h-100 overflow-y-auto">
                  {filteredRepos.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No repositories match your search.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredRepos.map((repo) => (
                        <RepoSelectItem
                          key={repo.githubId}
                          repo={repo}
                          selected={selectedRepos.has(repo.githubId)}
                          onToggle={() => toggleRepo(repo.githubId)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-border/60 bg-muted/60 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedRepos.size} of {filteredRepos.length} selected
                  </p>
                  <Button
                    onClick={handleConnect}
                    disabled={
                      selectedRepos.size === 0 || connectMutation.isPending
                    }
                  >
                    {connectMutation.isPending ? (
                      <>
                        <RefreshCwIcon className="size-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        {selectedRepos.size > 0 && ` (${selectedRepos.size})`}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Connected Repositories
          </h2>
          {connectedRepos.data && connectedRepos.data.length > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {connectedRepos.data.length}
            </Badge>
          )}
        </div>

        {connectedRepos.isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : connectedRepos.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="h-14 flex items-center justify-center">
                <FolderGit2Icon className="size-7 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">
                No connected repositories found.
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Connect your GitHub repositories to start getting AI-powered
                code reviews on your pull requests.
              </p>
              <Button className="mt-6" onClick={() => setShowGitHubRepos(true)}>
                <PlusIcon className="size-4" />
                Add your first repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {connectedRepos.data?.map((repo) => (
              <ConnectedRepoCard
                key={repo.id}
                repo={repo}
                onDisconnect={() => disconnectMutation.mutate({ id: repo.id })}
                isDisconnecting={disconnectMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
