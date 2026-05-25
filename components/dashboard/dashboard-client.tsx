"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { SearchPanel } from "@/components/search/search-panel";
import { MatchesList } from "@/components/jobs/matches-list";
import type { FreelancerProfile } from "@/types/profile";

export function DashboardClient({ initialProfile }: { initialProfile: FreelancerProfile | null }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
      <aside className="space-y-6">
        <ProfileForm initialProfile={initialProfile} />
        <SearchPanel onComplete={() => setRefreshKey((key) => key + 1)} />
      </aside>
      <MatchesList refreshKey={refreshKey} />
    </div>
  );
}
