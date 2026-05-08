import { db } from "@/lib/db";

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
    select: {
      accessToken: true,
    },
  });

  return account?.accessToken ?? null;
}

export async function fetchGitHubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub repos: ${response.status}`);
    }

    const data = (await response.json()) as GitHubRepo[];
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const pulls = (await response.json()) as GitHubPullRequest[];

  // The list endpoint omits additions/deletions/changed_files — fetch each PR
  // individually to get those fields. Capped at 10 concurrent requests to avoid
  // burning through the GitHub rate limit (5000 req/hour).
  const results: GitHubPullRequest[] = [];
  const chunkSize = 10;
  for (let i = 0; i < pulls.length; i += chunkSize) {
    const chunk = pulls.slice(i, i + chunkSize);
    const fetched = await Promise.all(
      chunk.map((pr) => fetchPullRequest(accessToken, owner, repo, pr.number)),
    );
    results.push(...fetched);
  }
  return results;
}

export async function fetchPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return (await response.json()) as GitHubPullRequest;
}

/**
 * Parses a file's patch and builds a map of { actualLine -> diffPosition }
 * so we can convert AI comment line numbers to GitHub diff positions.
 */
export function buildLineToPositionMap(patch: string): Map<number, number> {
  const map = new Map<number, number>();
  let position = 0;
  let currentLine = 0;

  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      if (match) currentLine = parseInt(match[1], 10) - 1;
      position++;
    } else if (line.startsWith("+")) {
      currentLine++;
      position++;
      map.set(currentLine, position);
    } else if (line.startsWith("-")) {
      position++;
    } else {
      currentLine++;
      position++;
      map.set(currentLine, position);
    }
  }

  return map;
}

export async function postPullRequestReview(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string,
  body: string,
  comments: { path: string; position: number; body: string }[],
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: headSha,
        body,
        event: "COMMENT",
        comments,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post GitHub review: ${response.status} ${error}`);
  }
}

export async function fetchPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequestFile[]> {
  const files: GitHubPullRequestFile[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as GitHubPullRequestFile[];
    files.push(...data);

    if (data.length < perPage) break;
    page++;
  }

  return files;
}
