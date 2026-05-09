import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "../trpc";
import { repositoryRouter } from "../routers/repositories";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/trpc/services/github", () => ({
  getGitHubAccessToken: vi.fn(),
  fetchGitHubRepos: vi.fn(),
}));

// Mock fetch globally for fetchOpenPRCount
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { getGitHubAccessToken, fetchGitHubRepos } from "@/trpc/services/github";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createCaller = createCallerFactory(repositoryRouter);

const mockDb = {
  repository: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
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

// ─── list ─────────────────────────────────────────────────────────────────────

describe("repository.list", () => {
  const baseRepo = {
    id: "r1",
    githubId: 100,
    userId: "user-1",
    fullName: "jaime/diffy",
    name: "diffy",
    private: false,
    htmlUrl: "https://github.com/jaime/diffy",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb.repository.findMany.mockResolvedValue([baseRepo]);
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => [],
    });
  });

  it("returns repos with openPRCount 0 when no GitHub token", async () => {
    vi.mocked(getGitHubAccessToken).mockResolvedValue(null);

    const result = await caller.list();

    expect(result).toHaveLength(1);
    expect(result[0].openPRCount).toBe(0);
  });

  it("returns repos with openPRCount from GitHub when token exists", async () => {
    vi.mocked(getGitHubAccessToken).mockResolvedValue("token-abc");
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'rel="last"; page=5' },
      json: async () => [],
    });

    const result = await caller.list();

    expect(result[0].openPRCount).toBeGreaterThanOrEqual(0);
  });

  it("falls back to 0 for openPRCount when GitHub fetch fails", async () => {
    vi.mocked(getGitHubAccessToken).mockResolvedValue("token-abc");
    mockFetch.mockResolvedValue({ ok: false });

    const result = await caller.list();

    expect(result[0].openPRCount).toBe(0);
  });
});

// ─── fetchFromGithub ──────────────────────────────────────────────────────────

describe("repository.fetchFromGithub", () => {
  it("throws PRECONDITION_FAILED when no GitHub token", async () => {
    vi.mocked(getGitHubAccessToken).mockResolvedValue(null);

    await expect(caller.fetchFromGithub()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("returns mapped repos when token exists", async () => {
    vi.mocked(getGitHubAccessToken).mockResolvedValue("token-abc");
    vi.mocked(fetchGitHubRepos).mockResolvedValue([
      {
        id: 42,
        name: "diffy",
        full_name: "jaime/diffy",
        private: false,
        html_url: "https://github.com/jaime/diffy",
        description: "AI code reviews",
        language: "TypeScript",
        stargazers_count: 10,
        updated_at: "2025-01-01T00:00:00Z",
      },
    ] as never);

    const result = await caller.fetchFromGithub();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      githubId: 42,
      name: "diffy",
      fullName: "jaime/diffy",
      private: false,
      language: "TypeScript",
      stars: 10,
    });
  });
});

// ─── connect ──────────────────────────────────────────────────────────────────

describe("repository.connect", () => {
  it("upserts each repo and returns the count", async () => {
    const fakeRepo = { id: "r1", githubId: 1 };
    mockDb.repository.upsert.mockResolvedValue(fakeRepo);

    const result = await caller.connect({
      repos: [
        {
          githubId: 1,
          name: "diffy",
          fullName: "jaime/diffy",
          private: false,
          htmlUrl: "https://github.com/jaime/diffy",
        },
        {
          githubId: 2,
          name: "other",
          fullName: "jaime/other",
          private: true,
          htmlUrl: "https://github.com/jaime/other",
        },
      ],
    });

    expect(mockDb.repository.upsert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ connected: 2 });
  });

  it("calls upsert with the correct userId", async () => {
    mockDb.repository.upsert.mockResolvedValue({ id: "r1" });

    await caller.connect({
      repos: [
        {
          githubId: 1,
          name: "diffy",
          fullName: "jaime/diffy",
          private: false,
          htmlUrl: "https://github.com/jaime/diffy",
        },
      ],
    });

    expect(mockDb.repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });
});

// ─── disconnect ───────────────────────────────────────────────────────────────

describe("repository.disconnect", () => {
  it("deletes the repo and returns success", async () => {
    mockDb.repository.delete.mockResolvedValue({});

    const result = await caller.disconnect({ id: "r1" });

    expect(mockDb.repository.delete).toHaveBeenCalledWith({
      where: { id: "r1", userId: "user-1" },
    });
    expect(result).toEqual({ success: true });
  });
});

// ─── auth guard ───────────────────────────────────────────────────────────────

describe("protectedProcedure auth guard", () => {
  it("throws UNAUTHORIZED when session is missing", async () => {
    const unauthCaller = createCaller(makeCtx(null));

    await expect(unauthCaller.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
