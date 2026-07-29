import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type AuthSession } from "./auth";

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}
