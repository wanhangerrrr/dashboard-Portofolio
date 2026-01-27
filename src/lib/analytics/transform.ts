// src/lib/analytics/transform.ts

export type UmamiPoint = { x: string; y: number };
export type UmamiResponse = { pageviews: UmamiPoint[]; sessions: UmamiPoint[] };

export type TrafficDatum = {
  date: string;        // raw date string, ex: "2026-01-27"
  label: string;       // label pendek buat XAxis, ex: "27 Jan"
  pageviews: number;
  sessions: number;
};

// Aman untuk public portfolio: angka ringkas dan tanggal enak dibaca.
export function formatCompactNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function formatShortDateLabel(isoOrDate: string) {
  const d = new Date(isoOrDate);
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(d);
}

// Join by date, bikin 1 array agar gampang multi-series & tooltip.
export function normalizeUmamiTraffic(resp: UmamiResponse): TrafficDatum[] {
  const map = new Map<string, Partial<TrafficDatum>>();

  for (const p of resp.pageviews ?? []) {
    map.set(p.x, {
      ...(map.get(p.x) ?? {}),
      date: p.x,
      label: formatShortDateLabel(p.x),
      pageviews: Number(p.y ?? 0),
    });
  }

  for (const s of resp.sessions ?? []) {
    map.set(s.x, {
      ...(map.get(s.x) ?? {}),
      date: s.x,
      label: formatShortDateLabel(s.x),
      sessions: Number(s.y ?? 0),
    });
  }

  const out = Array.from(map.values()).map((v) => ({
    date: v.date ?? "",
    label: v.label ?? "",
    pageviews: v.pageviews ?? 0,
    sessions: v.sessions ?? 0,
  }));

  // Sort by date ascending (penting untuk line/area chart).
  out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return out;
}
