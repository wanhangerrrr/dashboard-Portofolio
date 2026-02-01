import type { NextApiRequest, NextApiResponse } from "next";

type UmamiStats = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};
type UmamiTrendPoint = { x: string; y: number };
type UmamiTrendResponse = {
  pageviews: UmamiTrendPoint[];
  sessions: UmamiTrendPoint[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.UMAMI_API_KEY; // Bearer token
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey) return res.status(500).json({ error: "Missing UMAMI_API_KEY" });
  if (!websiteId) return res.status(500).json({ error: "Missing UMAMI_WEBSITE_ID" });

  const { range } = req.query;
  const days = range === "30D" ? 30 : range === "90D" ? 90 : range === "all" ? 365 : 7;

  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;

  const base = `https://api.umami.is/v1/websites/${websiteId}`;
  const headers = { Authorization: `Bearer ${apiKey}` };

  // 1) Totals untuk KPI (pageviews/visits/visitors/bounces/totaltime)
  const statsUrl = `${base}/stats?startAt=${startAt}&endAt=${endAt}&timezone=Asia/Jakarta`;

  // 2) Trend untuk chart (pageviews per day)
  const pageviewsUrl =
    `${base}/pageviews?startAt=${startAt}&endAt=${endAt}` +
    `&unit=day&timezone=Asia/Jakarta`;

  const [statsRes, trendRes] = await Promise.all([
    fetch(statsUrl, { headers }),
    fetch(pageviewsUrl, { headers }),
  ]);

  const statsText = await statsRes.text();
  const trendText = await trendRes.text();

  const statsJson = JSON.parse(statsText) as UmamiStats;
  const totals = {
    pageviews: statsJson.pageviews ?? 0,
    visitors: statsJson.visitors ?? 0,
    visits: statsJson.visits ?? 0,
    bounces: statsJson.bounces ?? 0,
    totaltime: statsJson.totaltime ?? 0,
  };

  const bounceRate = totals.visits > 0 ? totals.bounces / totals.visits : 0;
  const avgTimeSeconds = totals.visits > 0 ? totals.totaltime / totals.visits : 0;

  const trendData = JSON.parse(trendText);
  let pageviews: UmamiTrendPoint[] = [];
  let sessionsDaily: UmamiTrendPoint[] = [];

  if (Array.isArray(trendData)) {
    pageviews = trendData;
  } else if (trendData && typeof trendData === "object") {
    pageviews = trendData.pageviews || [];
    sessionsDaily = trendData.sessions || [];
  }

  return res.status(200).json({
    range: { startAt, endAt },
    totals,
    bounceRate,
    avgTimeSeconds,
    trend: { pageviews, sessions: sessionsDaily },
  });
}
