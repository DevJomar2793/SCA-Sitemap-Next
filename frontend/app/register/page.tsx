import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create Administrator Account | SCA Sitemap",
  description: "Create an administrator account for SCA Sitemap.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
