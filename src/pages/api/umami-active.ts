import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).end();

    const apiKey = process.env.UMAMI_API_KEY; // Bearer token
    const websiteId = process.env.UMAMI_WEBSITE_ID;

    if (!apiKey) return res.status(500).json({ error: "Missing UMAMI_API_KEY" });
    if (!websiteId) return res.status(500).json({ error: "Missing UMAMI_WEBSITE_ID" });

    try {
        const url = `https://api.umami.is/v1/websites/${websiteId}/active`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Umami API error: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (e: any) {
        return res.status(500).json({ error: "Server error", detail: e.message });
    }
}
