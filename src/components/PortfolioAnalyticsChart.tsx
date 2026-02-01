import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type Point = { x: string; y: number };

type Props = {
  pageviews: Point[];
  sessions: Point[];
  codingData?: Point[]; // New: Coding time trend
  activeCodingDays: number;
  codingTimeLabel?: string;
  rangeLabel?: string;
  variant?: "full" | "compact";
  events?: { date: string; label: string }[];
  // Optional previous period values for comparison
  previousPageviews?: number;
  previousSessions?: number;
  previousActiveDays?: number;
};

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function sumY(points?: Point[]) {
  if (!Array.isArray(points)) return 0;
  return points.reduce((acc, p) => acc + (Number.isFinite(p.y) ? p.y : 0), 0);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n);
}

function calculateTrend(current: number, previous?: number): { percent: number; direction: "up" | "down" | "neutral"; show: boolean } {
  if (previous === undefined || previous === 0) {
    return { percent: 0, direction: "neutral", show: false };
  }
  const change = ((current - previous) / previous) * 100;
  if (change > 0) return { percent: Math.round(change), direction: "up", show: true };
  if (change < 0) return { percent: Math.abs(Math.round(change)), direction: "down", show: true };
  return { percent: 0, direction: "neutral", show: true };
}

export default function PortfolioAnalyticsChart({
  pageviews,
  sessions,
  codingData,
  activeCodingDays,
  codingTimeLabel,
  rangeLabel = "Last 7 days",
  variant = "full",
  events,
  previousPageviews,
  previousSessions,
  previousActiveDays,
}: Props) {
  const isCompact = variant === "compact";
  const [showViews, setShowViews] = useState(true);
  const [showSessions, setShowSessions] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartHeight = isMobile ? 200 : (isCompact ? 220 : 320);
  const wrapPadding = isMobile ? 12 : (isCompact ? 16 : 24);
  const titleSize = isCompact ? 16 : 18;

  const totals = useMemo(() => {
    return {
      pageviews: sumY(pageviews),
      sessions: sumY(sessions),
    };
  }, [pageviews, sessions]);

  const chartData = useMemo(() => {
    const pvArr = Array.isArray(pageviews) ? pageviews : [];
    const ssArr = Array.isArray(sessions) ? sessions : [];
    const cdArr = Array.isArray(codingData) ? codingData : [];

    const normalizeDate = (d: string) => d?.split(' ')[0] || d;

    const pvMap = new Map(pvArr.map(p => [normalizeDate(p.x), p.y]));
    const ssMap = new Map(ssArr.map(p => [normalizeDate(p.x), p.y]));
    const cdMap = new Map(cdArr.map(p => [normalizeDate(p.x), p.y]));

    const dates = new Set([
      ...pvArr.map(p => normalizeDate(p.x)),
      ...ssArr.map(p => normalizeDate(p.x)),
      ...cdArr.map(p => normalizeDate(p.x))
    ]);

    return Array.from(dates).sort().map(iso => {
      return {
        iso,
        date: iso ? formatShortDate(iso) : "",
        pageviews: pvMap.get(iso) ?? 0,
        sessions: ssMap.get(iso) ?? 0,
        codingTime: cdMap.get(iso) ? Math.round((cdMap.get(iso) || 0) / 60) : 0, // minutes
      };
    });
  }, [pageviews, sessions, codingData]);

  const styles: Record<string, React.CSSProperties> = {
    wrap: {
      maxWidth: 980,
      margin: "0 auto",
      padding: wrapPadding,
      color: "var(--text-primary)",
      fontFamily: "var(--font-family, sans-serif)",
    },
    header: { marginBottom: isCompact ? 10 : 14 },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      flexWrap: "wrap",
    },
    title: { fontSize: titleSize, fontWeight: 700, margin: 0, color: "var(--text-primary)" },
    subtitle: { fontSize: 13, color: "var(--text-secondary)", margin: 0 },

    kpis: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
      gap: 12,
      marginTop: 14,
      marginBottom: isCompact ? 12 : 16,
    },
    kpiCard: {
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--border-radius)",
      padding: 14,
      boxShadow: "var(--shadow-soft)",
    },
    kpiLabel: { fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 },
    kpiValue: { fontSize: 20, fontWeight: 800, letterSpacing: -0.2, color: "var(--text-primary)" },
    kpiHint: { fontSize: 12, color: "var(--text-muted)", marginTop: 6 },
    kpiTrend: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 12,
      marginLeft: 6,
    },
    trendUp: {
      background: "rgba(16, 185, 129, 0.15)",
      color: "#10b981",
    },
    trendDown: {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#ef4444",
    },

    chartCard: {
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--border-radius)",
      padding: 16,
      boxShadow: "var(--shadow-soft)",
    },
    chartTop: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 16,
    },
    chartLabel: { fontSize: 14, color: "var(--text-primary)", fontWeight: 700 },
    chips: { display: "flex", gap: 8, flexWrap: "wrap" },
    chip: {
      borderRadius: 10,
      border: "1px solid var(--border-subtle)",
      background: "var(--bg-tertiary)",
      padding: "8px 12px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      userSelect: "none",
      display: "inline-flex",
      gap: 8,
      alignItems: "center",
      transition: "all 0.2s ease",
      outline: "none",
      color: "var(--text-primary)",
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      display: "inline-block",
    },
    footnote: { marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" },
  };

  const pageviewsColor = "#6366f1";
  const sessionsColor = "#10b981";
  const codingColor = "#f59e0b";

  // Calculate trends
  const pageviewsTrend = calculateTrend(totals.pageviews, previousPageviews);
  const sessionsTrend = calculateTrend(totals.sessions, previousSessions);
  const activeDaysTrend = calculateTrend(activeCodingDays, previousActiveDays);

  const renderTrend = (trend: ReturnType<typeof calculateTrend>) => {
    if (!trend.show) return null;
    const isUp = trend.direction === "up";
    const trendStyle = isUp ? styles.trendUp : styles.trendDown;
    const arrow = isUp ? "↑" : "↓";
    return (
      <span style={{ ...styles.kpiTrend, ...trendStyle }}>
        {arrow} {trend.percent}%
      </span>
    );
  };

  return (
    <section style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.kpis}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Jumlah Tampilan</div>
            <div style={styles.kpiValue}>
              {formatCompact(totals.pageviews)}
              {renderTrend(pageviewsTrend)}
            </div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Sesi Kunjungan</div>
            <div style={styles.kpiValue}>
              {formatCompact(totals.sessions)}
              {renderTrend(sessionsTrend)}
            </div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Hari Aktif Coding</div>
            <div style={styles.kpiValue}>
              {activeCodingDays}
              {renderTrend(activeDaysTrend)}
            </div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Waktu Coding</div>
            <div style={styles.kpiValue}>{codingTimeLabel ?? "—"}</div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>
        </div>
      </header>

      <div style={styles.chartCard}>
        <div style={styles.chartTop}>
          <div style={styles.chartLabel}>Traffic trend</div>

          <div style={styles.chips} aria-label="Series toggle">
            <button
              type="button"
              onClick={() => setShowViews((v) => !v)}
              style={{
                ...styles.chip,
                background: showViews ? "var(--bg-hover)" : "var(--bg-secondary)",
                borderColor: showViews ? pageviewsColor : "var(--border-subtle)",
                color: showViews ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: showViews ? `0 0 8px ${pageviewsColor}44` : "none",
              }}
              aria-pressed={showViews}
            >
              <span style={{ ...styles.dot, background: pageviewsColor, opacity: showViews ? 1 : 0.4 }} />
              Views
            </button>

            <button
              type="button"
              onClick={() => setShowSessions((v) => !v)}
              style={{
                ...styles.chip,
                background: showSessions ? "var(--bg-hover)" : "var(--bg-secondary)",
                borderColor: showSessions ? sessionsColor : "var(--border-subtle)",
                color: showSessions ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: showSessions ? `0 0 8px ${sessionsColor}44` : "none",
              }}
              aria-pressed={showSessions}
            >
              <span style={{ ...styles.dot, background: sessionsColor, opacity: showSessions ? 1 : 0.4 }} />
              Sessions
            </button>

            <button
              type="button"
              onClick={() => setShowCoding((v) => !v)}
              style={{
                ...styles.chip,
                background: showCoding ? "var(--bg-hover)" : "var(--bg-secondary)",
                borderColor: showCoding ? codingColor : "var(--border-subtle)",
                color: showCoding ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: showCoding ? `0 0 8px ${codingColor}44` : "none",
              }}
              aria-pressed={showCoding}
            >
              <span style={{ ...styles.dot, background: codingColor, opacity: showCoding ? 1 : 0.4 }} />
              Coding
            </button>
          </div>
        </div>

        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pageviewsColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pageviewsColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sessionsColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sessionsColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={codingColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={codingColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                hide={isCompact}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-lg)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)"
                }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(value: unknown, name?: string) => {
                  const v = Number(value);
                  const labels: Record<string, string> = {
                    pageviews: "Pageviews",
                    sessions: "Sessions",
                    codingTime: "Coding (min)"
                  };
                  return [v, labels[name || ""] || (name || "")];
                }}
              />
              {events?.map((ev, i) => (
                <ReferenceLine
                  key={i}
                  x={formatShortDate(ev.date)}
                  stroke="var(--text-muted)"
                  strokeDasharray="3 3"
                  label={{ position: "top", value: ev.label, fill: "var(--text-muted)", fontSize: 10 }}
                />
              ))}
              {showViews && (
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stroke={pageviewsColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPv)"
                  isAnimationActive={true}
                />
              )}
              {showSessions && (
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke={sessionsColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSs)"
                  isAnimationActive={true}
                />
              )}
              {showCoding && (
                <Area
                  type="monotone"
                  dataKey="codingTime"
                  stroke={codingColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCd)"
                  isAnimationActive={true}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {!isCompact && (
          <div style={styles.footnote}>
            Clean by default: sessions is optional to keep focus on the main trend.
          </div>
        )}
      </div>
    </section>
  );
}
