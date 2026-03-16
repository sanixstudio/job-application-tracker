/**
 * Analytics helpers for application funnel, response rate, no-response tiers, and follow-up due.
 * Used by the dashboard and optional GET /api/analytics.
 */

const STALE_DAYS = 14;
const NO_RESPONSE_7_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface FunnelCounts {
  applied: number;
  interview_1: number;
  interview_2: number;
  interview_3: number;
  offer: number;
  rejected: number;
  withdrawn: number;
  total: number;
}

export interface AnalyticsResult {
  funnel: FunnelCounts;
  /** Percentage (0–100) of applications that reached at least one interview or offer. */
  responseRate: number;
  /** Count of applications still in "applied" with no response for 14+ days. */
  staleCount: number;
  /** Count of applications still in "applied" with no response for 7–14 days (consider follow-up). */
  noResponse7Count: number;
  /** Count of applications with followUpAt set and due today or overdue. */
  followUpDueCount: number;
  /** Count of applications in interview stages (interview_1/2/3) this week (by appliedDate or simple count). */
  interviewingCount: number;
}

/**
 * Compute funnel counts from a list of statuses.
 */
export function funnelFromStatuses(statuses: string[]): FunnelCounts {
  const byStatus = statuses.reduce(
    (acc, s) => {
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const total = statuses.length;
  return {
    applied: byStatus["applied"] ?? 0,
    interview_1: byStatus["interview_1"] ?? 0,
    interview_2: byStatus["interview_2"] ?? 0,
    interview_3: byStatus["interview_3"] ?? 0,
    offer: byStatus["offer"] ?? 0,
    rejected: byStatus["rejected"] ?? 0,
    withdrawn: byStatus["withdrawn"] ?? 0,
    total,
  };
}

/**
 * Compute response rate: (interview_1 + interview_2 + interview_3 + offer) / total * 100.
 * Returns 0 when total is 0.
 */
export function responseRateFromFunnel(funnel: FunnelCounts): number {
  if (funnel.total === 0) return 0;
  const responded =
    funnel.interview_1 +
    funnel.interview_2 +
    funnel.interview_3 +
    funnel.offer;
  return Math.round((responded / funnel.total) * 1000) / 10;
}

/**
 * Count applications that are still "applied" and were applied more than STALE_DAYS ago.
 */
export function staleCountFromRows(
  rows: { status: string; appliedDate: Date }[]
): number {
  const cutoff = Date.now() - STALE_DAYS * MS_PER_DAY;
  return rows.filter(
    (r) =>
      r.status === "applied" && new Date(r.appliedDate).getTime() < cutoff
  ).length;
}

export interface AnalyticsRow {
  status: string;
  appliedDate: Date;
  followUpAt?: Date | null;
}

/**
 * Count applications still "applied" with no response for 7–14 days (consider follow-up).
 */
export function noResponse7CountFromRows(rows: AnalyticsRow[]): number {
  const now = Date.now();
  const cutoff7 = now - NO_RESPONSE_7_DAYS * MS_PER_DAY;
  const cutoff14 = now - STALE_DAYS * MS_PER_DAY;
  return rows.filter((r) => {
    if (r.status !== "applied") return false;
    const t = new Date(r.appliedDate).getTime();
    return t < cutoff7 && t >= cutoff14;
  }).length;
}

/**
 * Count applications with followUpAt set and due today or in the past.
 */
export function followUpDueCountFromRows(rows: AnalyticsRow[]): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  return rows.filter((r) => {
    if (!r.followUpAt) return false;
    return new Date(r.followUpAt).getTime() <= todayMs + MS_PER_DAY - 1;
  }).length;
}

/**
 * Count applications currently in any interview stage.
 */
export function interviewingCountFromRows(rows: AnalyticsRow[]): number {
  return rows.filter((r) =>
    ["interview_1", "interview_2", "interview_3"].includes(r.status)
  ).length;
}

/**
 * Build full analytics from raw rows (status, appliedDate, optional followUpAt).
 */
export function computeAnalytics(rows: AnalyticsRow[]): AnalyticsResult {
  const statuses = rows.map((r) => r.status);
  const funnel = funnelFromStatuses(statuses);
  const responseRate = responseRateFromFunnel(funnel);
  const staleCount = staleCountFromRows(rows);
  const noResponse7Count = noResponse7CountFromRows(rows);
  const followUpDueCount = followUpDueCountFromRows(rows);
  const interviewingCount = interviewingCountFromRows(rows);
  return {
    funnel,
    responseRate,
    staleCount,
    noResponse7Count,
    followUpDueCount,
    interviewingCount,
  };
}
