import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/trpc/server/trpc";
import { repositoryRouter } from "@/trpc/server/routers/repositories";
import { pullRequestRouter } from "@/trpc/server/routers/pull-requests";
import { reviewRouter } from "@/trpc/server/routers/review";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamps: new Date() };
  }),
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
