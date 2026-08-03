"use client";

import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Map,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { getCurrentAdmin, login, register } from "@/features/sitemap/api";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void getCurrentAdmin()
      .then(() => {
        if (isCurrent) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [router]);

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
    return (
      <main className="grid min-h-screen place-items-center bg-[#2d78ce] px-5 text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-blue-50">
          <ShieldCheck className="size-5 animate-pulse" aria-hidden="true" />
          Checking your session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#2d78ce] px-5 py-10 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(111,181,246,0.46),transparent_36%),linear-gradient(145deg,#347fcf_0%,#2c75c9_52%,#2168bc_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 size-96 rounded-full bg-blue-950/15 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-[0_28px_70px_rgba(8,48,105,0.3)] sm:p-8">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2.5 rounded-xl text-blue-700 transition hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Map className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-tight">SCA Sitemap</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[28px]">
            Create administrator account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Register to access the sitemap administration dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <FormField
            id="full-name"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            autoFocus
            placeholder="Your full name"
            disabled={isSubmitting}
            icon={<UserRound className="size-4.5" aria-hidden="true" />}
          />
          <FormField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            icon={<Mail className="size-4.5" aria-hidden="true" />}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            hint="Use 12 to 128 characters."
            disabled={isSubmitting}
            icon={<LockKeyhole className="size-4.5" aria-hidden="true" />}
          />
          <FormField
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-600 hover:to-blue-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-900">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  hint?: string;
  disabled: boolean;
  icon: ReactNode;
};

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  autoFocus,
  placeholder,
  minLength,
  maxLength,
  hint,
  disabled,
  icon,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50"
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
