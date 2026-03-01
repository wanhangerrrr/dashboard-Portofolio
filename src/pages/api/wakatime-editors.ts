import type { NextApiRequest, NextApiResponse } from "next";

type EditorData = {
    name: string;
    total_seconds: number;
    percent: number;
    digital: string;
    text: string;
};

type WakaTimeEditorsResponse = {
    data: EditorData[];
    total_seconds: number;
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

        const cacheKey = `editors-${wakaRange}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
            return res.status(200).json(cache[cacheKey].data);
        }

        const auth = Buffer.from(`${apiKey}:`).toString("base64");
        const url = `https://wakatime.com/api/v1/users/current/stats/${wakaRange}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Basic ${auth}`,
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
        const rawEditors = Array.isArray(json.data?.editors) ? json.data.editors : [];
        const totalSeconds = json.data?.total_seconds || 0;

        const editorsData: EditorData[] = rawEditors.map((ed: any) => ({
            name: ed.name,
            total_seconds: ed.total_seconds,
            percent: ed.percent,
            digital: ed.digital,
            text: ed.text,
        }));

        const result: WakaTimeEditorsResponse = {
            data: editorsData,
            total_seconds: totalSeconds,
        };

        cache[cacheKey] = { data: result, timestamp: Date.now() };
        return res.status(200).json(result);
    } catch (e: unknown) {
        return res.status(500).json({ error: "Server error", detail: String(e) });
    }
}
