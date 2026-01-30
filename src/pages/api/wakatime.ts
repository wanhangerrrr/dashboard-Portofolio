import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });

    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    // "This week" (WakaTime summaries)
    const url = "https://wakatime.com/api/v1/users/current/stats/last_7_days";

    const r = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "WakaTime request failed", detail: text });
    }

    const data = await r.json();

    // Kirim mentah dulu biar gampang debug
    return res.status(200).json(data);
  } catch (e: unknown) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
    }
}
