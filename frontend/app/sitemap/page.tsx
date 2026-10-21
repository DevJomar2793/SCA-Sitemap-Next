import type { Metadata } from "next";

import { AdminPageGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Sitemap Pages | SCA Sitemap",
  description: "Manage and maintain the SCA application sitemap.",
};

export default function SitemapPage() {
  return <AdminPageGate page="sitemap" />;
}
