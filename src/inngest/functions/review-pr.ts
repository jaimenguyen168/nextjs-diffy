import { inngest } from "../client";
import { db } from "@/lib/db";
import { reviewCode } from "@/trpc/services/ai";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/trpc/services/github";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
  };
};

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    triggers: [{ event: "review/pr.requested" }],
  },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId } = event.data;

    await step.run("update-status-processing", async () => {
      await db.review.update({
        where: { id: reviewId },
        data: { status: "PROCESSING" },
      });
    });

    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
      });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: { status: "FAILED", error: "No repository found" },
        });
      });
      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "GitHub access token not found",
          },
        });
      });
      return { success: false, error: "GitHub access token not found" };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "Invalid repository name",
          },
        });
      });
      return { success: false, error: "Invalid repository name" };
    }

    try {
      const files = await step.run("fetch-pr-files", async () => {
        return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
      });

      const pr = await step.run("fetch-pr", async () => {
        try {
          return await fetchPullRequest(accessToken, owner, repo, prNumber);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to fetch PR #${prNumber}: ${message}`);
        }
      });

      const reviewResult = await step.run("generate-review", async () => {
        return reviewCode(
          pr.title,
          files.map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch,
          })),
        );
      });

      await step.run("save-review-result", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "COMPLETED",
            walkthrough: reviewResult.walkthrough,
            summary: reviewResult.summary,
            riskScore: reviewResult.riskScore,
            fileSummaries: reviewResult.fileSummaries,
            comments: reviewResult.comments,
          },
        });
      });
    } catch (err) {
      await db.review.update({
        where: { id: reviewId },
        data: {
          status: "FAILED",
          error:
            err instanceof Error ? err.message : "An unexpected error occurred",
        },
      });
      return { success: false, error: String(err) };
    }

    return { success: true, reviewId };
  },
);
