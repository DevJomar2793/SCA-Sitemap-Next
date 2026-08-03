"use client";

import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { login, register } from "../api";
import { useRedirectIfAuthenticated } from "../hooks/use-redirect-if-authenticated";
import { AuthFormField } from "./auth-form-field";
import { AuthPageShell, AuthSessionLoading } from "./auth-page-shell";

const MINIMUM_PASSWORD_LENGTH = 12;
const MAXIMUM_PASSWORD_LENGTH = 128;

export function RegisterForm() {
  const router = useRouter();
  const isCheckingSession = useRedirectIfAuthenticated();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError("Complete all fields to create your account.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register({
        full_name: normalizedName,
        email: normalizedEmail,
        password,
      });
      await login({ email: normalizedEmail, password });
      router.replace("/dashboard");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return <AuthSessionLoading />;
  }

  return (
    <AuthPageShell
      title="Create administrator account"
      description="Register to access the sitemap administration dashboard."
      footer={
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-900">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <AuthFormField
          id="full-name"
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          autoFocus
          required
          disabled={isSubmitting}
          placeholder="Your full name"
          icon={<UserRound className="size-4.5" aria-hidden="true" />}
        />
        <AuthFormField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
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
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          minLength={MINIMUM_PASSWORD_LENGTH}
          maxLength={MAXIMUM_PASSWORD_LENGTH}
          hint="Use 12 to 128 characters."
          icon={<LockKeyhole className="size-4.5" aria-hidden="true" />}
        />
        <AuthFormField
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          minLength={MINIMUM_PASSWORD_LENGTH}
          maxLength={MAXIMUM_PASSWORD_LENGTH}
          icon={<LockKeyhole className="size-4.5" aria-hidden="true" />}
        />

        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-600 hover:to-blue-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
          {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
        </button>
      </form>
    </AuthPageShell>
  );
}
