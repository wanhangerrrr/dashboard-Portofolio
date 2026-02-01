import type { NextApiRequest, NextApiResponse } from "next";

type ProjectData = {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
};

type WakaTimeProjectsResponse = {
  data: ProjectData[];
  total: number;
  total_pages: number;
};

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });
  }

  try {
    const { range } = req.query;
    const wakaRange = range === "30D" ? "last_30_days" : range === "90D" ? "last_6_months" : range === "all" ? "all_time" : "last_7_days";

    const cacheKey = `projects-${wakaRange}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return res.status(200).json(cache[cacheKey].data);
    }

    // Use summaries endpoint which includes project breakdown
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

    const json = await response.json();
    const days = Array.isArray(json.data) ? json.data : [];

    // Aggregate project time across all days
    const projectMap = new Map<string, number>();

    for (const day of days) {
      const projects = Array.isArray(day?.projects) ? day.projects : [];
      for (const proj of projects) {
        if (proj?.name) {
          const existing = projectMap.get(proj.name) || 0;
          projectMap.set(proj.name, existing + (proj.total_seconds || 0));
        }
      }
    }

    // Calculate total and convert to array
    const totalSeconds = Array.from(projectMap.values()).reduce((a, b) => a + b, 0);

    const projectsData: ProjectData[] = Array.from(projectMap.entries())
      .map(([name, total_seconds]) => {
        const hours = Math.floor(total_seconds / 3600);
        const minutes = Math.floor((total_seconds % 3600) / 60);
        return {
          name,
          total_seconds,
          percent: totalSeconds > 0 ? (total_seconds / totalSeconds) * 100 : 0,
          digital: `${hours}h ${minutes}m`,
          text: `${hours} hrs ${minutes} mins`,
        };
      })
      .sort((a, b) => b.total_seconds - a.total_seconds);

    const result: WakaTimeProjectsResponse = {
      data: projectsData,
      total: projectsData.length,
      total_pages: 1,
    };

    cache[cacheKey] = { data: result, timestamp: Date.now() };
    return res.status(200).json(result);
  } catch (e: unknown) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
