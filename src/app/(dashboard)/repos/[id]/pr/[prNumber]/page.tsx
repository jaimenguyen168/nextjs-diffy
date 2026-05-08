import { Suspense } from "react";
import {
  PullRequestDetailView,
  PullRequestDetailSkeleton,
} from "@/features/repos/views/pull-request-detail-view";

type PageProps = {
  params: Promise<{ id: string; prNumber: string }>;
};

export default async function PullRequestDetailPage({ params }: PageProps) {
  const { id, prNumber } = await params;

  return (
    <Suspense fallback={<PullRequestDetailSkeleton />}>
      <PullRequestDetailView id={id} prNumber={parseInt(prNumber, 10)} />
    </Suspense>
  );
}
