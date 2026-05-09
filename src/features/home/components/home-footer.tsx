import Link from "next/link";
import { SiGithub } from "react-icons/si";

export function HomeFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Diffy</span>
        <Link
          href="https://github.com/jaimenguyen168/next-diffy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors flex items-center gap-3 "
        >
          <SiGithub className="h-4 w-4" />
          Source code
        </Link>
      </div>
    </footer>
  );
}
