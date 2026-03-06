import type { NextApiRequest, NextApiResponse } from "next";

type WakaTimeAllTimeResponse = {
    data: {
        total_seconds: number;
        text: string;
        digital: string;
        decimal: string;
        is_up_to_date: boolean;
        percent_calculated: number;
        range: {
            start_date: string;
            start_text: string;
            end_date: string;
            end_text: string;
        };
        timeout: number;
    };
};

const cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let globalCache: { data: any; timestamp: number } | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).end();

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });

    // Simple in-memory cache
    if (globalCache && Date.now() - globalCache.timestamp < CACHE_TTL) {
        return res.status(200).json(globalCache.data);
    }

    try {
        const url = "https://wakatime.com/api/v1/users/current/all_time_since_today";
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

        const json: WakaTimeAllTimeResponse = await response.json();
        const data = json.data;

        // Calculate daily average
        const startDate = new Date(data.range.start_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const averageDailySeconds = data.total_seconds / diffDays;

        const result = {
            total_seconds: data.total_seconds,
            text: data.text,
            digital: data.digital,
            decimal: data.decimal,
            average_daily_seconds: averageDailySeconds,
            start_date: data.range.start_date,
        };

        globalCache = { data: result, timestamp: Date.now() };

        return res.status(200).json(result);
    } catch (e: unknown) {
        return res.status(500).json({ error: "Server error", detail: String(e) });
    }
}
