import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });

  // NOTE:
  // WakaTime API key biasanya dipakai via Basic Auth.
  // Tapi endpoint summaries/languages sering butuh OAuth; makanya kamu kena 401 sebelumnya.
  // Kita tetap return error detail biar jelas.
  const url = "https://wakatime.com/api/v1/users/current/summaries?range=last_7_days";

  try {
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

    const json = await response.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "Fetch failed", detail: String(e) });
  }
}
