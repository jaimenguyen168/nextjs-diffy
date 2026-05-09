import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "../trpc";
import { reviewRouter } from "../routers/review";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/trpc/server/utils", () => ({
  resolveGitHubRepo: vi.fn(),
}));
vi.mock("@/trpc/services/github", () => ({
  fetchPullRequest: vi.fn(),
  fetchPullRequestFiles: vi.fn(),
  postPullRequestReview: vi.fn(),
  buildLineToPositionMap: vi.fn(),
}));
vi.mock("@/trpc/services/ai", () => ({
  ReviewCommentSchema: {
    array: () => ({
      parse: vi.fn((v) => v),
    }),
  },
}));
vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn() },
}));

import { resolveGitHubRepo } from "@/trpc/server/utils";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  postPullRequestReview,
  buildLineToPositionMap,
} from "@/trpc/services/github";
import { inngest } from "@/inngest/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createCaller = createCallerFactory(reviewRouter);

const mockDb = {
  review: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
  html_url: "https://github.com/jaime/diffy/pull/42",
  head: { ref: "feature/x", sha: "abc123" },
  base: { ref: "main" },
};

// ─── trigger ──────────────────────────────────────────────────────────────────

describe("review.trigger", () => {
  beforeEach(() => {
    vi.mocked(resolveGitHubRepo).mockResolvedValue(mockResolvedRepo as never);
    vi.mocked(fetchPullRequest).mockResolvedValue(basePR as never);
    mockDb.review.create.mockResolvedValue({ id: "rev-1" });
    vi.mocked(inngest.send).mockResolvedValue(undefined as never);
  });

  it("creates a review with PENDING status and returns reviewId", async () => {
    const result = await caller.trigger({ repositoryId: "repo-1", prNumber: 42 });

    expect(mockDb.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          repositoryId: "repo-1",
          userId: "user-1",
          prNumber: 42,
          status: "PENDING",
        }),
      }),
    );
    expect(result).toEqual({ reviewId: "rev-1" });
  });

  it("sends an inngest event after creating the review", async () => {
    await caller.trigger({ repositoryId: "repo-1", prNumber: 42 });

    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "review/pr.requested",
        data: expect.objectContaining({
          reviewId: "rev-1",
          repositoryId: "repo-1",
          prNumber: 42,
          userId: "user-1",
        }),
      }),
    );
  });

  it("marks review as FAILED and throws INTERNAL_SERVER_ERROR when inngest.send fails", async () => {
    vi.mocked(inngest.send).mockRejectedValue(new Error("network error"));

    await expect(
      caller.trigger({ repositoryId: "repo-1", prNumber: 42 }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

    expect(mockDb.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rev-1" },
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.trigger({ repositoryId: "repo-1", prNumber: 42 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── get ──────────────────────────────────────────────────────────────────────

describe("review.get", () => {
  const mockReview = {
    id: "rev-1",
    userId: "user-1",
    status: "COMPLETED",
    repository: { id: "repo-1", fullName: "jaime/diffy" },
  };

  beforeEach(() => {
    mockDb.review.findUnique.mockResolvedValue(mockReview);
  });

  it("returns the review when found", async () => {
    const result = await caller.get({ id: "rev-1" });

    expect(result).toMatchObject({ id: "rev-1", status: "COMPLETED" });
  });

  it("queries by id and userId", async () => {
    await caller.get({ id: "rev-1" });

    expect(mockDb.review.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rev-1", userId: "user-1" },
      }),
    );
  });

  it("throws NOT_FOUND when review does not exist", async () => {
    mockDb.review.findUnique.mockResolvedValue(null);

    await expect(caller.get({ id: "nonexistent" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(unauthCaller.get({ id: "rev-1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

// ─── list ─────────────────────────────────────────────────────────────────────

describe("review.list", () => {
  const mockReviews = [
    { id: "rev-1", status: "COMPLETED", repository: { id: "repo-1" } },
    { id: "rev-2", status: "PENDING", repository: { id: "repo-1" } },
  ];

  beforeEach(() => {
    mockDb.review.findMany.mockResolvedValue(mockReviews);
  });

  it("returns all reviews for the user when no repositoryId filter", async () => {
    const result = await caller.list({});

    expect(result).toHaveLength(2);
    expect(mockDb.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });

  it("filters by repositoryId when provided", async () => {
    await caller.list({ repositoryId: "repo-1" });

    expect(mockDb.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          repositoryId: "repo-1",
        }),
      }),
    );
  });

  it("defaults limit to 20", async () => {
    await caller.list({});

    expect(mockDb.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it("respects a custom limit", async () => {
    await caller.list({ limit: 5 });

    expect(mockDb.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(unauthCaller.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

// ─── postToGitHub ─────────────────────────────────────────────────────────────

describe("review.postToGitHub", () => {
  const mockReview = {
    id: "rev-1",
    userId: "user-1",
    status: "COMPLETED",
    repositoryId: "repo-1",
    prNumber: 42,
    comments: [
      {
        file: "src/index.ts",
        line: 10,
        severity: "error",
        category: "bug",
        message: "Null pointer risk",
        suggestion: "Add null check",
      },
    ],
    riskScore: 75,
    summary: "Overall risky PR",
    walkthrough: "Be careful with nulls",
    repository: { id: "repo-1", fullName: "jaime/diffy" },
  };

  const mockFiles = [
    { filename: "src/index.ts", patch: "@@ -1,10 +1,12 @@", sha: "sha-1" },
  ];

  beforeEach(() => {
    mockDb.review.findUnique.mockResolvedValue(mockReview);
    vi.mocked(resolveGitHubRepo).mockResolvedValue(mockResolvedRepo as never);
    vi.mocked(fetchPullRequest).mockResolvedValue(basePR as never);
    vi.mocked(fetchPullRequestFiles).mockResolvedValue(mockFiles as never);
    vi.mocked(buildLineToPositionMap).mockReturnValue(new Map([[10, 5]]));
    vi.mocked(postPullRequestReview).mockResolvedValue(undefined as never);
  });

  it("throws NOT_FOUND when review does not exist", async () => {
    mockDb.review.findUnique.mockResolvedValue(null);

    await expect(
      caller.postToGitHub({ reviewId: "nonexistent", selectedCommentIndices: [0] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws BAD_REQUEST when review is not COMPLETED", async () => {
    mockDb.review.findUnique.mockResolvedValue({ ...mockReview, status: "PENDING" });

    await expect(
      caller.postToGitHub({ reviewId: "rev-1", selectedCommentIndices: [0] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("calls postPullRequestReview and returns posted count", async () => {
    const result = await caller.postToGitHub({
      reviewId: "rev-1",
      selectedCommentIndices: [0],
    });

    expect(postPullRequestReview).toHaveBeenCalled();
    expect(result).toMatchObject({ posted: expect.any(Number) });
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.postToGitHub({ reviewId: "rev-1", selectedCommentIndices: [] }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── getLatestForPR ───────────────────────────────────────────────────────────

describe("review.getLatestForPR", () => {
  const mockReview = { id: "rev-1", status: "COMPLETED", prNumber: 42 };

  beforeEach(() => {
    mockDb.review.findFirst.mockResolvedValue(mockReview);
  });

  it("returns the latest review for the PR", async () => {
    const result = await caller.getLatestForPR({
      repositoryId: "repo-1",
      prNumber: 42,
    });

    expect(result).toMatchObject({ id: "rev-1", status: "COMPLETED" });
  });

  it("queries with correct repositoryId, prNumber, and userId", async () => {
    await caller.getLatestForPR({ repositoryId: "repo-1", prNumber: 42 });

    expect(mockDb.review.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          repositoryId: "repo-1",
          prNumber: 42,
          userId: "user-1",
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("returns null when no review exists", async () => {
    mockDb.review.findFirst.mockResolvedValue(null);

    const result = await caller.getLatestForPR({
      repositoryId: "repo-1",
      prNumber: 42,
    });

    expect(result).toBeNull();
  });

  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(
      unauthCaller.getLatestForPR({ repositoryId: "repo-1", prNumber: 42 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
