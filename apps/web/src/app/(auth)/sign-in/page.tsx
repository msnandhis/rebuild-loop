import { redirect } from "next/navigation";

import { AuthForm } from "../../../components/auth/auth-form";
import { getSession } from "../../../lib/session";

export const metadata = {
  title: "Sign in",
};

interface SignInPageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [session, parameters] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/projects");
  }

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-[-0.035em]">
        Welcome back
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-muted">
        Sign in to your workspace.
      </p>
      <AuthForm autoDemo={parameters.demo === "1"} mode="sign-in" />
    </>
  );
}
