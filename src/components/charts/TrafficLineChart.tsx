// src/components/charts/TrafficLineChart.tsx
import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrafficDatum } from "@/lib/analytics/transform";
import { formatCompactNumber } from "@/lib/analytics/transform";


type Props = {
  data: TrafficDatum[];
  mode?: "compact" | "full";
  defaultShowSessions?: boolean;
  height?: number;
};

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
        padding: "6px 10px",
        cursor: "pointer",
        userSelect: "none",
        color: "rgba(255,255,255,0.92)",
        fontSize: 12,
        lineHeight: "16px",
      }}
      aria-pressed={active}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          boxShadow: active ? `0 0 0 3px rgba(255,255,255,0.05)` : "none",
        }}
      />
      {label}
    </button>
  );
}

type TooltipItem = {
  dataKey?: string;
  value?: number;
};

type MiniTooltipProps = {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  mode: "compact" | "full";
  showSessions: boolean;
};

function MiniTooltip(props: MiniTooltipProps) {
  const { active, payload, label, mode, showSessions } = props;

  if (!active || !payload || payload.length === 0) return null;

  const pv = payload.find((p) => p?.dataKey === "pageviews")?.value ?? 0;
  const ss = payload.find((p) => p?.dataKey === "sessions")?.value ?? 0;

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.92)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        color: "rgba(255,255,255,0.92)",
        minWidth: mode === "compact" ? 160 : 200,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>{String(label)}</div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12, opacity: 0.9 }}>Pageviews</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCompactNumber(pv)}</span>
      </div>

      {showSessions && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.9 }}>Sessions</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCompactNumber(ss)}</span>
        </div>
      )}
    </div>
  );
}

export default function TrafficLineChart({
  data,
  mode = "full",
  defaultShowSessions = false,
  height,
}: Props) {
  const [showSessions, setShowSessions] = useState(defaultShowSessions);

  const ui = useMemo(() => {
    const compact = mode === "compact";
    return {
      height: height ?? (compact ? 240 : 300),
      strokePV: "#60A5FA",
      strokeSS: "#34D399",
      grid: "rgba(255,255,255,0.06)",
      axis: "rgba(255,255,255,0.55)",
      tickFont: compact ? 11 : 12,
      yTicks: compact ? 4 : 6,
    };
  }, [mode, height]);

  return (
    <div
      style={{
        width: "100%",
        height: ui.height,
        padding: mode === "compact" ? 10 : 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ui.strokePV} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ui.strokePV} stopOpacity={0.02} />
            </linearGradient>

            <linearGradient id="ssFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ui.strokeSS} stopOpacity={0.2} />
              <stop offset="100%" stopColor={ui.strokeSS} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={ui.grid} strokeDasharray="3 6" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: ui.axis, fontSize: ui.tickFont }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fill: ui.axis, fontSize: ui.tickFont }}
            tickLine={false}
            axisLine={false}
            width={34}
            tickCount={ui.yTicks}
            tickFormatter={formatCompactNumber}
          />

          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
            content={<MiniTooltip mode={mode} showSessions={showSessions} />}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 8 }}
            content={() => (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Chip label="Pageviews" color={ui.strokePV} active={true} onClick={() => {}} />
                <Chip
                  label="Sessions"
                  color={ui.strokeSS}
                  active={showSessions}
                  onClick={() => setShowSessions((v) => !v)}
                />
              </div>
            )}
          />

          <Area
            type="monotone"
            dataKey="pageviews"
            stroke={ui.strokePV}
            strokeWidth={2}
            fill="url(#pvFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />

          {showSessions && (
            <Area
              type="monotone"
              dataKey="sessions"
              stroke={ui.strokeSS}
              strokeWidth={2}
              fill="url(#ssFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
