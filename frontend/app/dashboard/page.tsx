import type { Metadata } from "next";

import { AdminPageGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Dashboard | SCA Sitemap",
  description: "Review SCA sitemap activity and catalogue coverage.",
};

export default function DashboardPage() {
  return <AdminPageGate page="dashboard" />;
}
