import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });

  try {
    const { range } = req.query;
    const wakaRange = range === "30D" ? "last_30_days" : range === "90D" ? "last_6_months" : range === "all" ? "all_time" : "last_7_days";
    const url = `https://wakatime.com/api/v1/users/current/summaries?range=${wakaRange}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(response.status).json({
        error: "WakaTime API failed",
        status: response.status,
        detail,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e: unknown) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}