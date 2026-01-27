import React, { useEffect, useState } from "react";
import PortfolioAnalyticsChart from "@/components/PortfolioAnalyticsChart";

type Point = { x: string; y: number };
type UmamiResponse = { pageviews: Point[]; sessions: Point[] };
type ActiveDaysResponse = { source: "wakatime" | "github" | "none"; activeDays: number };

export default function DashboardPage() {
  const [umami, setUmami] = useState<UmamiResponse | null>(null);
  const [activeDays, setActiveDays] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/umami").then((r) => r.json() as Promise<UmamiResponse>),
      fetch("/api/active-days").then((r) => r.json() as Promise<ActiveDaysResponse>),
    ])
      .then(([u, a]) => {
        setUmami(u);
        setActiveDays(a.activeDays);
      })
      .catch(() => {
        setUmami(null);
        setActiveDays(null);
      });
  }, []);

  if (!umami || activeDays === null) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <PortfolioAnalyticsChart
      pageviews={umami.pageviews}
      sessions={umami.sessions}
      activeCodingDays={activeDays}
      rangeLabel="Last 7 days (excluding today)"
    />
  );
}
