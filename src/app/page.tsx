import { HealthCheck } from "@/components/health-check";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 ">
      <HealthCheck />
    </div>
  );
}
