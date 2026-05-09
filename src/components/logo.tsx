import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  href?: string;
}

export function Logo({ href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity"
    >
      <Image
        src="/logo.svg"
        alt="Diffy logo"
        width={24}
        height={24}
        className="dark:hidden"
      />
      <Image
        src="/logo-dark.svg"
        alt="Diffy logo"
        width={24}
        height={24}
        className="hidden dark:block"
      />
      Diffy
    </Link>
  );
}
