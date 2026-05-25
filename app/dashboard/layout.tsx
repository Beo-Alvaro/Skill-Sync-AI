import { redirect } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { getCurrentUser } from "@/services/auth/auth.service";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">SkillSync AI</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
