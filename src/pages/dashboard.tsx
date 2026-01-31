import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import PortfolioAnalyticsChart from "../components/PortfolioAnalyticsChart";
import GithubContributionsHeatmap from "../components/GithubContributionsHeatmap";
import styles from "./dashboard.module.css";

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

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        setSidebarCollapsed(true); // Default collapsed di mobile
      } else {
        setSidebarCollapsed(false); // Default expanded di desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data states
  const [umami, setUmami] = useState<UmamiResponse | null>(null);
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const [gh, setGh] = useState<GithubCalendar | null>(null);
  const [view, setView] = useState<"traffic" | "github" | "languages" | "kpi" | "daily" | "projects">("traffic");
  const [wakaSummary, setWakaSummary] = useState<WakaTimeSummary | null>(null);
  const [topLanguages, setTopLanguages] = useState<TopLanguages | null>(null);
  const [dailyData, setDailyData] = useState<WakaTimeDaily | null>(null);
  const [projectsData, setProjectsData] = useState<WakaTimeProjects | null>(null);


  // Fetch all API data
  useEffect(() => {
    Promise.all([
      fetch("/api/umami").then(async (r) => (await r.json()) as UmamiResponse),
      fetch("/api/active-days").then((r) => r.json() as Promise<ActiveDaysApiResponse>),
      fetch("/api/github-contributions").then((r) => r.json() as Promise<GithubCalendar>),
      fetch("/api/wakatime-summary").then((r) => r.json() as Promise<WakaTimeSummary>),
      fetch("/api/top-languages").then((r) => r.json()),
      fetch("/api/wakatime-daily").then((r) => r.json() as Promise<WakaTimeDaily>),
      fetch("/api/wakatime-projects").then((r) => r.json() as Promise<WakaTimeProjects>),
    ])
      .then(([u, a, g, w, langs, daily, projects]) => {
        setUmami(u);
        setActiveDays(a.coding.activeDays);
        setGh(g);
        setWakaSummary(w);
        setTopLanguages(langs);
        setDailyData(daily);
        setProjectsData(projects);
      })
      .catch(() => {
        setUmami(null);
        setActiveDays(null);
        setGh(null);
        setWakaSummary(null);
        setTopLanguages(null);
        setDailyData(null);
        setProjectsData(null);
      });
  }, []);

  // Polling for auto-update every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        fetch("/api/umami").then(async (r) => (await r.json()) as UmamiResponse),
        fetch("/api/active-days").then((r) => r.json() as Promise<ActiveDaysApiResponse>),
        fetch("/api/github-contributions").then((r) => r.json() as Promise<GithubCalendar>),
        fetch("/api/wakatime-summary").then((r) => r.json() as Promise<WakaTimeSummary>),
        fetch("/api/top-languages").then((r) => r.json()),
        fetch("/api/wakatime-daily").then((r) => r.json() as Promise<WakaTimeDaily>),
        fetch("/api/wakatime-projects").then((r) => r.json() as Promise<WakaTimeProjects>),
      ])
        .then(([u, a, g, w, langs, daily, projects]) => {
          setUmami(u);
          setActiveDays(a.coding.activeDays);
          setGh(g);
          setWakaSummary(w);
          setTopLanguages(langs);
          setDailyData(daily);
          setProjectsData(projects);
        })
        .catch(() => {
          // Silent fail for polling
        });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

 // LOADING
if (!umami || activeDays === null || !wakaSummary) {
  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <h1 className={styles.navbarTitle}>Hi, I’m Hafiz</h1>
          <p className={styles.navbarSubtitle}>
            Data Engineer — selected metrics from my personal projects.
          </p>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.loadingPanel}>Loading dashboard…</div>
        </div>
      </div>
    </main>
  );
}

// DERIVED STATS
const visitors = umami.totals.visitors ?? 0;
const bounceRatePct = Math.round((umami.bounceRate ?? 0) * 100);
const avgTimeSec = Math.round(umami.avgTimeSeconds ?? 0);
const codingTime7d = formatHours(wakaSummary.total.seconds);
const topLang = topLanguages ? getTopLanguage(topLanguages) : null;
const topLangLabel = topLang ? `${topLang.name} (${Math.round(topLang.percent)}%)` : "—";
const pieData = topLanguages ? Object.entries(topLanguages).map(([name, bytes]) => ({ name, value: bytes })) : [];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// MAIN
return (
  <>
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Dashboard</h2>
        <button
          className={`${styles.collapseButton} ${sidebarCollapsed ? styles.arrowRight : styles.arrowLeft}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
      </div>
      <nav className={styles.sidebarNav}>
        <button
          className={`${styles.navItem} ${view === "traffic" ? styles.active : ""}`}
          onClick={() => setView("traffic")}
        >
          <span className={styles.navIcon}>�</span>
          {!sidebarCollapsed && <span className={styles.navText}>Traffic Trend</span>}
        </button>
        <button
          className={`${styles.navItem} ${view === "github" ? styles.active : ""}`}
          onClick={() => setView("github")}
        >
          <span className={styles.navIcon}>⚡</span>
          {!sidebarCollapsed && <span className={styles.navText}>GitHub Contributions</span>}
        </button>
        <button
          className={`${styles.navItem} ${view === "languages" ? styles.active : ""}`}
          onClick={() => setView("languages")}
        >
          <span className={styles.navIcon}>⌨️</span>
          {!sidebarCollapsed && <span className={styles.navText}>Top Languages</span>}
        </button>
        <button
          className={`${styles.navItem} ${view === "kpi" ? styles.active : ""}`}
          onClick={() => setView("kpi")}
        >
          <span className={styles.navIcon}>📊</span>
          {!sidebarCollapsed && <span className={styles.navText}>KPI Summary</span>}
        </button>
        <button
          className={`${styles.navItem} ${view === "daily" ? styles.active : ""}`}
          onClick={() => setView("daily")}
        >
          <span className={styles.navIcon}>📅</span>
          {!sidebarCollapsed && <span className={styles.navText}>Daily Stats</span>}
        </button>
        <button
          className={`${styles.navItem} ${view === "projects" ? styles.active : ""}`}
          onClick={() => setView("projects")}
        >
          <span className={styles.navIcon}>📁</span>
          {!sidebarCollapsed && <span className={styles.navText}>Projects</span>}
        </button>
      </nav>
      <div className={styles.sidebarFooter}>
        <button
          type="button"
          className={styles.themeButton}
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {sidebarCollapsed ? (theme === "dark" ? "☀" : "🌙") : `Theme: ${theme}`}
        </button>
      </div>
    </aside>

    {/* Mobile Overlay */}
    {!sidebarCollapsed && window.innerWidth <= 900 && (
      <div
        className={styles.mobileOverlay}
        onClick={() => setSidebarCollapsed(true)}
      />
    )}

    <main className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <button
            className={styles.mobileMenuButton}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle menu"
          >
            {sidebarCollapsed ? "☰" : "✕"}
          </button>
          <div className={styles.navbarHeader}>
            <h1 className={styles.navbarTitle}>Hi, I’m Hafiz</h1>
            <p className={styles.navbarSubtitle}>
              Data Engineer — selected metrics from my personal projects.
            </p>
          </div>
        </div>
      </header>

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ""}`}>
      <div className={styles.container}>
        <section className={styles.main}>
          {view === "traffic" ? (
            <PortfolioAnalyticsChart
              pageviews={umami.trend.pageviews ?? []}
              sessions={umami.trend.sessions ?? []}
              activeCodingDays={activeDays ?? 0}
              codingTimeLabel={codingTime7d}
              rangeLabel="Last 7 days excluding today"
            />
          ) : view === "github" ? (
            gh ? (
              <GithubContributionsHeatmap
                totalContributions={gh.totalContributions}
                weeks={gh.weeks}
              />
            ) : (
              <div className={styles.loadingPanel}>Loading GitHub…</div>
            )
          ) : view === "languages" ? (
            topLanguages ? (
              <div className={styles.topLanguagesSection}>
                <h3>Top Languages</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.loadingPanel}>Loading Languages…</div>
            )
          ) : view === "kpi" ? (
            <div className={styles.kpiSection}>
              <h3>KPI Summary</h3>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <h4>Visitors</h4>
                  <div className={styles.kpiValue}>{visitors}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Visitors', value: visitors, fill: '#0088FE' },
                          { name: 'Target', value: Math.max(0, 1000 - visitors), fill: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        dataKey="value"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.kpiCard}>
                  <h4>Bounce Rate</h4>
                  <div className={styles.kpiValue}>{bounceRatePct}%</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bounce', value: bounceRatePct, fill: '#FF8042' },
                          { name: 'Stay', value: 100 - bounceRatePct, fill: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        dataKey="value"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.kpiCard}>
                  <h4>Avg Time</h4>
                  <div className={styles.kpiValue}>{formatDuration(avgTimeSec)}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Current', value: avgTimeSec, fill: '#00C49F' },
                          { name: 'Target', value: Math.max(0, 120 - avgTimeSec), fill: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        dataKey="value"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : view === "daily" ? (
            dailyData ? (
              <div className={styles.kpiSection}>
                <h3>Daily Coding Stats (Last 7 Days)</h3>
                <div className={styles.kpiGrid}>
                  {dailyData.data.map((day, index) => (
                    <div key={index} className={styles.kpiCard}>
                      <h4>{new Date(day.range.date).toLocaleDateString()}</h4>
                      <div className={styles.kpiValue}>{day.grand_total.digital}</div>
                      <p>Projects: {day.projects.length}</p>
                      <p>Languages: {day.languages.length}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.loadingPanel}>Loading Daily Stats…</div>
            )
          ) : view === "projects" ? (
            projectsData ? (
              <div className={styles.kpiSection}>
                <h3>Top Projects</h3>
                <div className={styles.kpiGrid}>
                  {projectsData.data.slice(0, 8).map((project, index) => (
                    <div key={index} className={styles.kpiCard}>
                      <h4>{project.name}</h4>
                      <div className={styles.kpiValue}>{project.digital}</div>
                      <p>{project.percent.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.loadingPanel}>Loading Projects…</div>
            )
          ) : null}
        </section>
      </div>
    </div>
  </main>
  </>
);
}