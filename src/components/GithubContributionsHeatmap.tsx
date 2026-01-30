import React from "react";
import styles from "./GithubContributionsHeatmap.module.css";

type Day = { date: string; contributionCount: number; color: string };
type Week = { contributionDays: Day[] };

export default function GithubContributionsHeatmap({
  totalContributions,
  weeks,
}: {
  totalContributions: number;
  weeks: Week[];
}) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>GitHub Contributions</div>
          <div className={styles.subtitle}>My GitHub activity over the past year.</div>
        </div>
        <div className={styles.total}>{totalContributions}</div>
      </div>

      <div className={styles.grid}>
        {weeks.map((w, wi) => (
          <div key={wi} className={styles.week}>
            {w.contributionDays.map((d) => (
              <div
                key={d.date}
                className={styles.day}
                style={{ background: d.color }}
                title={`${d.date}: ${d.contributionCount}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
