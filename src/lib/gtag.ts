/**
 * GA4 Production-Safe Tracking Utility
 * 
 * Safety features:
 * 1. Missing ID Guard: No-op if measurement ID is absent.
 * 2. SSR Guard: Functions only execute on the client.
 * 3. Environment Guard: Disables tracking on localhost and non-production builds.
 * 4. Late Load Guard: Functions handle cases where window.gtag is not yet available.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// SSR Safe environment check
const isProduction =
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !window.location.hostname.includes('localhost');

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
    if (!GA_MEASUREMENT_ID || !isProduction || typeof window.gtag !== 'function') {
        return;
    }
    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
        // Note: send_page_view: false is set in the global script in _app.tsx to prevent double execution
    });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
    action: string;
    category: string;
    label: string;
    value?: number;
}) => {
    if (!GA_MEASUREMENT_ID || !isProduction || typeof window.gtag !== 'function') {
        return;
    }
    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    });
};

// Helper for type safety if needed in the window object
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}
