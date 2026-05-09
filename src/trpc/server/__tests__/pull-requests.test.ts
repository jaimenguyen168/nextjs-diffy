import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "../trpc";
import { pullRequestRouter } from "../routers/pull-requests";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/trpc/server/utils", () => ({
  resolveGitHubRepo: vi.fn(),
}));
vi.mock("@/trpc/services/github", () => ({
  fetchPullRequests: vi.fn(),
  fetchPullRequest: vi.fn(),
  fetchPullRequestFiles: vi.fn(),
}));

import { resolveGitHubRepo } from "@/trpc/server/utils";
import {
  fetchPullRequests,
  fetchPullRequest,
  fetchPullRequestFiles,
} from "@/trpc/services/github";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createCaller = createCallerFactory(pullRequestRouter);

const mockDb = {
  review: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
};

const mockUser = {
  id: "user-1",
  name: "Jaime",
  email: "jaime@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
};

const mockSession = {
  session: {
    id: "sess-1",
    userId: "user-1",
    token: "tok",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    ipAddress: null,
    userAgent: null,
  },
  user: mockUser,
};

function makeCtx(sessionOverride?: typeof mockSession | null) {
  return {
    db: mockDb as never,
    session: sessionOverride !== undefined ? sessionOverride : mockSession,
    headers: new Headers(),
  };
}

const caller = createCaller(makeCtx());

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockResolvedRepo = {
  repository: { id: "repo-1", fullName: "jaime/diffy" },
  accessToken: "token-abc",
  owner: "jaime",
  repo: "diffy",
};

const basePR = {
  id: 1001,
  number: 42,
  title: "Add feature X",
  state: "open",
  draft: false,
  html_url: "https://github.com/jaime/diffy/pull/42",
  user: { login: "jaime", avatar_url: "https://avatars.githubusercontent.com/u/1" },
  head: { ref: "feature/x", sha: "abc123" },
  base: { ref: "main" },
  additions: 50,
  deletions: 10,
  changed_files: 3,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
  merged_at: null,
};

// ─── list ─────────────────────────────────────────────────────────────────────

describe("pullRequest.list", () => {
  beforeEach(() => {
    vi.mocked(resolveGitHubRepo).mockResolvedValue(mockResolvedRepo as never);
    vi.mocked(fetchPullRequests).mockResolvedValue([basePR] as never);
    mockDb.review.findMany.mockResolvedValue([]);
  });

  it("returns mapped pull requests with no review when none exist", async () => {
    const result = await caller.list({ repositoryId: "repo-1", state: "open" });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1001,
      number: 42,
      title: "Add feature X",
      state: "open",
      draft: false,
      author: { login: "jaime" },
      headRef: "feature/x",
      baseRef: "main",
      additions: 50,
      deletions: 10,
      changedFiles: 3,
      review: null,
    });
  });

  it("attaches the most recent review when one exists for the PR", async () => {
    const mockReview = {
      prNumber: 42,
      status: "COMPLETED",
      createdAt: new Date("2025-01-03T00:00:00Z"),
    };
    mockDb.review.findMany.mockResolvedValue([mockReview]);

    const result = await caller.list({ repositoryId: "repo-1", state: "open" });

    expect(result[0].review).toMatchObject({
      prNumber: 42,
      status: "COMPLETED",
    });
  });

  it("calls resolveGitHubRepo with the correct repositoryId and userId", async () => {
    await caller.list({ repositoryId: "repo-1", state: "open" });

    expect(resolveGitHubRepo).toHaveBeenCalledWith("repo-1", "user-1");
  });

  it("calls fetchPullRequests with the correct state", async () => {
    await caller.list({ repositoryId: "repo-1", state: "closed" });

    expect(fetchPullRequests).toHaveBeenCalledWith(
      "token-abc",
      "jaime",
      "diffy",
      "closed",
    );
  });

  it("defaults state to 'open' when not provided", async () => {
    await caller.list({ repositoryId: "repo-1" } as never);

    expect(fetchPullRequests).toHaveBeenCalledWith(
      "token-abc",
      "jaime",
      "diffy",
      "open",
    );
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.list({ repositoryId: "repo-1", state: "open" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── get ──────────────────────────────────────────────────────────────────────

describe("pullRequest.get", () => {
  beforeEach(() => {
    vi.mocked(resolveGitHubRepo).mockResolvedValue(mockResolvedRepo as never);
    vi.mocked(fetchPullRequest).mockResolvedValue(basePR as never);
    mockDb.review.findFirst.mockResolvedValue(null);
  });

  it("returns a mapped PR with headSha", async () => {
    const result = await caller.get({ repositoryId: "repo-1", prNumber: 42 });

    expect(result).toMatchObject({
      id: 1001,
      number: 42,
      title: "Add feature X",
      headRef: "feature/x",
      headSha: "abc123",
      baseRef: "main",
      review: null,
    });
  });

  it("attaches the review when one exists", async () => {
    const mockReview = { id: "rev-1", status: "COMPLETED", prNumber: 42 };
    mockDb.review.findFirst.mockResolvedValue(mockReview);

    const result = await caller.get({ repositoryId: "repo-1", prNumber: 42 });

    expect(result.review).toMatchObject({ id: "rev-1", status: "COMPLETED" });
  });

  it("calls fetchPullRequest with correct args", async () => {
    await caller.get({ repositoryId: "repo-1", prNumber: 42 });

    expect(fetchPullRequest).toHaveBeenCalledWith("token-abc", "jaime", "diffy", 42);
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.get({ repositoryId: "repo-1", prNumber: 42 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── files ────────────────────────────────────────────────────────────────────

describe("pullRequest.files", () => {
  const mockFiles = [
    {
      sha: "sha-1",
      filename: "src/index.ts",
      status: "modified",
      additions: 5,
      deletions: 2,
      changes: 7,
      patch: "@@ -1,2 +1,5 @@",
      previous_filename: undefined,
    },
  ];

  beforeEach(() => {
    vi.mocked(resolveGitHubRepo).mockResolvedValue(mockResolvedRepo as never);
    vi.mocked(fetchPullRequestFiles).mockResolvedValue(mockFiles as never);
  });

  it("returns mapped file objects", async () => {
    const result = await caller.files({ repositoryId: "repo-1", prNumber: 42 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sha: "sha-1",
      filename: "src/index.ts",
      status: "modified",
      additions: 5,
      deletions: 2,
      changes: 7,
      patch: "@@ -1,2 +1,5 @@",
    });
  });

  it("calls fetchPullRequestFiles with correct args", async () => {
    await caller.files({ repositoryId: "repo-1", prNumber: 42 });

    expect(fetchPullRequestFiles).toHaveBeenCalledWith(
      "token-abc",
      "jaime",
      "diffy",
      42,
    );
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.files({ repositoryId: "repo-1", prNumber: 42 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
