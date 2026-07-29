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
      <p className="font-mono text-xs font-medium tracking-[0.12em] text-action uppercase">
        Open registration
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em]">
        Create your project register.
      </h1>
      <p className="mt-3 mb-7 leading-7 text-ink-muted">
        No email verification is required. Your name is recorded with future
        project decisions.
      </p>
      <AuthForm mode="sign-up" />
    </>
  );
}
