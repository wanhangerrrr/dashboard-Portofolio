import type { NextApiRequest, NextApiResponse } from "next";

/** =======================
 *  Helpers (date range)
 *  ======================= */
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfDayUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

/**
 * 7 hari terakhir mulai dari kemarin:
 * start = hari ini - 7 (00:00 UTC)
 * end   = kemarin (00:00 UTC)
 */
function getLast7DaysFromYesterdayRange() {
  const todayUTC = startOfDayUTC(new Date());
  const end = addDaysUTC(todayUTC, -1);
  const start = addDaysUTC(todayUTC, -7);
  return { start, end };
}

/** =======================
 *  Types (minimal)
 *  ======================= */
type WakaTimeSummaryDay = {
  grand_total?: { total_seconds?: number };
  range?: { date?: string };
};

type WakaTimeSummariesResponse = {
  data?: WakaTimeSummaryDay[];
};

type GitHubContributionDay = {
  date: string;
  contributionCount: number;
};

type GitHubWeek = {
  contributionDays?: GitHubContributionDay[];
};

type GitHubGraphQLResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: GitHubWeek[];
        };
      };
    };
  };
  errors?: unknown;
};

/** =======================
 *  WakaTime (primary)
 *  ======================= */
async function getActiveDaysFromWakaTime(): Promise<number> {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) throw new Error("Missing WAKATIME_API_KEY");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const { start, end } = getLast7DaysFromYesterdayRange();

  const url =
    `https://wakatime.com/api/v1/users/current/summaries` +
    `?start=${toISODate(start)}&end=${toISODate(end)}`;

  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) throw new Error(`WakaTime error ${r.status}`);

  const json = (await r.json()) as WakaTimeSummariesResponse;
  const days = json.data ?? [];

  return days.reduce((acc, day) => {
    const seconds = day.grand_total?.total_seconds ?? 0;
    return acc + (seconds > 0 ? 1 : 0);
  }, 0);
}

/** =======================
 *  GitHub
 *  ======================= */
async function getActiveDaysFromGitHub(): Promise<number> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) throw new Error("Missing GITHUB_USERNAME");

  const token = process.env.GITHUB_TOKEN; // optional
  const { start, end } = getLast7DaysFromYesterdayRange();

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables: {
        login: username,
        from: start.toISOString(),
        to: end.toISOString(),
      },
    }),
  });

  if (!r.ok) throw new Error("GitHub error " + r.status);

  const json = (await r.json()) as GitHubGraphQLResponse;
  if (json.errors) throw new Error("GitHub GraphQL returned errors");

  const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days: GitHubContributionDay[] = weeks.flatMap((w) => w.contributionDays ?? []);

  return days.reduce((acc, d) => acc + (d.contributionCount > 0 ? 1 : 0), 0);
}

/** =======================
 *  Umami (traffic days)
 *  ======================= */
type SeriesPoint = { x: string | number; y: number };
type UmamiPageviewsResponse = { pageviews: SeriesPoint[]; sessions: SeriesPoint[] };

export async function getActiveDaysFromUmami(start: Date, end: Date): Promise<number> {
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY;

  if (!websiteId) throw new Error("Missing UMAMI_WEBSITE_ID");
  if (!apiKey) throw new Error("Missing UMAMI_API_KEY");

  const startAt = start.getTime();
  const endAt = end.getTime();

  const url =
    `https://api.umami.is/v1/websites/${websiteId}/pageviews` +
    `?startAt=${startAt}&endAt=${endAt}&unit=day&timezone=Asia/Jakarta`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!r.ok) throw new Error(`Umami error ${r.status}`);

  const data = (await r.json()) as UmamiPageviewsResponse;
  const series = Array.isArray(data?.pageviews) ? data.pageviews : [];

  return series.reduce((acc, p) => acc + (Number(p?.y) > 0 ? 1 : 0), 0);
}

/** =======================
 *  API Handler
 *  ======================= */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  res.setHeader("Cache-Control", "no-store");

  const { start, end } = getLast7DaysFromYesterdayRange();

  let codingDays = 0;
  let codingSource: "wakatime" | "github" | "none" = "none";
  let wakatimeError: string | null = null;
  let githubError: string | null = null;

  try {
    const w = await getActiveDaysFromWakaTime();
    if (w > 0) {
      codingDays = w;
      codingSource = "wakatime";
    } else {
      throw new Error("WakaTime returned 0");
    }
  } catch (e) {
    wakatimeError = String(e);
    try {
      const g = await getActiveDaysFromGitHub();
      codingDays = g;
      codingSource = "github";
    } catch (e2) {
      githubError = String(e2);
      codingDays = 0;
      codingSource = "none";
    }
  }

  let umamiDays: number | null = null;
  let umamiError: string | null = null;

  try {
    umamiDays = await getActiveDaysFromUmami(start, end);
  } catch (e) {
    umamiError = String(e);
    umamiDays = null;
  }

  return res.status(200).json({
    range: { start: toISODate(start), end: toISODate(end) },
    coding: { source: codingSource, activeDays: codingDays },
    traffic: { source: "umami", activeDays: umamiDays },
    debug: { wakatimeError, githubError, umamiError },
  });
}