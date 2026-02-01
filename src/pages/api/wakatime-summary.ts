import type { NextApiRequest, NextApiResponse } from "next";

type WakaEmbedDay = {
  date?: string;
  range?: { start?: string; end?: string };
  grand_total?: { total_seconds?: number; digital?: string };
};

type WakaApiLanguage = {
  name: string;
  total_seconds: number;
  percent: number;
};

type WakaTimeSummary = {
  range: { startDate: string | null; endDate: string | null };
  total: { seconds: number };
  averageDaily: { seconds: number };
  bestDay: { date: string; seconds: number; digital: string } | null;
  topLanguages: { name: string; percent: number }[];
};

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const embedUrl = process.env.WAKATIME_EMBED_URL;
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!embedUrl && !apiKey) {
    return res.status(500).json({ error: "Missing WAKATIME_EMBED_URL or WAKATIME_API_KEY" });
  }

  try {
    const { range } = req.query;
    const wakaRange = range === "30D" ? "last_30_days" : range === "90D" ? "last_6_months" : range === "all" ? "all_time" : "last_7_days";
    const daysCount = range === "30D" ? 30 : range === "90D" ? 180 : range === "all" ? 365 : 7;

    const cacheKey = `summary-${wakaRange}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return res.status(200).json(cache[cacheKey].data);
    }

    let totalSeconds = 0;
    let startDate: string | null = null;
    let endDate: string | null = null;
    let best: { date: string; seconds: number; digital: string } | null = null;
    let topLanguages: { name: string; percent: number }[] = [];

    // Fetch from embed URL for basic stats
    if (embedUrl && range !== "30D" && range !== "90D" && range !== "all") {
      const r = await fetch(embedUrl);
      if (r.ok) {
        const json = await r.json();
        const days: WakaEmbedDay[] = Array.isArray(json.data) ? json.data : [];

        totalSeconds = days.reduce((sum, d) => sum + (d?.grand_total?.total_seconds ?? 0), 0);
        startDate = days[0]?.range?.start ?? null;
        endDate = days[days.length - 1]?.range?.end ?? null;

        // Best day
        for (const d of days) {
          const sec = d?.grand_total?.total_seconds ?? 0;
          if (sec <= 0) continue;

          const candidate = {
            date: d?.date ?? "",
            seconds: sec,
            digital: d?.grand_total?.digital ?? "",
          };

          if (!best || candidate.seconds > best.seconds) best = candidate;
        }
      }
    }

    // Fetch languages from API key (embed URL doesn't have languages data)
    if (apiKey) {
      const apiUrl = `https://wakatime.com/api/v1/users/current/summaries?range=${wakaRange}`;
      const apiResponse = await fetch(apiUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        },
      });

      if (apiResponse.ok) {
        const apiJson = await apiResponse.json();
        const days = Array.isArray(apiJson.data) ? apiJson.data : [];

        // Aggregate languages across all days
        const languageMap = new Map<string, number>();

        for (const day of days) {
          const languages = Array.isArray(day?.languages) ? day.languages : [];
          for (const lang of languages) {
            if (lang?.name) {
              const existing = languageMap.get(lang.name) || 0;
              languageMap.set(lang.name, existing + (lang.total_seconds || 0));
            }
          }
        }

        // Calculate percentages
        const totalLangSeconds = Array.from(languageMap.values()).reduce((a, b) => a + b, 0);

        topLanguages = Array.from(languageMap.entries())
          .map(([name, seconds]) => ({
            name,
            percent: totalLangSeconds > 0 ? (seconds / totalLangSeconds) * 100 : 0,
          }))
          .sort((a, b) => b.percent - a.percent)
          .slice(0, 6);

        // If we didn't get data from embed, use API data for totals
        if (totalSeconds === 0) {
          totalSeconds = days.reduce(
            (sum: number, d: { grand_total?: { total_seconds?: number } }) =>
              sum + (d?.grand_total?.total_seconds ?? 0),
            0
          );
        }
      }
    }

    // Average daily
    const averageDailySeconds = Math.round(totalSeconds / daysCount);

    const out: WakaTimeSummary = {
      range: { startDate, endDate },
      total: { seconds: totalSeconds },
      averageDaily: { seconds: averageDailySeconds },
      bestDay: best,
      topLanguages,
    };

    cache[cacheKey] = { data: out, timestamp: Date.now() };
    return res.status(200).json(out);
  } catch (e: unknown) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
