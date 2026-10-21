"use client";

import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { login, storeAuthenticatedSession } from "../api";
import { AuthFormField } from "./auth-form-field";
import { AuthPageShell } from "./auth-page-shell";

export function LoginForm({
  sessionExpired = false,
  registrationSuccessful = false,
}: {
  sessionExpired?: boolean;
  registrationSuccessful?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const session = await login({ email: normalizedEmail, password });
      storeAuthenticatedSession(session);
      router.replace("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      variant="hero"
      title="Administrator sign in"
      description="Use your administrator account to manage sitemap pages."
      footer={
        <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
          <p>
            Need an administrator account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Create account
            </Link>
          </p>
          <p>
            Need to find a screen?{" "}
            <Link
              href="/"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Open Screen Finder
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        {registrationSuccessful ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="size-4.5 shrink-0" aria-hidden="true" />
            Account created successfully. You can now sign in.
          </p>
        ) : null}
        {sessionExpired ? (
          <p
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800"
          >
            Your session expired. Please sign in again.
          </p>
        ) : null}
        <AuthFormField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoFocus
          required
          disabled={isSubmitting}
          placeholder="you@example.com"
          icon={<Mail className="size-4.5" aria-hidden="true" />}
        />
        <AuthFormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          icon={<LockKeyhole className="size-4.5" aria-hidden="true" />}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-sky-400 via-blue-500 to-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/35 transition hover:from-sky-300 hover:to-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          {!isSubmitting ? (
            <ArrowRight className="size-4" aria-hidden="true" />
          ) : null}
        </button>
      </form>
    </AuthPageShell>
  );
}
