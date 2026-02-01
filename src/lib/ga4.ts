import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * SECURE GA4 CLIENT CONFIGURATION
 * This file runs ONLY on the server.
 */

const propertyId = process.env.GOOGLE_GA4_PROPERTY_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function getAnalyticsClient() {
    if (!propertyId || !clientEmail || !privateKey) {
        const missing = [];
        if (!propertyId) missing.push('GOOGLE_GA4_PROPERTY_ID');
        if (!clientEmail) missing.push('GOOGLE_CLIENT_EMAIL');
        if (!privateKey) missing.push('GOOGLE_PRIVATE_KEY');

        throw new Error(`GA4 credentials missing: ${missing.join(', ')}. Please check your .env.local file.`);
    }

    return new BetaAnalyticsDataClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
    });
}

export async function runGa4Report(options: {
    dateRange: string;
    metrics: string[];
    dimensions?: string[];
}) {
    const client = getAnalyticsClient();
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: options.dateRange, endDate: 'today' }],
        dimensions: options.dimensions?.map(name => ({ name })),
        metrics: options.metrics.map(name => ({ name })),
    });
    return response;
}

/**
 * Normalizes GA4 response into a simpler structure
 */
export function normalizeRows(response: any) {
    const headers = response.dimensionHeaders?.map((h: any) => h.name) || [];
    const metrics = response.metricHeaders?.map((h: any) => h.name) || [];

    return response.rows?.map((row: any) => {
        const obj: any = {};
        row.dimensionValues.forEach((v: any, i: number) => {
            obj[headers[i]] = v.value;
        });
        row.metricValues.forEach((v: any, i: number) => {
            obj[metrics[i]] = isNaN(Number(v.value)) ? v.value : Number(v.value);
        });
        return obj;
    }) || [];
}
