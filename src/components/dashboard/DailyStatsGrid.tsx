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
            <div className="flex items-center justify-center h-full p-12 text-zinc-600 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                Tidak ada aktivitas yang tercatat
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.data.slice(0, 8).map((day, i) => {
                const isActive = day.grand_total.total_seconds > 0;
                const dateObj = new Date(day.range.date);
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                    <div
                        key={i}
                        className={`group relative flex flex-col p-4 rounded-3xl border transition-all duration-300 
                            bg-zinc-900/40 border-white/5 hover:border-blue-500/30 hover:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5
                            ${isToday ? "ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : ""}
                        `}
                    >
                        {/* Header: Date */}
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">
                                {dateObj.toLocaleDateString("id-ID", { weekday: 'long' })}
                            </span>
                            <div className="flex flex-col items-end leading-none">
                                <span className={`text-xs font-bold ${isToday ? "text-blue-400" : "text-zinc-400"}`}>
                                    {dateObj.getDate()}
                                </span>
                                <span className="text-[8px] font-medium text-zinc-600 uppercase mt-0.5">
                                    {dateObj.toLocaleDateString("id-ID", { month: 'short' })}
                                </span>
                            </div>
                        </div>

                        {/* Main: Time */}
                        <div className="mb-4">
                            <span className="text-2xl font-black tracking-tight text-white">
                                {day.grand_total.digital}
                            </span>
                            <span className="block text-[9px] font-medium text-zinc-600 mt-1 whitespace-nowrap">
                                Total Waktu Coding
                            </span>
                        </div>

                        {/* Footer: Details */}
                        <div className="mt-auto space-y-1.5 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500 font-medium">Proyek</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${day.projects.length > 0 ? "bg-blue-500" : "bg-zinc-800"}`} />
                                    <span className={`font-bold ${day.projects.length > 0 ? "text-zinc-300" : "text-zinc-600"}`}>
                                        {day.projects.length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500 font-medium">Bahasa</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${day.languages.length > 0 ? "bg-amber-500" : "bg-zinc-800"}`} />
                                    <span className={`font-bold ${day.languages.length > 0 ? "text-zinc-300" : "text-zinc-600"}`}>
                                        {day.languages.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
