import type { Metadata } from "next";

import { AdminPageGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Account Permissions | SCA Sitemap",
  description: "Review and approve administrator accounts.",
};

export default function AccountPermissionsPage() {
  return <AdminPageGate page="account-permissions" />;
}
