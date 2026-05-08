import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fetchGitHubRepos, getGitHubAccessToken } from "@/trpc/services/github";

async function fetchOpenPRCount(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<number> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );
  if (!response.ok) return 0;
  // Use the Link header to get the total count if paginated,
  // otherwise just count the items returned
  const link = response.headers.get("link");
  if (link) {
    const match = link.match(/page=(\d+)>; rel="last"/);
    if (match) return parseInt(match[1], 10);
  }
  const data = (await response.json()) as unknown[];
  return data.length;
}

export const repositoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const repos = await ctx.db.repository.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    const accessToken = await getGitHubAccessToken(ctx.user.id);
    if (!accessToken) return repos.map((r) => ({ ...r, openPRCount: 0 }));

    const counts = await Promise.allSettled(
      repos.map(async (repo) => {
        const [owner, name] = repo.fullName.split("/");
        if (!owner || !name) return 0;
        return fetchOpenPRCount(accessToken, owner, name);
      }),
    );

    return repos.map((repo, i) => ({
      ...repo,
      openPRCount: counts[i]?.status === "fulfilled" ? counts[i].value : 0,
    }));
  }),

  fetchFromGithub: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = await getGitHubAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "User has not authorized GitHub access",
      });
    }

    const repos = await fetchGitHubRepos(accessToken);
    return repos.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      htmlUrl: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    }));
  }),

  connect: protectedProcedure
    .input(
      z.object({
        repos: z.array(
          z.object({
            githubId: z.number(),
            name: z.string(),
            fullName: z.string(),
            private: z.boolean(),
            htmlUrl: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await Promise.all(
        input.repos.map((repo) =>
          ctx.db.repository.upsert({
            where: { githubId: repo.githubId },
            create: {
              userId: ctx.user.id,
              githubId: repo.githubId,
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
            },
            update: {
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              updatedAt: new Date(),
            },
          }),
        ),
      );
      return { connected: result.length };
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.repository.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
      return { success: true };
    }),
});
