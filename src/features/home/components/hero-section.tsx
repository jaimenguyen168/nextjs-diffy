"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Ship better code,
          <br />
          <span className="text-gradient">faster</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-muted-foreground leading-relaxed">
          Automated code reviews that catch bugs, security issues, and
          maintainability problems before they reach production.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          {session ? (
            <Button size="lg" asChild>
              <Link href="/repos">
                Repositories
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start for free
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            GitHub integration
          </span>
          <span className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            Private repos supported
          </span>
        </div>
      </div>
    </section>
  );
}
