import {
  GitPullRequest,
  MessageSquare,
  ScanSearch,
  Shield,
  Wand2,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant feedback",
    description: "Get comprehensive reviews in seconds, not hours.",
  },
  {
    icon: Shield,
    title: "Security scanning",
    description: "Detect vulnerabilities and secrets automatically.",
  },
  {
    icon: MessageSquare,
    title: "Clear suggestions",
    description: "Actionable feedback you can apply immediately.",
  },
  {
    icon: GitPullRequest,
    title: "PR integration",
    description: "Reviews appear right in your pull requests.",
  },
  {
    icon: ScanSearch,
    title: "Context aware",
    description: "Understands your codebase patterns and style.",
  },
  {
    icon: Wand2,
    title: "Always improving",
    description: "Powered by the latest AI models.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Everything you need for better reviews
          </h2>
          <p className="mt-2 text-muted-foreground">
            Focus on building. Let AI handle the repetitive review work.
          </p>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-3 font-medium">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
