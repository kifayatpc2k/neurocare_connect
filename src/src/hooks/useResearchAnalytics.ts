import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getResearchAnalytics } from "@/lib/analytics.functions";
import type { Analytics, AnalyticsFilters } from "@/lib/analytics";
import type { Dataset } from "@/lib/test-records";

export const ALL_FILTERS: AnalyticsFilters = { group: "all", status: "all", from: null, to: null };

export type AnalyticsResult = Analytics & { testRecordsExcluded: number; dataset: Dataset };

export function useResearchAnalytics(
  filters: AnalyticsFilters = ALL_FILTERS,
  activityLimit = 12,
  dataset: Dataset = "study",
) {
  const fetchAnalytics = useServerFn(getResearchAnalytics);
  return useQuery<AnalyticsResult>({
    queryKey: ["research-analytics", filters, activityLimit, dataset],
    queryFn: () => fetchAnalytics({ data: { ...filters, activityLimit, dataset } }),
    retry: false,
    refetchOnWindowFocus: true,
  });
}
