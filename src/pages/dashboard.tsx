import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import PortfolioAnalyticsChart from "../components/PortfolioAnalyticsChart";
import GithubContributionsHeatmap from "../components/GithubContributionsHeatmap";
import WeeklySummary from "../components/WeeklySummary";
import TechStackActivity from "../components/TechStackActivity";
import LayoutShell from "../components/layout/LayoutShell";
import TopHeader from "../components/layout/TopHeader";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import DashboardCard from "../components/dashboard/DashboardCard";
import MetricCard from "../components/dashboard/MetricCard";
import TimeRangeSelector from "../components/dashboard/TimeRangeSelector";
import InsightList from "../components/dashboard/InsightList";
import DailyStatsGrid from "../components/dashboard/DailyStatsGrid";
import ProjectsList from "../components/dashboard/ProjectsList";
// import styles from "./dashboard.module.css";
import { generateInsights, Insight } from "../lib/InsightEngine";

type Point = { x: string; y: number };

type UmamiResponse = {
  range: { startAt: number; endAt: number };
  totals: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
  bounceRate: number;
  avgTimeSeconds: number;
  trend: {
    pageviews: Point[];
    sessions: Point[];
  };
};

type ActiveDaysApiResponse = {
  range: { start: string; end: string };
  coding: { source: "wakatime" | "github" | "none"; activeDays: number };
  traffic: { source: "umami"; activeDays: number } | null;
};

type WakaTimeSummary = {
  range: { startDate: string | null; endDate: string | null };
  total: { seconds: number };
  averageDaily: { seconds: number };
  bestDay: { date: string; seconds: number; digital: string } | null;
  topLanguages: { name: string; percent: number }[];
};

type GithubCalendar = {
  totalContributions: number;
  weeks: {
    contributionDays: {
      date: string;
      contributionCount: number;
      color: string;
    }[];
  }[];
};

type WakaTimeDaily = {
  data: {
    range: { date: string; start: string; end: string; text: string; timezone: string };
    grand_total: { hours: number; minutes: number; total_seconds: number; digital: string; text: string };
    categories: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    dependencies: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    editors: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    languages: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    machines: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    operating_systems: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
    projects: { name: string; total_seconds: number; percent: number; digital: string; text: string }[];
  }[];
  start: string;
  end: string;
  cumulative_total: { seconds: number; text: string; digital: string };
};

type WakaTimeProjects = {
  data: {
    name: string;
    total_seconds: number;
    percent: number;
    digital: string;
    text: string;
    color?: string;
  }[];
  total: number;
  total_pages: number;
};

type TopLanguages = { [key: string]: number };

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatHours(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0h";
  const hours = seconds / 3600;
  return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
}

function getTopLanguage(langs: TopLanguages): { name: string; percent: number } | null {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const sorted = Object.entries(langs).sort(([, a], [, b]) => b - a);
  const [name, bytes] = sorted[0];
  return { name, percent: (bytes / total) * 100 };
}

export default function DashboardPage() {
  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "all">("7D");

  // Data states
  const [umami, setUmami] = useState<UmamiResponse | null>(null);
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const [gh, setGh] = useState<GithubCalendar | null>(null);
  const [wakaSummary, setWakaSummary] = useState<WakaTimeSummary | null>(null);
  const [topLanguages, setTopLanguages] = useState<TopLanguages | null>(null);
  const [dailyData, setDailyData] = useState<WakaTimeDaily | null>(null);
  const [projectsData, setProjectsData] = useState<WakaTimeProjects | null>(null);
  const [gaSummary, setGaSummary] = useState<any>(null);


  // Fetch all API data
  useEffect(() => {
    async function safeFetch<T>(url: string, setter: (val: T) => void) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${url} failed`);
        const data = await r.json();
        setter(data);
      } catch (e) {
        console.error(e);
      }
    }

    const query = `?range=${timeRange}`;

    // Use a small delay to debounce rapid clicks if needed, 
    // but for now the useEffect dependency on [timeRange] is standard.
    // The key fix is in the API mapping and caching.

    safeFetch<UmamiResponse>(`/api/umami${query}`, (u) => setUmami(u));
    safeFetch<ActiveDaysApiResponse>(`/api/active-days${query}`, (a) => setActiveDays(a.coding.activeDays));
    safeFetch<GithubCalendar>(`/api/github-contributions${query}`, (g) => setGh(g));
    safeFetch<WakaTimeSummary>(`/api/wakatime-summary${query}`, (w) => setWakaSummary(w));
    safeFetch<TopLanguages>(`/api/top-languages${query}`, (l) => setTopLanguages(l));
    safeFetch<WakaTimeDaily>(`/api/wakatime-daily${query}`, (d) => setDailyData(d));
    safeFetch<WakaTimeProjects>(`/api/wakatime-projects${query}`, (p) => setProjectsData(p));
    safeFetch<any>(`/api/ga4/summary${query}`, (g) => setGaSummary(g));
  }, [timeRange]);

  // Polling for auto-update every 5 minutes
  useEffect(() => {
    async function pollFetch<T>(url: string, setter: (val: T) => void) {
      try {
        const r = await fetch(url);
        if (r.ok) setter(await r.json());
      } catch { }
    }

    const interval = setInterval(() => {
      const query = `?range=${timeRange}`;
      pollFetch<UmamiResponse>(`/api/umami${query}`, (u) => setUmami(u));
      pollFetch<WakaTimeSummary>(`/api/wakatime-summary${query}`, (w) => setWakaSummary(w));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [timeRange]);

  // DERIVED STATS
  const visitors = umami?.totals?.visitors ?? 0;
  const bounceRatePct = Math.round((umami?.bounceRate ?? 0) * 100);
  const avgTimeSec = Math.round(umami?.avgTimeSeconds ?? 0);
  const codingTime7d = formatHours(wakaSummary?.total?.seconds ?? 0);
  const topLang = topLanguages ? getTopLanguage(topLanguages) : null;
  const topLangLabel = topLang ? `${topLang.name} (${Math.round(topLang.percent)}%)` : "—";
  const pieData = topLanguages ? Object.entries(topLanguages).map(([name, bytes]) => ({ name, value: bytes })) : [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const insights: Insight[] = useMemo(() => {
    if (!umami || !wakaSummary?.total) return [];
    return generateInsights({
      pageviews: Array.isArray(umami.trend?.pageviews) ? umami.trend.pageviews : [],
      sessions: Array.isArray(umami.trend?.sessions) ? umami.trend.sessions : [],
      codingDays: activeDays ?? 0,
      totalCodingSeconds: wakaSummary.total.seconds ?? 0,
      timeRange: timeRange
    });
  }, [umami, wakaSummary, activeDays, timeRange]);

  // LOADING
  // Removed strict check on all APIs to allow partial data rendering
  if (!umami && activeDays === null && !wakaSummary) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30 font-sans">
        <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">I’m Hafiz</h1>
            <p className="text-xs text-zinc-500">
              Personal engineering dashboard & activity insights
            </p>
          </div>
        </header>

        <div className="pt-24 px-6 pb-12 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-zinc-500 font-medium animate-pulse">Loading guyss..</div>
          </div>
        </div>
      </main>
    );
  }

  // MAIN
  return (
    <LayoutShell>
      {/* <TopHeader> removed to use custom grid header */}

      <DashboardGrid>
        {/* ROW 1: HEADER SECTION (MATCHING TESLA STYLE) */}
        <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="md:hidden flex items-center gap-3">
                <img
                  src="/hafiz21.jpeg"
                  alt="Hafiz"
                  className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg"
                />
                Hafiz Reports
              </span>
              <span className="hidden md:inline">Laporan</span>
            </h2>
          </div>
          <TimeRangeSelector currentRange={timeRange} onRangeChange={setTimeRange} />
        </div>

        {/* ROW 2: PRIMARY GRID (LEFT KPIs + RIGHT CHART) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* LEFT: STACKED KPIs */}
          <div className="lg:col-span-1 grid grid-cols-1 gap-5">
            <MetricCard label="Pengunjung" value={visitors} trend="+12%" />
            <MetricCard label="Sesi" value={umami?.totals?.visits ?? 0} trend="+5%" />
            <MetricCard label="Hari Coding" value={activeDays ?? 0} trend="+2" />
          </div>

          {/* RIGHT: LARGE CHART */}
          <DashboardCard id="traffic" title="Aktivitas" className="lg:col-span-3">
            <div className="h-[430px]">
              <PortfolioAnalyticsChart
                pageviews={umami?.trend?.pageviews ?? []}
                sessions={umami?.trend?.sessions ?? []}
                codingData={dailyData?.data?.map(d => ({ x: d.range?.date, y: d.grand_total?.total_seconds ?? 0 })) ?? []}
              />
            </div>
          </DashboardCard>
        </div>

        {/* ROW 3: SECONDARY CONTENT */}
        <DashboardCard id="github" title="Kontribusi GitHub" className="lg:col-span-6">
          {gh ? (
            <GithubContributionsHeatmap
              totalContributions={gh.totalContributions}
              weeks={gh.weeks}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-500 font-medium">Loading GitHub…</div>
          )}
        </DashboardCard>

        <DashboardCard id="daily" title="Rincian Harian" className="lg:col-span-6">
          <DailyStatsGrid data={dailyData} />
        </DashboardCard>

        {/* ROW 4: PROJECTS, LANGUAGES & TECH */}
        <DashboardCard id="projects" title="Proyek Teratas" className="lg:col-span-6">
          <ProjectsList data={projectsData} />
        </DashboardCard>

        <DashboardCard id="languages" title="Bahasa Teratas" className="lg:col-span-3">
          {topLanguages ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => (percent ?? 0) > 0.1 ? `${name}` : ""}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{topLangLabel}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-500 font-medium">Loading Languages…</div>
          )}
        </DashboardCard>

        <DashboardCard id="tech" className="lg:col-span-3">
          <TechStackActivity languages={wakaSummary?.topLanguages ?? []} />
        </DashboardCard>

        {/* ROW 5: INSIGHTS & WEEKLY */}
        <DashboardCard id="kpi-summary" title="KPI Ringkasan" className="lg:col-span-4 max-h-[500px] overflow-y-auto scrollbar-hide">
          <InsightList insights={insights} />
          {gaSummary && (
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">Real-time</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Aktif</p>
                  <p className="text-xl font-black text-white">{gaSummary.activeUsers || 0}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Views</p>
                  <p className="text-xl font-black text-white">{gaSummary.screenPageViews || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard id="weekly" title="Ringkasan Mingguan" className="lg:col-span-8">
          <WeeklySummary
            totalSeconds={wakaSummary?.total?.seconds ?? 0}
            activeDays={activeDays ?? 0}
          />
        </DashboardCard>
      </DashboardGrid>


      {/* Footer / Context */}
      <footer className="p-8 pb-32 text-center text-zinc-600 border-t border-white/5">
        <p className="text-xs font-medium">© 2026 Muhammad Hafiz Fassya. All rights reserved.</p>
      </footer>
    </LayoutShell>
  );
}
