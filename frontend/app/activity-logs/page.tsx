import type { Metadata } from "next";

import { AdminPageGate } from "@/features/auth/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Activity Logs | SCA Sitemap",
  description: "Review the immutable history of sitemap changes.",
};

export default function ActivityLogsPage() {
  return <AdminPageGate page="activity-logs" />;
}
