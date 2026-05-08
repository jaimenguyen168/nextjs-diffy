import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum(["bug", "security", "performance", "style", "suggestion"]),
  message: z.string(),
  suggestion: z.string().nullable(),
  isNitpick: z.boolean(),
});

export const FileSummarySchema = z.object({
  filename: z.string(),
  summary: z.string(),
  changeType: z.enum(["feature", "fix", "refactor", "test", "config", "docs", "style"]),
});

export const ReviewResultSchema = z.object({
  walkthrough: z.string(),
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  fileSummaries: z.array(FileSummarySchema),
  comments: z.array(ReviewCommentSchema),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type FileSummary = z.infer<typeof FileSummarySchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

const SYSTEM_PROMPT = `You are an expert code reviewer in the style of CodeRabbit. Analyze the provided pull request diff and produce a thorough, structured review.

Your review must include:

1. **Walkthrough** — A concise narrative (2-4 sentences) explaining what this PR does at a high level, why the changes were made, and what areas of the codebase are affected. Write it as if explaining to a teammate doing a quick scan.

2. **Summary** — A single sentence capturing the essence of the PR.

3. **File summaries** — For each changed file, one clear sentence describing what changed in that file and why. Include a changeType classification.

4. **Risk score** — 0-100 based on complexity, blast radius, and potential for bugs.

5. **Review comments** — Specific, actionable inline comments with exact line numbers. Each comment must have:
   - The exact file and line number from the diff
   - A clear explanation of the issue
   - A concrete suggestion for how to fix it
   - Whether it is a nitpick (isNitpick: true for style/minor preference issues, false for real bugs or risks)

Severity guide:
- critical: Security vulnerabilities, data loss, crashes, auth bypasses
- high: Bugs that will cause issues in production, data integrity problems
- medium: Issues that should be fixed but won't immediately break things
- low: Style issues, minor improvements, nitpicks

Rules to avoid false positives:
- Only flag an issue if you are highly confident it is a real problem visible in the diff
- Do not flag missing error handling if the surrounding framework (e.g. Inngest, tRPC, React Query) already handles retries or errors at a higher level
- Do not flag null/undefined checks if the code already has an explicit guard (early return, if-check) for that value earlier in the same function
- Do not flag unused imports or style issues unless they are clearly present in the diff
- Do not speculate about runtime behavior you cannot confirm from the code shown
- Prefer fewer, high-confidence comments over many speculative ones
- Mark style preferences and minor nits as isNitpick: true so the developer can filter them

Be precise. Reference exact line numbers from the diff.`;

export async function reviewCode(
  prTitle: string,
  files: FileChange[],
): Promise<ReviewResult> {
  const diffContent = files
    .filter((f) => f.patch)
    .map(
      (f) => `### ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n\`\`\`diff\n${f.patch}\n\`\`\``,
    )
    .join("\n\n");

  if (!diffContent.trim()) {
    return {
      walkthrough: "This PR contains no code changes (binary files or empty diff).",
      summary: "No code changes to review.",
      riskScore: 0,
      fileSummaries: [],
      comments: [],
    };
  }

  const fileList = files.map((f) => `- ${f.filename} (${f.status})`).join("\n");

  const { output } = await generateText({
    model: google("gemini-2.5-pro"),
    experimental_output: Output.object({ schema: ReviewResultSchema }),
    system: SYSTEM_PROMPT,
    prompt: `Review this pull request:\n\n**Title:** ${prTitle}\n\n**Files changed:**\n${fileList}\n\n**Diffs:**\n${diffContent}`,
    temperature: 0.2,
    maxOutputTokens: 8000,
  });

  return output;
}
