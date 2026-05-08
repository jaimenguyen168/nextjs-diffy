import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { resolveGitHubRepo } from "../utils";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  postPullRequestReview,
  buildLineToPositionMap,
} from "@/trpc/services/github";
import { ReviewCommentSchema } from "@/trpc/services/ai";
import { inngest } from "@/inngest/client";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { repository, accessToken, owner, repo } = await resolveGitHubRepo(
        input.repositoryId,
        ctx.user.id,
      );

      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      const review = await ctx.db.review.create({
        data: {
          repositoryId: repository.id,
          userId: ctx.user.id,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          status: "PENDING",
        },
      });

      try {
        await inngest.send({
          name: "review/pr.requested",
          data: {
            reviewId: review.id,
            repositoryId: repository.id,
            prNumber: pr.number,
            userId: ctx.user.id,
          },
        });
      } catch (err) {
        await ctx.db.review.update({
          where: { id: review.id },
          data: {
            status: "FAILED",
            error: "Failed to queue review job. Please try again.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue review job. Please try again.",
        });
      }

      return { reviewId: review.id };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),

  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: { repository: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  postToGitHub: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        selectedCommentIndices: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      if (review.status !== "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Review is not completed" });
      }

      const allComments = ReviewCommentSchema.array().parse(review.comments ?? []);
      const selectedComments = input.selectedCommentIndices.map((i) => allComments[i]).filter(Boolean);

      const { accessToken, owner, repo } = await resolveGitHubRepo(
        review.repositoryId,
        ctx.user.id,
      );

      const pr = await fetchPullRequest(accessToken, owner, repo, review.prNumber);
      const files = await fetchPullRequestFiles(accessToken, owner, repo, review.prNumber);

      // Build line -> diff position maps per file
      const positionMaps = new Map<string, Map<number, number>>();
      for (const file of files) {
        if (file.patch) {
          positionMaps.set(file.filename, buildLineToPositionMap(file.patch));
        }
      }

      const githubComments = selectedComments.flatMap((c) => {
        const posMap = positionMaps.get(c.file);
        if (!posMap) return [];
        const position = posMap.get(c.line);
        if (!position) return [];
        const body = [
          `**[${c.severity.toUpperCase()}]** ${c.category ? `\`${c.category}\`` : ""}`,
          "",
          c.message,
          ...(c.suggestion ? ["", "**Suggested fix:**", c.suggestion] : []),
        ].join("\n");
        return [{ path: c.file, position, body }];
      });

      const reviewBody = [
        `## AI Code Review`,
        "",
        ...(review.walkthrough ? [`> ${review.walkthrough}`, ""] : []),
        `**Risk Score:** ${review.riskScore}/100`,
        "",
        review.summary ?? "",
      ].join("\n");

      await postPullRequestReview(
        accessToken,
        owner,
        repo,
        review.prNumber,
        pr.head.sha,
        reviewBody,
        githubComments,
      );

      return { posted: githubComments.length };
    }),

  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          userId: ctx.user.id,
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
