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
 *  Helpers (date range)
 *  ======================= */
function getRangeFromQuery(range?: string | string[]) {
  const todayUTC = startOfDayUTC(new Date());
  const end = addDaysUTC(todayUTC, -1);
  let start = addDaysUTC(todayUTC, -7);

  if (range === "30D") {
    start = addDaysUTC(todayUTC, -30);
  } else if (range === "90D") {
    start = addDaysUTC(todayUTC, -90);
  } else if (range === "all") {
    start = new Date("2000-01-01"); // Effectively "all time" for queries
  }

  return { start, end };
}

/** =======================
 *  WakaTime (primary)
 *  ======================= */
async function getActiveDaysFromWakaTime(range?: string | string[]): Promise<number> {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) throw new Error("Missing WAKATIME_API_KEY");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const { start, end } = getRangeFromQuery(range);

  let url = "";
  if (range === "all") {
    url = `https://wakatime.com/api/v1/users/current/summaries?range=all_time`;
  } else {
    url = `https://wakatime.com/api/v1/users/current/summaries?start=${toISODate(start)}&end=${toISODate(end)}`;
  }

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
async function getActiveDaysFromGitHub(range?: string | string[]): Promise<number> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) throw new Error("Missing GITHUB_USERNAME");

  const token = process.env.GITHUB_TOKEN; // optional
  const { start, end } = getRangeFromQuery(range);

  if (range === "all") {
    // Get all years
    const yearsQuery = `query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }`;
    const yrRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ query: yearsQuery, variables: { login: username } }),
    });
    const yrJson = await yrRes.json();
    const years: number[] = yrJson.data?.user?.contributionsCollection?.contributionYears ?? [];

    // Fetch each year's active days
    const promises = years.map(year => {
      const from = `${year}-01-01T00:00:00Z`;
      const to = `${year}-12-31T23:59:59Z`;
      const q = `
        query($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `;
      return fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: q, variables: { login: username, from, to } }),
      }).then(r => r.json());
    });

    const results = await Promise.all(promises);
    let totalActiveDays = 0;
    results.forEach(res => {
      const weeks = res.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
      const days = weeks.flatMap((w: any) => w.contributionDays ?? []);
      totalActiveDays += days.reduce((acc: number, d: any) => acc + (d.contributionCount > 0 ? 1 : 0), 0);
    });
    return totalActiveDays;
  }

  // Single range fetch
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
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

  const { range } = req.query;
  const { start, end } = getRangeFromQuery(range);

  let wDays = 0;
  let gDays = 0;
  let wakatimeError: string | null = null;
  let githubError: string | null = null;

  try {
    wDays = await getActiveDaysFromWakaTime(range);
  } catch (e) {
    wakatimeError = String(e);
  }

  try {
    gDays = await getActiveDaysFromGitHub(range);
  } catch (e) {
    githubError = String(e);
  }

  const codingDays = Math.max(wDays, gDays);
  let codingSource: "wakatime" | "github" | "none" = "none";
  if (codingDays > 0) {
    codingSource = wDays >= gDays ? "wakatime" : "github";
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
