import { Suspense } from "react";
import { ReviewsView, ReviewsViewSkeleton } from "@/features/repos/views/reviews-view";

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsViewSkeleton />}>
      <ReviewsView />
    </Suspense>
  );
}
