import React from "react";
import styles from "./WakaTimeStatsCard.module.css";

function secondsToHM(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} hrs ${m} mins`;
}

export default function WakaTimeStatsCard({
  data,
}: {
  data?: {
    range: { startDate: string | null; endDate: string | null };
    total: { seconds: number };
    averageDaily: { seconds: number };
    bestDay: { date: string; seconds: number; digital: string } | null;
    topLanguages: { name: string; percent: number }[];
  };
}) {
  if (!data) {
    return (
      <section className={styles.card}>
        <div className={styles.head}>
          <div>
            <div className={styles.title}>WakaTime Stats</div>
            <div className={styles.subtitle}>Loading…</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      {/* ...lanjutkan JSX kamu yang lama, aman karena data sudah pasti ada... */}
      <div className={styles.grid}>
        <div className={styles.smallCard}>
          <div className={styles.label}>Start Date</div>
          <div className={styles.value}>{data.range.startDate ?? "-"}</div>
        </div>
        {/* dst */}
      </div>

      <div className={styles.langTitle}>Top Languages</div>
      <div className={styles.langs}>
        {(data.topLanguages ?? []).map((l) => (
          <div key={l.name} className={styles.langRow}>
            <div className={styles.langName}>{l.name}</div>
            <div className={styles.barWrap}>
              <div className={styles.bar} style={{ width: `${l.percent}%` }} />
            </div>
            <div className={styles.langPct}>{l.percent}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}

