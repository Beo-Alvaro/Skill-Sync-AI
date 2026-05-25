"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { SearchPanel } from "@/components/search/search-panel";
import { MatchesList } from "@/components/jobs/matches-list";
import type { FreelancerProfile } from "@/types/profile";

type DashboardClientProps = {
  initialProfile: FreelancerProfile | null;
  setupError?: string | null;
};

export function DashboardClient({ initialProfile, setupError }: DashboardClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {setupError ? (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">{setupError}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <ProfileForm initialProfile={initialProfile} />
          <SearchPanel onComplete={() => setRefreshKey((key) => key + 1)} />
        </aside>
        <MatchesList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
