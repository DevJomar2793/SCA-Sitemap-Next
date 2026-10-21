import type { SitemapPage } from "@/features/sitemap/types";

export type DashboardBreakdown = {
  label: string;
  count: number;
  percentage: number;
};

export type DashboardSummary = {
  totalPages: number;
  alphaCount: number;
  screenTypeCount: number;
  recentlyUpdatedCount: number;
  alphaBreakdown: DashboardBreakdown[];
  screenTypeBreakdown: DashboardBreakdown[];
  recentPages: SitemapPage[];
};

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function buildBreakdown(
  pages: SitemapPage[],
  selectValue: (page: SitemapPage) => string,
  formatLabel: (value: string) => string,
): DashboardBreakdown[] {
  const groups = new Map<string, { label: string; count: number }>();

  pages.forEach((page) => {
    const rawValue = selectValue(page).trim();
    const key = rawValue.toLocaleLowerCase();
    const current = groups.get(key);

    if (current) {
      current.count += 1;
      return;
    }

    groups.set(key, {
      label: formatLabel(rawValue || "Not provided"),
      count: 1,
    });
  });

  return [...groups.values()]
    .sort((left, right) =>
      right.count - left.count || left.label.localeCompare(right.label),
    )
    .map((group) => ({
      ...group,
      percentage:
        pages.length > 0 ? Math.round((group.count / pages.length) * 100) : 0,
    }));
}

export function deriveDashboardSummary(
  pages: SitemapPage[],
  now = new Date(),
): DashboardSummary {
  const recentThreshold = now.getTime() - RECENT_WINDOW_MS;
  const alphaBreakdown = buildBreakdown(
    pages,
    (page) => page.alpha,
    (value) => value.toUpperCase(),
  );
  const screenTypeBreakdown = buildBreakdown(
    pages,
    (page) => page.screen_type,
    (value) => value,
  );

  return {
    totalPages: pages.length,
    alphaCount: alphaBreakdown.length,
    screenTypeCount: screenTypeBreakdown.length,
    recentlyUpdatedCount: pages.filter(
      (page) => new Date(page.updated_at).getTime() >= recentThreshold,
    ).length,
    alphaBreakdown,
    screenTypeBreakdown,
    recentPages: [...pages]
      .sort(
        (left, right) =>
          new Date(right.updated_at).getTime() -
          new Date(left.updated_at).getTime(),
      )
      .slice(0, 5),
  };
}
