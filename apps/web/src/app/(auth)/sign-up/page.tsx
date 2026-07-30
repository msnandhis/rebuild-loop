import { redirect } from "next/navigation";

import { AuthForm } from "../../../components/auth/auth-form";
import { getSession } from "../../../lib/session";

export const metadata = {
  title: "Create account",
};

export default async function SignUpPage() {
  if (await getSession()) {
    redirect("/projects");
  }

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-[-0.035em]">
        Create an account
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-muted">
        No email verification required.
      </p>
      <AuthForm mode="sign-up" />
    </>
  );
}
