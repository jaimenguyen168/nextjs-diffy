import { GitMergeIcon, GitPullRequestIcon, ScanSearchIcon } from "lucide-react";

const STEPS = [
  {
    step: "1",
    icon: GitPullRequestIcon,
    title: "Connect GitHub",
    description: "Sign in and select repositories to enable.",
  },
  {
    step: "2",
    icon: ScanSearchIcon,
    title: "Open a PR",
    description: "Diffy triggers automatically on every pull request.",
  },
  {
    step: "3",
    icon: GitMergeIcon,
    title: "Merge with confidence",
    description: "Address suggestions and ship faster.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Up and running in minutes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Three steps to better code reviews.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
