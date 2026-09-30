import type { Metadata } from "next";

import { AdminPageGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Create Administrator Account | SCA Sitemap",
  description: "Create an administrator account for SCA Sitemap.",
};

export default function RegisterPage() {
  return <AdminPageGate page="register" />;
}
