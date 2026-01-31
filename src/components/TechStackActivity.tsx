import React from "react";
import styles from "./TechStackActivity.module.css";

type Language = {
    name: string;
    percent: number;
};

type TechStackActivityProps = {
    languages: Language[];
};

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Go: "#00ADD8",
    Rust: "#dea584",
    Java: "#b07219",
    "C#": "#178600",
    "C++": "#f34b7d",
    PHP: "#4F5D95",
    Ruby: "#701516",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c", // Changed to Purple-ish to differentiate from TS
    SCSS: "#c6538c",
    Vue: "#41b883",
    React: "#61dafb",
    JSON: "#292929",
    Markdown: "#083fa1",
    SQL: "#e38c00",
    Shell: "#89e051",
    Bash: "#4eaa25",
    YAML: "#cb171e",
    Docker: "#2496ed",
};

const COLOR_PALETTE = [
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
];

function getLanguageColor(name: string, index: number): string {
    if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
    // Fallback to palette based on index
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export default function TechStackActivity({ languages }: TechStackActivityProps) {
    // Sort by percent descending and take top 6
    const sortedLanguages = [...languages]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 6);

    if (sortedLanguages.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>🛠️ Aktivitas Tech Stack</h2>
                    <span className={styles.subtitle}>Minggu ini</span>
                </div>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <div className={styles.emptyMessage}>Belum ada data bahasa</div>
                    <div className={styles.emptyHint}>Mulai coding untuk melihat aktivitas tech stack Anda.</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>🛠️ Aktivitas Tech Stack</h2>
                <span className={styles.subtitle}>Minggu ini</span>
            </div>

            <div className={styles.languagesList}>
                {sortedLanguages.map((lang, index) => {
                    const color = getLanguageColor(lang.name, index);
                    return (
                        <div key={lang.name} className={styles.languageItem}>
                            <div className={styles.languageInfo}>
                                <div className={styles.languageRank}>#{index + 1}</div>
                                <div
                                    className={styles.languageDot}
                                    style={{ backgroundColor: color }}
                                />
                                <span className={styles.languageName}>{lang.name}</span>
                                <span className={styles.languagePercent}>{lang.percent.toFixed(1)}%</span>
                            </div>
                            <div className={styles.progressContainer}>
                                <div
                                    className={styles.progressBar}
                                    style={{
                                        width: `${Math.min(lang.percent, 100)}%`,
                                        backgroundColor: color,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={styles.legendLabel}>Total bahasa:</span>
                    <span className={styles.legendValue}>{languages.length}</span>
                </div>
            </div>
        </div>
    );
}
