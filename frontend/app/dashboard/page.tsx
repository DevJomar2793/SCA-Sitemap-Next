import type { Metadata } from "next";

import { SitemapDashboard } from "@/features/sitemap/components/sitemap-dashboard";

export const metadata: Metadata = {
  title: "Sitemap Dashboard | SCA Sitemap",
  description: "Manage and maintain the SCA application sitemap.",
};

export default function DashboardPage() {
  return <SitemapDashboard />;
}
