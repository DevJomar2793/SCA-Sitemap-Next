import type { Metadata } from "next";

import { DashboardGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Sitemap Dashboard | SCA Sitemap",
  description: "Manage and maintain the SCA application sitemap.",
};

export default function DashboardPage() {
  return <DashboardGate />;
}
