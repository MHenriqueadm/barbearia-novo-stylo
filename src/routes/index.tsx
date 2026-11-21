import { createFileRoute } from "@tanstack/react-router";
import { useAccessState } from "@/hooks/useAccessState";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { state, isLoading } = useAccessState();

  useEffect(() => {
    if (isLoading) return;

    if (state === "AUTHENTICATED_WITH_BARBERSHOP") {
      window.location.href = "/dashboard";
    } else if (state === "AUTHENTICATED_NO_BARBERSHOP") {
      window.location.href = "/onboarding";
    } else if (state === "UNAUTHENTICATED") {
      window.location.href = "/auth";
    }
  }, [state, isLoading]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex items-center gap-3" role="status" aria-label="Carregando">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    </main>
  );
}
