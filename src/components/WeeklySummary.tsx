import React from "react";
import styles from "./WeeklySummary.module.css";

type WeeklySummaryProps = {
    totalSeconds: number;
    activeDays: number;
    previousWeekSeconds?: number;
    previousWeekActiveDays?: number;
};

function formatHours(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0h";
    const hours = seconds / 3600;
    if (hours < 1) {
        const mins = Math.round(seconds / 60);
        return `${mins}m`;
    }
    return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
}

function calculateChange(current: number, previous: number): { percent: number; direction: "up" | "down" | "neutral" } {
    if (!previous || previous === 0) return { percent: 0, direction: "neutral" };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { percent: Math.round(change), direction: "up" };
    if (change < 0) return { percent: Math.abs(Math.round(change)), direction: "down" };
    return { percent: 0, direction: "neutral" };
}

function generateInsight(
    totalSeconds: number,
    activeDays: number,
    timeChange: { percent: number; direction: "up" | "down" | "neutral" },
    daysChange: { percent: number; direction: "up" | "down" | "neutral" }
): string {
    const hours = totalSeconds / 3600;

    if (timeChange.direction === "up" && timeChange.percent >= 20) {
        return `Produktivitas meningkat ${timeChange.percent}% minggu ini! Pertahankan momentum ini.`;
    }
    if (timeChange.direction === "down" && timeChange.percent >= 20) {
        return `Waktu coding berkurang ${timeChange.percent}% dari minggu lalu. Tetap semangat!`;
    }
    if (activeDays >= 6) {
        return "Konsistensi luar biasa! Anda coding hampir setiap hari minggu ini.";
    }
    if (hours >= 20) {
        return "Minggu yang produktif dengan lebih dari 20 jam coding!";
    }
    if (activeDays >= 4) {
        return "Konsistensi yang baik dengan " + activeDays + " hari aktif coding.";
    }
    if (hours >= 10) {
        return "Progress yang solid minggu ini. Terus tingkatkan!";
    }
    return "Terus pantau progress coding Anda untuk insight lebih lanjut.";
}

export default function WeeklySummary({
    totalSeconds,
    activeDays,
    previousWeekSeconds,
    previousWeekActiveDays,
}: WeeklySummaryProps) {
    const timeChange = calculateChange(totalSeconds, previousWeekSeconds ?? 0);
    const daysChange = calculateChange(activeDays, previousWeekActiveDays ?? 0);
    const insight = generateInsight(totalSeconds, activeDays, timeChange, daysChange);

    const getTrendIcon = (direction: "up" | "down" | "neutral") => {
        if (direction === "up") return "↑";
        if (direction === "down") return "↓";
        return "→";
    };

    const getTrendClass = (direction: "up" | "down" | "neutral") => {
        if (direction === "up") return styles.trendUp;
        if (direction === "down") return styles.trendDown;
        return styles.trendNeutral;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>📅 Ringkasan Mingguan</h2>
                <span className={styles.subtitle}>7 hari terakhir</span>
            </div>

            <div className={styles.cardsGrid}>
                {/* Total Coding Time */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Total Waktu Coding</div>
                    <div className={styles.cardValue}>{formatHours(totalSeconds)}</div>
                    {timeChange.direction !== "neutral" && (
                        <div className={`${styles.trend} ${getTrendClass(timeChange.direction)}`}>
                            <span className={styles.trendIcon}>{getTrendIcon(timeChange.direction)}</span>
                            <span>{timeChange.percent}% vs minggu lalu</span>
                        </div>
                    )}
                    {timeChange.direction === "neutral" && (
                        <div className={`${styles.trend} ${styles.trendNeutral}`}>
                            <span>Data minggu lalu tidak tersedia</span>
                        </div>
                    )}
                </div>

                {/* Active Coding Days */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Hari Aktif Coding</div>
                    <div className={styles.cardValue}>{activeDays} <span className={styles.cardUnit}>hari</span></div>
                    {daysChange.direction !== "neutral" && (
                        <div className={`${styles.trend} ${getTrendClass(daysChange.direction)}`}>
                            <span className={styles.trendIcon}>{getTrendIcon(daysChange.direction)}</span>
                            <span>{daysChange.percent}% vs minggu lalu</span>
                        </div>
                    )}
                    {daysChange.direction === "neutral" && (
                        <div className={`${styles.trend} ${styles.trendNeutral}`}>
                            <span>Data minggu lalu tidak tersedia</span>
                        </div>
                    )}
                </div>

                {/* Average Daily */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Rata-rata Harian</div>
                    <div className={styles.cardValue}>{formatHours(Math.round(totalSeconds / 7))}</div>
                    <div className={`${styles.trend} ${styles.trendNeutral}`}>
                        <span>Per hari dalam seminggu</span>
                    </div>
                </div>
            </div>

            {/* Insight */}
            <div className={styles.insightCard}>
                <div className={styles.insightText}>{insight}</div>
            </div>
        </div>
    );
}
