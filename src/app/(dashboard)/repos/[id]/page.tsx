import { Suspense } from "react";
import { RepositoryDetailView, RepositoryDetailSkeleton } from "@/features/repos/views/repository-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepositoryDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<RepositoryDetailSkeleton />}>
      <RepositoryDetailView id={id} />
    </Suspense>
  );
}
