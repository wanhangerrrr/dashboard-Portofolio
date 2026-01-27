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

  // Basic auth untuk Personal API Key: base64("API_KEY:") [web:430]
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const { start, end } = getLast7DaysFromYesterdayRange();

  // summaries endpoint pakai start & end (YYYY-MM-DD) [web:430]
  const url =
    `https://wakatime.com/api/v1/users/current/summaries` +
    `?start=${toISODate(start)}&end=${toISODate(end)}`;

  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) throw new Error(`WakaTime error ${r.status}`);

  const json = (await r.json()) as WakaTimeSummariesResponse;
  const days = json.data ?? [];

  // active day = ada coding time (total_seconds > 0)
  return days.reduce((acc, day) => {
    const seconds = day.grand_total?.total_seconds ?? 0;
    return acc + (seconds > 0 ? 1 : 0);
  }, 0);
}

/** =======================
 *  GitHub (fallback)
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

  // kalau token invalid, GitHub sering isi "errors"
  if (json.errors) throw new Error("GitHub GraphQL returned errors");

  const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days: GitHubContributionDay[] = weeks.flatMap((w) => w.contributionDays ?? []);

  return days.reduce((acc, d) => acc + (d.contributionCount > 0 ? 1 : 0), 0);
}

/** =======================
 *  API Handler
 *  ======================= */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = getLast7DaysFromYesterdayRange();

  try {
    const activeDays = await getActiveDaysFromWakaTime();
    if (activeDays === 0) throw new Error("WakaTime returned 0, fallback to GitHub");

    return res.status(200).json({
      source: "wakatime",
      range: { start: toISODate(start), end: toISODate(end) },
      activeDays,
    });
  } catch (e1) {
    try {
      const activeDays = await getActiveDaysFromGitHub();
      return res.status(200).json({
        source: "github",
        range: { start: toISODate(start), end: toISODate(end) },
        activeDays,
      });
    } catch (e2) {
      return res.status(200).json({
        source: "none",
        range: { start: toISODate(start), end: toISODate(end) },
        activeDays: 0,
        debug: {
          wakatimeError: String(e1),
          githubError: String(e2),
        },
      });
    }
  }
}

