import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Administrator Sign In | SCA Sitemap",
  description: "Sign in to manage SCA sitemap pages.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; registered?: string }>;
}) {
  const { reason, registered } = await searchParams;
  const registrationStatus =
    registered === "approved" || registered === "pending"
      ? registered
      : undefined;
  return (
    <LoginForm
      sessionExpired={reason === "expired"}
      registrationStatus={registrationStatus}
    />
  );
}
