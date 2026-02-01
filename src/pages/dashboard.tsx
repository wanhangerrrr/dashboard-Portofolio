import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import PortfolioAnalyticsChart from "../components/PortfolioAnalyticsChart";
import GithubContributionsHeatmap from "../components/GithubContributionsHeatmap";
import WeeklySummary from "../components/WeeklySummary";
import TechStackActivity from "../components/TechStackActivity";
import ConsistencyMetrics from "../components/ConsistencyMetrics";
import styles from "./dashboard.module.css";
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

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true); // Default collapsed di mobile
      } else {
        setSidebarCollapsed(false); // Default expanded di desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarCollapsed]);

  const handleNavClick = (newView: typeof view) => {
    setView(newView);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "all">("7D");

  // Data states
  const [umami, setUmami] = useState<UmamiResponse | null>(null);
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const [gh, setGh] = useState<GithubCalendar | null>(null);
  const [view, setView] = useState<"traffic" | "github" | "languages" | "kpi" | "daily" | "projects" | "weekly" | "techstack" | "consistency">("traffic");
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
      <main className={styles.page}>
        <header className={styles.navbar}>
          <div className={styles.navbarContent}>
            <h1 className={styles.navbarTitle}>I’m Hafiz</h1>
            <p className={styles.navbarSubtitle}>
              Personal engineering dashboard & activity insights
            </p>
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.container}>
            <div className={styles.loadingPanel}>Loading guyss..</div>
          </div>
        </div>
      </main>
    );
  }

  // MAIN
  return (
    <div className={styles.dashboardLayout}>
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
            onClick={() => handleNavClick("traffic")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Traffic Trend</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "github" ? styles.active : ""}`}
            onClick={() => handleNavClick("github")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>GitHub Contributions</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "languages" ? styles.active : ""}`}
            onClick={() => handleNavClick("languages")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Top Languages</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "kpi" ? styles.active : ""}`}
            onClick={() => handleNavClick("kpi")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>KPI Summary</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "daily" ? styles.active : ""}`}
            onClick={() => handleNavClick("daily")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Daily Stats</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "projects" ? styles.active : ""}`}
            onClick={() => handleNavClick("projects")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Projects</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "weekly" ? styles.active : ""}`}
            onClick={() => handleNavClick("weekly")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Weekly Summary</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "techstack" ? styles.active : ""}`}
            onClick={() => handleNavClick("techstack")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Tech Stack</span>}
          </button>
          <button
            className={`${styles.navItem} ${view === "consistency" ? styles.active : ""}`}
            onClick={() => handleNavClick("consistency")}
          >
            <span className={styles.navIcon}></span>
            {!sidebarCollapsed && <span className={styles.navText}>Consistency</span>}
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
      {!sidebarCollapsed && isMobile && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <main className={styles.mainContent}>
        <header className={styles.navbar}>
          <div className={styles.navbarContent}>
            <button
              className={styles.mobileMenuButton}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle menu"
            >
              {sidebarCollapsed ? "☰" : "✕"}
            </button>

            <div className={styles.mobileTitle}>Dashboard ku</div>

            <div className={styles.navbarHeader}>
              <h1 className={styles.navbarTitle}>I’m Hafiz</h1>
              <p className={styles.navbarSubtitle}>
                Data Engineer — selected metrics from my personal projects.
              </p>
            </div>
          </div>
        </header>

        <div className={styles.container}>
          <div className={styles.contentGrid}>
            {view === "traffic" ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartHeaderWithSelector}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className={styles.sectionTitle}>Traffic Trend</h3>
                    <p className={styles.sectionDescription}>
                      Visualisasi jumlah kunjungan (Pageviews) dan sesi unik pengunjung dari waktu ke waktu. Gunakan toggle di kanan untuk mengganti rentang waktu.
                    </p>
                  </div>
                  <div className={styles.timeRangeSelector}>
                    {(["7D", "30D", "90D", "all"] as const).map((r) => (
                      <button
                        key={r}
                        className={`${styles.rangeButton} ${timeRange === r ? styles.rangeActive : ""}`}
                        onClick={() => setTimeRange(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <PortfolioAnalyticsChart
                  pageviews={umami?.trend?.pageviews ?? []}
                  sessions={umami?.trend?.sessions ?? []}
                  codingData={dailyData?.data?.map(d => ({ x: d.range?.date, y: d.grand_total?.total_seconds ?? 0 })) ?? []}
                  activeCodingDays={activeDays ?? 0}
                  codingTimeLabel={formatHours(wakaSummary?.total?.seconds ?? 0)}
                  rangeLabel={timeRange === '7D' ? "7 days" : timeRange === '30D' ? "30 days" : "Custom"}
                  events={[]}
                />
              </div>
            ) : view === "github" ? (
              gh ? (
                <div className={styles.chartContainer}>
                  <h3>GitHub Contributions</h3>
                  <GithubContributionsHeatmap
                    totalContributions={gh.totalContributions}
                    weeks={gh.weeks}
                  />
                </div>
              ) : (
                <div className={styles.loadingPanel}>Loading GitHub…</div>
              )
            ) : view === "languages" ? (
              topLanguages ? (
                <div className={styles.chartContainer}>
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
              <div className={styles.sectionWrapper}>
                <div className={styles.sectionHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className={styles.sectionTitle}>KPI Summary</h2>
                    <p className={styles.sectionDescription}>
                      Analisis performa website berdasarkan data Umami. Membantu memahami keterlibatan pengunjung dan efektivitas konten secara umum.
                    </p>
                  </div>
                </div>

                {insights.length > 0 && (
                  <div className={styles.insightsList}>
                    {insights.map((insight, i) => (
                      <div key={i} className={`${styles.insightCard} ${styles[insight.type]}`}>
                        <span className={styles.insightIcon}>
                          {insight.type === 'positive' ? '🚀' : insight.type === 'negative' ? '⚠️' : '💡'}
                        </span>
                        {insight.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.kpiGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTitle}>Visitors</div>
                    <div className={styles.statCardValue}>{visitors}</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Visitors', value: visitors, fill: '#0088FE' },
                            { name: 'Target', value: Math.max(0, 1000 - visitors), fill: '#E5E7EB' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          dataKey="value"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTitle}>Bounce Rate</div>
                    <div className={styles.statCardValue}>{bounceRatePct}%</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Bounce', value: bounceRatePct, fill: '#FF8042' },
                            { name: 'Stay', value: 100 - bounceRatePct, fill: '#E5E7EB' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          dataKey="value"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTitle}>Avg Time</div>
                    <div className={styles.statCardValue}>{formatDuration(avgTimeSec)}</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Current', value: avgTimeSec, fill: '#00C49F' },
                            { name: 'Target', value: Math.max(0, 120 - avgTimeSec), fill: '#E5E7EB' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          dataKey="value"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {gaSummary && (
                  <div className={styles.ga4Section} style={{ marginTop: '20px' }}>
                    <div className={styles.sectionHeader}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 className={styles.sectionTitle} style={{ fontSize: '1.25rem' }}>GA4 Real-time Insights</h3>
                        <p className={styles.sectionDescription}>
                          Data audiens dari Google Analytics 4. Digunakan untuk melacak pengguna aktif dan metrik sesi yang lebih mendalam secara real-time.
                        </p>
                      </div>
                    </div>
                    <div className={styles.kpiGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statCardTitle}>GA4 Active Users</div>
                        <div className={styles.statCardValue}>{gaSummary.activeUsers || 0}</div>
                        <div className={styles.statCardChips}>
                          <span className={styles.statCardChip}>Views: {gaSummary.screenPageViews || 0}</span>
                          <span className={styles.statCardChip}>Sessions: {gaSummary.sessions || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : view === "daily" ? (
              <div className={styles.sectionWrapper}>
                <div className={styles.sectionHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className={styles.sectionTitle}>Daily Coding Stats</h2>
                    <p className={styles.sectionDescription}>
                      Ringkasan durasi coding harian yang tercatat melalui WakaTime. Berguna untuk melacak tren dan konsistensi waktu produktif kamu.
                    </p>
                  </div>
                  <div className={styles.sectionActions}>
                    {/* Optional filter dropdown placeholder */}
                    <select className={styles.select}>
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                </div>
                {dailyData && dailyData.data && dailyData.data.length > 0 ? (
                  <div className={styles.statsGrid}>
                    {dailyData.data.map((day, index) => (
                      <div key={index} className={styles.statCard}>
                        <div className={styles.statCardTitle}>
                          {day?.range?.date ? new Date(day.range.date).toLocaleDateString() : 'Unknown'}
                        </div>
                        <div className={styles.statCardValue}>
                          {day?.grand_total?.digital || '0h'}
                        </div>
                        <div className={styles.statCardChips}>
                          <span className={styles.statCardChip}>
                            Projects: {day?.projects?.length || 0}
                          </span>
                          <span className={styles.statCardChip}>
                            Languages: {day?.languages?.length || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.loadingPanel}>Loading Daily Stats…</div>
                )}
              </div>
            ) : view === "projects" ? (
              <div className={styles.sectionWrapper}>
                <div className={styles.sectionHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className={styles.sectionTitle}>Top Projects</h2>
                    <p className={styles.sectionDescription}>
                      Daftar proyek yang paling banyak memakan waktu coding. Membantu melihat fokus pengembangan software saat ini.
                    </p>
                  </div>
                </div>
                {projectsData && projectsData.data && projectsData.data.length > 0 ? (
                  <div className={styles.projectsGrid}>
                    {projectsData.data.slice(0, 8).map((project, index) => {
                      const isTopProject = index === 0;
                      const isActive = (project?.total_seconds ?? 0) > 0;
                      return (
                        <div
                          key={index}
                          className={`${styles.projectCard} ${isTopProject ? styles.projectCardHighlight : ''}`}
                        >
                          <div className={styles.projectHeader}>
                            <div className={styles.projectName}>
                              {isTopProject && <span className={styles.topBadge}> Top</span>}
                              {project?.name || 'Unknown'}
                            </div>
                            <div className={`${styles.projectBadge} ${isActive ? '' : styles.badgeInactive}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          <div className={styles.projectHours}>{project?.digital || '0h'}</div>
                          <div className={styles.projectProgress}>
                            <div
                              className={styles.projectProgressBar}
                              style={{ width: `${project?.percent || 0}%` }}
                            ></div>
                          </div>
                          <div className={styles.projectSubtext}>
                            {project?.percent ? `${project.percent.toFixed(1)}% of total time` : 'No data'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <div className={styles.emptyMessage}>No Projects Found</div>
                    <div className={styles.emptyHint}>Start coding to see your top projects here.</div>
                  </div>
                )}
              </div>
            ) : view === "weekly" ? (
              <div className={styles.sectionWrapper}>
                <WeeklySummary
                  totalSeconds={wakaSummary?.total?.seconds ?? 0}
                  activeDays={activeDays ?? 0}
                />
              </div>
            ) : view === "techstack" ? (
              <div className={styles.sectionWrapper}>
                <TechStackActivity
                  languages={wakaSummary?.topLanguages ?? []}
                />
              </div>
            ) : view === "consistency" ? (
              <div className={styles.sectionWrapper}>
                <ConsistencyMetrics
                  dailyData={dailyData}
                />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}