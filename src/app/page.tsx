"use client";

import { useSession } from "next-auth/react";
import { Landing } from "@/components/landing";
import { Home } from "@/components/home";

export default function Page() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Landing />;
  }

  return <Home />;
}
