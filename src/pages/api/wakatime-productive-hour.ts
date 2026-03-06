import type { NextApiRequest, NextApiResponse } from "next";

type WakaDuration = {
    time: number;
    duration: number;
    project: string;
};

type HourlyDistribution = Record<number, number>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).end();

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing WAKATIME_API_KEY" });
    }

    try {
        // We fetch durations for the last 7 days to get a reliable average
        // WakaTime durations API: /users/current/durations?date=YYYY-MM-DD
        const days = 7;
        const distribution: HourlyDistribution = {};
        // Initialize 0-23 hours
        for (let i = 0; i < 24; i++) distribution[i] = 0;

        const fetchPromises = [];
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const url = `https://wakatime.com/api/v1/users/current/durations?date=${dateStr}`;

            fetchPromises.push(
                fetch(url, {
                    headers: {
                        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
                    },
                }).then(async r => {
                    if (!r.ok) return { data: [] };
                    return r.json();
                })
            );
        }

        const results = await Promise.all(fetchPromises);

        results.forEach(res => {
            const durations: WakaDuration[] = res.data || [];
            durations.forEach(d => {
                const hour = new Date(d.time * 1000).getHours();
                distribution[hour] += d.duration;
            });
        });

        // Find peak hour
        let peakHour = 0;
        let maxDuration = 0;
        for (let i = 0; i < 24; i++) {
            if (distribution[i] > maxDuration) {
                maxDuration = distribution[i];
                peakHour = i;
            }
        }

        // Determine Persona
        let persona = "Productive Developer";
        let icon = "🚀";
        if (peakHour >= 5 && peakHour < 9) {
            persona = "Early Bird";
            icon = "🌅";
        } else if (peakHour >= 9 && peakHour < 12) {
            persona = "Morning Focused";
            icon = "☕";
        } else if (peakHour >= 12 && peakHour < 17) {
            persona = "Deep Worker";
            icon = "👨‍💻";
        } else if (peakHour >= 17 && peakHour < 21) {
            persona = "Evening Coder";
            icon = "🏢";
        } else if (peakHour >= 21 || peakHour < 5) {
            persona = "Night Owl";
            icon = "🦉";
        }

        return res.status(200).json({
            peakHour,
            persona,
            icon,
            distribution: Object.values(distribution), // Array of 24 numbers
            totalSecondsAcrossWeek: Object.values(distribution).reduce((a, b) => a + b, 0)
        });
    } catch (e: any) {
        return res.status(500).json({ error: "Server error", detail: e.message });
    }
}
