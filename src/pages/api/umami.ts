import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey) return res.status(500).json({ error: "Missing UMAMI_API_KEY" });
  if (!websiteId) return res.status(500).json({ error: "Missing UMAMI_WEBSITE_ID" });

  const endAt = Date.now();
  const startAt = endAt - 7 * 24 * 60 * 60 * 1000;

  const url =
    `https://api.umami.is/v1/websites/${websiteId}/pageviews` +
    `?startAt=${startAt}&endAt=${endAt}&unit=day&timezone=${encodeURIComponent("Asia/Jakarta")}`;

  const r = await fetch(url, { headers: { "x-umami-api-key": apiKey } });
  const data = await r.json();

  return res.status(r.status).json(data);
}
