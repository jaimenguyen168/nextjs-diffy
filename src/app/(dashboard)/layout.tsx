import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReposHeader } from "@/features/repos/components/repos-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen bg-background">
      <ReposHeader user={session.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
