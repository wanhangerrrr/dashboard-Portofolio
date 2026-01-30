import type { NextApiRequest, NextApiResponse } from "next";

type WakaEmbedLanguage = {
  name?: string;
  percent?: number;
};

type WakaEmbedDay = {
  date?: string; // "2026-01-05"
  range?: { start?: string; end?: string };
  grand_total?: { total_seconds?: number; digital?: string };
  languages?: WakaEmbedLanguage[]; // <-- tambahan
};

type WakaTimeSummary = {
  range: { startDate: string | null; endDate: string | null };
  total: { seconds: number };
  averageDaily: { seconds: number };
  bestDay: { date: string; seconds: number; digital: string } | null;
  topLanguages: { name: string; percent: number }[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const url = process.env.WAKATIME_EMBED_URL;
  if (!url) return res.status(500).json({ error: "Missing WAKATIME_EMBED_URL" });

  const r = await fetch(url);
  const text = await r.text();

  if (!r.ok) {
    return res
      .status(r.status)
      .json({ error: "WakaTime embed request failed", detail: text });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    // Kalau bukan JSON, tetap kembalikan raw string supaya gampang debug
    return res.status(200).json({ raw: text });
  }

  // Bentuk embed biasanya { data: [...] }
  const obj = raw as { data?: unknown };
  const days: WakaEmbedDay[] = Array.isArray(obj.data) ? (obj.data as WakaEmbedDay[]) : [];

  const totalSeconds = days.reduce((sum, d) => sum + (d?.grand_total?.total_seconds ?? 0), 0);

  // average daily berdasarkan 7 hari terakhir (bagi 7, bukan active days)
  const averageDailySeconds = Math.round(totalSeconds / 7);

  // Best day (hari dengan total_seconds terbesar)
  let best: { date: string; seconds: number; digital: string } | null = null;
  for (const d of days) {
    const sec = d?.grand_total?.total_seconds ?? 0;
    if (sec <= 0) continue;

    const candidate = {
      date: d?.date ?? "",
      seconds: sec,
      digital: d?.grand_total?.digital ?? "",
    };

    if (!best || candidate.seconds > best.seconds) best = candidate;
  }

  const startDate = days[0]?.range?.start ?? null;
  const endDate = days[days.length - 1]?.range?.end ?? null;

  // Ambil languages dari hari terakhir yang punya languages (paling aman)
  const lastWithLanguages = [...days]
    .reverse()
    .find((d) => Array.isArray(d.languages) && d.languages.length > 0);

  const topLanguages =
    lastWithLanguages?.languages
      ?.filter((l) => typeof l?.name === "string" && l.name.trim().length > 0)
      .slice(0, 5)
      .map((l) => ({
        name: String(l.name),
        percent: Number(l.percent ?? 0),
      })) ?? [];

  const out: WakaTimeSummary = {
    range: { startDate, endDate },
    total: { seconds: totalSeconds },
    averageDaily: { seconds: averageDailySeconds },
    bestDay: best,
    topLanguages,
  };

  return res.status(200).json(out);
}
