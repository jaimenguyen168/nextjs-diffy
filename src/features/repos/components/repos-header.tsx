"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderGit2Icon, GitPullRequestIcon } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface HeaderProps {
  user: User;
}

const navItems = [
  {
    href: "/repos",
    label: "Repositories",
    icon: FolderGit2Icon,
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: GitPullRequestIcon,
  },
];

export function ReposHeader({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo />

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
