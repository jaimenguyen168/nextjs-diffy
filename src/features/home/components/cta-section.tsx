"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function CtaSection() {
  const { data: session } = useSession();

  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Ready to improve your code reviews?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Start free. Upgrade when your team needs more.
        </p>
        <Button size="lg" className="mt-8" asChild>
          {session ? (
            <Link href="/repos">
              Repositories
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/sign-up">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </Button>
      </div>
    </section>
  );
}
