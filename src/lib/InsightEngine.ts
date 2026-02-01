export type Insight = {
    text: string;
    type: "positive" | "negative" | "neutral";
};

export function generateInsights(data: {
    pageviews: { x: string; y: number }[];
    sessions: { x: string; y: number }[];
    codingDays: number;
    totalCodingSeconds: number;
    timeRange: string;
}): Insight[] {
    const insights: Insight[] = [];

    // 1. Productivity Insight
    const avgCodingHours = (data.totalCodingSeconds / 3600) / (data.timeRange === '7D' ? 7 : 30);
    if (avgCodingHours > 2) {
        insights.push({
            text: `Highly productive ${data.timeRange} with an average of ${avgCodingHours.toFixed(1)}h daily coding.`,
            type: "positive"
        });
    }

    // 2. Traffic Insight
    const totalViews = data.pageviews.reduce((acc, p) => acc + p.y, 0);
    if (totalViews > 0) {
        const maxDay = [...data.pageviews].sort((a, b) => b.y - a.y)[0];
        insights.push({
            text: `Traffic peaked on ${new Date(maxDay.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} with ${maxDay.y} views.`,
            type: "neutral"
        });
    }

    // 3. Correlation Insight (Pseudo-example)
    if (data.codingDays > 5 && totalViews > 100) {
        insights.push({
            text: "Consistency in coding correlates with increased portfolio visibility.",
            type: "positive"
        });
    }

    return insights;
}
