import type { NextApiRequest, NextApiResponse } from "next";

type WakaHeartbeat = {
    entity: string;
    type: string;
    category: string;
    project: string;
    language: string;
    is_write: boolean;
    editor: string;
    operating_system: string;
    machine: string;
    user_id: string;
    time: number;
    id: string;
};

const CACHE_TTL = 60 * 1000; // 1 minute
let cachedData: any = null;
let lastFetch = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).end();

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });
    }

    if (cachedData && Date.now() - lastFetch < CACHE_TTL) {
        return res.status(200).json(cachedData);
    }

    try {
        // Fetch heartbeats for today
        const response = await fetch("https://wakatime.com/api/v1/users/current/heartbeats?date=today", {
            headers: {
                Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
            },
        });

        if (!response.ok) {
            throw new Error(`WakaTime API error: ${response.status}`);
        }

        const json = await response.json();
        const heartbeats: WakaHeartbeat[] = json.data || [];

        if (heartbeats.length === 0) {
            const out = {
                isCoding: false,
                project: null,
                language: null,
                lastActive: null,
            };
            cachedData = out;
            lastFetch = Date.now();
            return res.status(200).json(out);
        }

        // Get the latest heartbeat
        const latest = heartbeats[heartbeats.length - 1];
        const now = Date.now() / 1000;
        const diff = now - latest.time;

        // If the last heartbeat was within the last 15 minutes, consider as "Coding"
        const isCoding = diff < 15 * 60;

        const out = {
            isCoding,
            project: latest.project !== "null" ? latest.project : null,
            language: latest.language !== "null" ? latest.language : null,
            lastActive: new Date(latest.time * 1000).toISOString(),
        };

        cachedData = out;
        lastFetch = Date.now();
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(500).json({ error: "Server error", detail: e.message });
    }
}
