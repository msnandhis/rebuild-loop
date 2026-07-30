"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";

type AuthMode = "sign-in" | "sign-up";
type AuthField = "confirm-password" | "email" | "name" | "password";

const DEMO_EMAIL = "nandy@rebuildloop.com";
const DEMO_PASSWORD = "nandy@rebuildloop.com";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthField, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const isSignUp = mode === "sign-up";
  const authPending = isSubmitting || isDemoSigningIn;

  async function handleDemoSignIn() {
    setError(null);
    setFieldErrors({});
    setIsDemoSigningIn(true);

    try {
      const result = await authClient.signIn.email({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        rememberMe: true,
      });

      if (result.error) {
        setError(
          result.error.status === 429
            ? "The demo account is temporarily rate-limited. Wait a minute, then try again."
            : "The demo workspace is temporarily unavailable. Try again shortly.",
        );
        return;
      }

      router.replace("/projects");
      router.refresh();
    } catch {
      setError("The demo workspace is temporarily unavailable. Try again.");
    } finally {
      setIsDemoSigningIn(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setFieldErrors({});
    const nextErrors: Partial<Record<AuthField, string>> = {};

    if (isSignUp && name.trim().length < 2) {
      nextErrors.name =
        "Enter the name that should appear on project decisions.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length < 10) {
      nextErrors.password = "Use at least 10 characters for your password.";
    }

    if (isSignUp && password !== confirmPassword) {
      nextErrors["confirm-password"] =
        "The password confirmation does not match.";
    }

    const firstInvalidField = (
      ["name", "email", "password", "confirm-password"] as const
    ).find((field) => nextErrors[field]);

    if (firstInvalidField) {
      setFieldErrors(nextErrors);
      requestAnimationFrame(() => {
        const control = form.elements.namedItem(firstInvalidField);
        if (control instanceof HTMLElement) {
          control.focus();
        }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (result.error) {
          if (result.error.status === 429) {
            setError(
              "Too many registration attempts. Wait a few minutes, then try again.",
            );
            return;
          }
          setError(
            "We could not create the account. Check the details or try again shortly.",
          );
          return;
        }

        setRegistered(true);
        return;
      }

      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: true,
      });

      if (result.error) {
        if (result.error.status === 429) {
          setError("Too many sign-in attempts. Wait a minute, then try again.");
          return;
        }
        setError("The email or password is incorrect. Please try again.");
        return;
      }

      router.replace("/projects");
      router.refresh();
    } catch {
      setError(
        "The service is temporarily unavailable. Your entries are safe.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div aria-live="polite" className="border-t-4 border-verified pt-6">
        <p className="font-mono text-xs font-medium tracking-[0.12em] text-verified uppercase">
          Account created
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em]">
          Your project register is ready.
        </h2>
        <p className="mt-4 leading-7 text-ink-muted">
          Sign in with the email and password you just registered. Email
          verification is not required for this build.
        </p>
        <Link
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          href="/sign-in"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {isSignUp && (
        <FormField
          autoComplete="name"
          error={fieldErrors.name}
          label="Your name"
          maxLength={120}
          name="name"
          onChange={setName}
          required
          value={name}
        />
      )}

      <FormField
        autoComplete="email"
        error={fieldErrors.email}
        inputMode="email"
        label="Email address"
        name="email"
        onChange={setEmail}
        required
        type="email"
        value={email}
      />

      <div>
        <label
          className="mb-1.5 block text-sm font-semibold text-ink"
          htmlFor={`${mode}-password`}
        >
          Password <span className="text-action">*</span>
        </label>
        <div className="relative">
          <input
            aria-describedby={
              [
                isSignUp ? `${mode}-password-help` : null,
                fieldErrors.password ? `${mode}-password-error` : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={Boolean(fieldErrors.password)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="min-h-12 w-full rounded-md border border-rule-strong bg-paper px-3 pr-12 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-action focus:ring-2 focus:ring-focus/25"
            id={`${mode}-password`}
            maxLength={128}
            minLength={10}
            onChange={(event) => setPassword(event.target.value)}
            name="password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-0 right-0 inline-flex size-12 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={19} strokeWidth={1.75} />
            ) : (
              <Eye aria-hidden="true" size={19} strokeWidth={1.75} />
            )}
          </button>
        </div>
        {isSignUp && (
          <p
            className="mt-1.5 text-xs leading-5 text-ink-muted"
            id={`${mode}-password-help`}
          >
            Use 10–128 characters. Password recovery is not available in the
            hackathon build.
          </p>
        )}
        {fieldErrors.password && (
          <p
            className="mt-1.5 text-xs leading-5 text-blocked"
            id={`${mode}-password-error`}
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      {isSignUp && (
        <FormField
          autoComplete="new-password"
          error={fieldErrors["confirm-password"]}
          label="Confirm password"
          name="confirm-password"
          onChange={setConfirmPassword}
          required
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
        />
      )}

      {error && (
        <div
          className="border-l-4 border-blocked bg-blocked-wash px-4 py-3 text-sm leading-6 text-blocked"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-wait disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        disabled={authPending}
        type="submit"
      >
        {isSubmitting && (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
        )}
        {isSubmitting
          ? isSignUp
            ? "Creating account…"
            : "Signing in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </button>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-rule bg-paper px-5 text-sm font-semibold text-ink transition-colors hover:border-rule-strong hover:bg-paper-subtle disabled:cursor-wait disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        disabled={authPending}
        onClick={handleDemoSignIn}
        type="button"
      >
        {isDemoSigningIn && (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
        )}
        {isDemoSigningIn ? "Opening demo…" : "Open demo workspace"}
      </button>

      <p className="text-center text-sm leading-6 text-ink-muted">
        {isSignUp ? "Already registered?" : "New to ReBuild Loop?"}{" "}
        <Link
          className="font-semibold text-action underline decoration-action/30 underline-offset-4 hover:decoration-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          href={isSignUp ? "/sign-in" : "/sign-up"}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

interface FormFieldProps {
  autoComplete: string;
  error?: string | undefined;
  inputMode?: "email";
  label: string;
  maxLength?: number;
  name: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "email" | "password" | "text";
  value: string;
}

function FormField({
  autoComplete,
  error,
  inputMode,
  label,
  maxLength,
  name,
  onChange,
  required = false,
  type = "text",
  value,
}: FormFieldProps) {
  const id = `auth-${name}`;

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-semibold text-ink"
        htmlFor={id}
      >
        {label} {required && <span className="text-action">*</span>}
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="min-h-12 w-full rounded-md border border-rule-strong bg-paper px-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-action focus:ring-2 focus:ring-focus/25"
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      {error && (
        <p className="mt-1.5 text-xs leading-5 text-blocked" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
