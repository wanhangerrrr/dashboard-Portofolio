import React from "react";

type DayData = {
    range: { date: string };
    grand_total: { digital: string; total_seconds: number };
    projects: { length: number };
    languages: { length: number };
};

interface DailyStatsGridProps {
    data: { data: DayData[] } | null;
}

export default function DailyStatsGrid({ data }: DailyStatsGridProps) {
    if (!data?.data || data.data.length === 0) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[350px] rounded-[2.5rem] border border-dashed border-white/10 bg-zinc-900/20 text-zinc-600 font-medium">
                Tidak ada aktivitas yang tercatat
            </div>
        );
    }

    return (
        <div className="flex flex-col p-8 md:p-12 min-h-[350px] rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-amber-500/20 group overflow-hidden">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-10 px-2">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 tracking-[0.4em] uppercase transition-colors duration-500 group-hover:text-amber-400/80">
                        RINCIAN HARIAN
                    </span>
                    <div className="w-12 h-1 bg-amber-500/20 rounded-full transition-all duration-500 group-hover:w-24 group-hover:bg-amber-500/40" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none transition-colors duration-500 group-hover:text-amber-400">
                        {data.data.length}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
                        Days Tracked
                    </span>
                </div>
            </div>

            {/* Daily Stats Vertical List */}
            <div className="relative mt-auto">
                <div className="flex flex-col gap-3">
                    {data.data.slice(0, 7).map((day, i) => {
                        const dateObj = new Date(day.range.date);
                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        return (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 
                                    ${isToday
                                        ? "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/10"
                                        : "bg-zinc-900/40 border-white/5 hover:border-amber-500/20 hover:bg-zinc-900/60"
                                    }
                                `}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col min-w-[80px]">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                            {dateObj.toLocaleDateString("id-ID", { weekday: 'short' })}
                                        </span>
                                        <span className={`text-lg font-black mt-1 ${isToday ? "text-amber-400" : "text-zinc-400"}`}>
                                            {dateObj.getDate()} {dateObj.toLocaleDateString("id-ID", { month: 'short' })}
                                        </span>
                                    </div>

                                    <div className="h-8 w-px bg-white/5" />

                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-white leading-none">
                                            {day.grand_total.digital}
                                        </span>
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wide mt-1">
                                            Coding Time
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-8">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-zinc-300 leading-none">
                                            {day.projects.length}
                                        </span>
                                        <span className="text-[8px] md:text-[9px] font-medium text-zinc-600 uppercase mt-1">Proyek</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-zinc-300 leading-none">
                                            {day.languages.length}
                                        </span>
                                        <span className="text-[8px] md:text-[9px] font-medium text-zinc-600 uppercase mt-1">Bahasa</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
