import React from "react";

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
    CSS: "#563d7c",
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
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function getLanguageColor(name: string, index: number): string {
    return LANGUAGE_COLORS[name] || COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export default function TechStackActivity({ languages }: TechStackActivityProps) {
    const sortedLanguages = [...languages]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 6);

    if (sortedLanguages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/50 rounded-2xl border border-white/5 h-full min-h-[300px]">
                <div className="text-4xl mb-4 opacity-50">📊</div>
                <div className="text-zinc-400 font-medium mb-1">No data available</div>
                <div className="text-zinc-600 text-xs">Start coding to see your stats here.</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header - Matches the uploaded image style */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🛠️</span>
                    <h2 className="text-lg font-black text-white leading-tight">
                        Tech Stack
                    </h2>
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-8">
                    Activities &bull; This Week
                </span>
            </div>

            <div className="space-y-5">
                {sortedLanguages.map((lang, index) => {
                    const color = getLanguageColor(lang.name, index);
                    return (
                        <div key={lang.name} className="group">
                            <div className="flex items-center justify-between mb-2 min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs font-bold text-zinc-600 w-4">#{index + 1}</span>
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                                    />
                                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                        {lang.name}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-zinc-400">
                                    {lang.percent.toFixed(1)}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
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

            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between text-xs text-zinc-500">
                <span>Total Languages</span>
                <span className="font-bold text-zinc-300">{languages.length}</span>
            </div>
        </div>
    );
}
