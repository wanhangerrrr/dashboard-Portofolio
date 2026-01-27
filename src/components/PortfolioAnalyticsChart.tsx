// src/components/PortfolioAnalyticsChart.tsx
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = { x: string; y: number };

type Props = {
  pageviews: Point[];
  sessions: Point[];
  activeCodingDays: number;
  rangeLabel?: string; // default: "Last 7 days"
  variant?: "full" | "compact"; // default: "full"
};

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function sumY(points: Point[]) {
  return points.reduce((acc, p) => acc + (Number.isFinite(p.y) ? p.y : 0), 0);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n);
}

export default function PortfolioAnalyticsChart({
  pageviews,
  sessions,
  activeCodingDays,
  rangeLabel = "Last 7 days",
  variant = "full",
}: Props) {
  const isCompact = variant === "compact";
  const [showSessions, setShowSessions] = useState(false);

  const chartHeight = isCompact ? 220 : 320;
  const wrapPadding = isCompact ? 16 : 24;
  const titleSize = isCompact ? 16 : 18;

  const totals = useMemo(() => {
    return {
      pageviews: sumY(pageviews),
      sessions: sumY(sessions),
    };
  }, [pageviews, sessions]);

  // Merge arrays by index (cukup untuk data Umami yang biasanya align per hari).
  const chartData = useMemo(() => {
    const len = Math.max(pageviews.length, sessions.length);
    return Array.from({ length: len }).map((_, i) => {
      const pv = pageviews[i];
      const ss = sessions[i];
      const iso = pv?.x ?? ss?.x ?? "";
      return {
        iso,
        date: iso ? formatShortDate(iso) : "",
        pageviews: pv?.y ?? 0,
        sessions: ss?.y ?? 0,
      };
    });
  }, [pageviews, sessions]);

  const styles: Record<string, React.CSSProperties> = {
    wrap: {
      maxWidth: 980,
      margin: "0 auto",
      padding: wrapPadding,
      color: "#0f172a",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    header: { marginBottom: isCompact ? 10 : 14 },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      flexWrap: "wrap",
    },
    title: { fontSize: titleSize, fontWeight: 650, margin: 0 },
    subtitle: { fontSize: 13, color: "#64748b", margin: 0 },
    kpis: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: 12,
      marginTop: 14,
      marginBottom: isCompact ? 12 : 16,
    },
    kpiCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 14,
      boxShadow: "0 1px 0 rgba(15, 23, 42, 0.04)",
    },
    kpiLabel: { fontSize: 12, color: "#64748b", marginBottom: 6 },
    kpiValue: { fontSize: 20, fontWeight: 700, letterSpacing: -0.2 },
    kpiHint: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
    chartCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 14,
    },
    chartTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 10,
    },
    chartLabel: { fontSize: 13, color: "#0f172a", fontWeight: 600 },
    chips: { display: "flex", gap: 8 },
    chip: {
      borderRadius: 999,
      border: "1px solid #e2e8f0",
      background: "#f8fafc",
      padding: "6px 10px",
      fontSize: 12,
      cursor: "pointer",
      userSelect: "none",
      display: "inline-flex",
      gap: 8,
      alignItems: "center",
    },
    dot: { width: 8, height: 8, borderRadius: 999, display: "inline-block" },
    footnote: { marginTop: 10, fontSize: 12, color: "#94a3b8" },
  };

  const pageviewsColor = "#6366f1"; // indigo
  const sessionsColor = "#10b981"; // emerald

  return (
    <section style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>Analytics Snapshot</h2>
          <p style={styles.subtitle}>{rangeLabel}</p>
        </div>

        {/* Kalau compact, boleh tetap tampil 3 KPI; kalau mau lebih ringkas lagi nanti kita bisa buat 2 KPI saja */}
        <div style={styles.kpis}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Pageviews</div>
            <div style={styles.kpiValue}>{formatCompact(totals.pageviews)}</div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Sessions</div>
            <div style={styles.kpiValue}>{formatCompact(totals.sessions)}</div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Active coding days</div>
            <div style={styles.kpiValue}>{activeCodingDays}</div>
            <div style={styles.kpiHint}>{rangeLabel}</div>
          </div>
        </div>
      </header>

      <div style={styles.chartCard}>
        <div style={styles.chartTop}>
          <div style={styles.chartLabel}>Traffic trend</div>

          <div style={styles.chips} aria-label="Series toggle">
            <span style={{ ...styles.chip, cursor: "default" }}>
              <span style={{ ...styles.dot, background: pageviewsColor }} />
              Pageviews
            </span>

            <button
              type="button"
              onClick={() => setShowSessions((v) => !v)}
              style={{
                ...styles.chip,
                background: showSessions ? "#ecfdf5" : "#f8fafc",
                borderColor: showSessions ? "#a7f3d0" : "#e2e8f0",
              }}
              aria-pressed={showSessions}
              title="Toggle sessions"
            >
              <span
                style={{
                  ...styles.dot,
                  background: sessionsColor,
                  opacity: showSessions ? 1 : 0.35,
                }}
              />
              Sessions
              <span style={{ color: "#64748b" }}>{showSessions ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Penting: tinggi wrapper menentukan tinggi chart Recharts */}
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                hide={isCompact}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "pageviews" ? "Pageviews" : "Sessions",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Line
                type="monotone"
                dataKey="pageviews"
                stroke={pageviewsColor}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />

              {showSessions && (
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke={sessionsColor}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
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
