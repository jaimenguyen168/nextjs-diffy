import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { getGitHubAccessToken } from "@/trpc/services/github";

export async function resolveGitHubRepo(repositoryId: string, userId: string) {
  const repository = await db.repository.findUnique({
    where: { id: repositoryId, userId },
  });

  if (!repository) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Repository not found",
    });
  }

  const accessToken = await getGitHubAccessToken(userId);
  if (!accessToken) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "GitHub account not connected",
    });
  }

  const [owner, repo] = repository.fullName.split("/");
  if (!owner || !repo) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid repository name",
    });
  }

  return { repository, accessToken, owner, repo };
}
