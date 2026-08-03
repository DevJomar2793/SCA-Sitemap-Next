import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Administrator Sign In | SCA Sitemap",
  description: "Sign in to manage SCA sitemap pages.",
};

export default function LoginPage() {
  return <LoginForm />;
}
