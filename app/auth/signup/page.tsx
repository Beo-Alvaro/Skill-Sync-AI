import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold text-primary">SkillSync AI</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your workspace</h1>
        </div>
        <AuthForm mode="signup" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
