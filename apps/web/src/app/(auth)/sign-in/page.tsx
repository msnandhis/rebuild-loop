import { redirect } from "next/navigation";

import { AuthForm } from "../../../components/auth/auth-form";
import { getSession } from "../../../lib/session";

export const metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  if (await getSession()) {
    redirect("/projects");
  }

  return (
    <>
      <p className="font-mono text-xs font-medium tracking-[0.12em] text-action uppercase">
        Project workspace
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em]">
        Sign in to continue.
      </h1>
      <p className="mt-3 mb-7 leading-7 text-ink-muted">
        Open your project register and continue the next evidence or review
        action.
      </p>
      <AuthForm mode="sign-in" />
    </>
  );
}
