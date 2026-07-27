import type { Metadata } from "next";

import { SitemapSearchPage } from "@/features/search/components/sitemap-search-page";

export const metadata: Metadata = {
  title: "Screen Finder | SCA Sitemap",
  description: "Find sitemap screens and their navigation instructions.",
};

export default function HomePage() {
  return <SitemapSearchPage />;
}
