import type { NextApiRequest, NextApiResponse } from 'next';
import { runGa4Report, normalizeRows } from '../../../lib/ga4';

// Simple in-memory cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        const { range = '7D' } = req.query;

        // Whitelist range mapping
        const dateRangeMap: Record<string, string> = {
            '7D': '7daysAgo',
            '30D': '30daysAgo',
            '90D': '90daysAgo',
            'all': '365daysAgo',
        };

        const gaStartDate = dateRangeMap[range as string] || '7daysAgo';

        // Check Cache
        const cacheKey = `summary-${gaStartDate}`;
        if (cache && (Date.now() - cache.timestamp < CACHE_DURATION)) {
            return res.status(200).json(cache.data);
        }

        const response = await runGa4Report({
            dateRange: gaStartDate,
            metrics: ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration'],
        });

        const data = normalizeRows(response)[0] || {};

        // Update Cache
        cache = { data, timestamp: Date.now() };

        return res.status(200).json(data);
    } catch (error: any) {
        console.error('GA4 API Error:', error);
        return res.status(500).json({ error: 'Failed to fetch GA4 data', detail: error.message });
    }
}
