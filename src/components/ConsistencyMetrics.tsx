import React, { useMemo } from "react";
import styles from "./ConsistencyMetrics.module.css";

type DayData = {
    range: { date: string };
    grand_total: { total_seconds: number };
};

type WakaTimeDaily = {
    data: DayData[];
};

type ConsistencyMetricsProps = {
    dailyData: WakaTimeDaily | null;
};

function calculateStreaks(dailyData: WakaTimeDaily | null): { current: number; longest: number } {
    if (!dailyData?.data || dailyData.data.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Sort days by date descending (most recent first)
    const sortedDays = [...dailyData.data]
        .filter(d => d?.range?.date && d?.grand_total?.total_seconds !== undefined)
        .sort((a, b) => new Date(b.range.date).getTime() - new Date(a.range.date).getTime());

    if (sortedDays.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Calculate current streak (count backward from most recent day with activity)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate: Date | null = null;

    // Process days from most recent to oldest for current streak
    for (let i = 0; i < sortedDays.length; i++) {
        const day = sortedDays[i];
        const hasActivity = day.grand_total.total_seconds > 0;
        const currentDate = new Date(day.range.date);

        if (i === 0) {
            // First day (most recent)
            if (hasActivity) {
                currentStreak = 1;
                tempStreak = 1;
            }
            previousDate = currentDate;
            continue;
        }

        if (!previousDate) continue;

        // Check if this day is consecutive (1 day before previous)
        const dayDiff = Math.round((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (hasActivity && dayDiff === 1) {
            // Consecutive day with activity
            if (currentStreak > 0) {
                currentStreak++;
            }
            tempStreak++;
        } else if (dayDiff === 1 && !hasActivity) {
            // Consecutive day but no activity - breaks current streak
            currentStreak = 0;
        } else {
            // Gap in dates - reset temp streak
            tempStreak = hasActivity ? 1 : 0;
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        previousDate = currentDate;
    }

    longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
}

export default function ConsistencyMetrics({ dailyData }: ConsistencyMetricsProps) {
    const streaks = useMemo(() => calculateStreaks(dailyData), [dailyData]);

    const getStreakEmoji = (streak: number): string => {
        if (streak >= 7) return "🔥";
        if (streak >= 5) return "⚡";
        if (streak >= 3) return "✨";
        if (streak >= 1) return "💪";
        return "🌱";
    };

    const getStreakMessage = (current: number): string => {
        if (current >= 7) return "Luar biasa! Streak mingguan tercapai!";
        if (current >= 5) return "Konsistensi yang sangat baik!";
        if (current >= 3) return "Momentum yang bagus, teruskan!";
        if (current >= 1) return "Awal yang baik!";
        return "Mulai coding untuk membangun streak!";
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>🔥 Konsistensi</h2>
            </div>

            <div className={styles.streaksGrid}>
                {/* Current Streak */}
                <div className={styles.streakCard}>
                    <div className={styles.streakEmoji}>{getStreakEmoji(streaks.current)}</div>
                    <div className={styles.streakValue}>{streaks.current}</div>
                    <div className={styles.streakLabel}>Streak Saat Ini</div>
                    <div className={styles.streakUnit}>hari berturut-turut</div>
                </div>

                {/* Longest Streak */}
                <div className={styles.streakCard}>
                    <div className={styles.streakEmoji}>🏆</div>
                    <div className={styles.streakValue}>{streaks.longest}</div>
                    <div className={styles.streakLabel}>Streak Terpanjang</div>
                    <div className={styles.streakUnit}>rekor pribadi</div>
                </div>
            </div>

            {/* Motivational Message */}
            <div className={styles.messageCard}>
                <div className={styles.messageText}>{getStreakMessage(streaks.current)}</div>
            </div>
        </div>
    );
}
