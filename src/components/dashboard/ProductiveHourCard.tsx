import React, { useEffect, useState } from "react";

type HourlyData = {
    peakHour: number;
    persona: string;
    icon: string;
    distribution: number[];
    totalSecondsAcrossWeek: number;
};

export default function ProductiveHourCard() {
    const [data, setData] = useState<HourlyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/wakatime-productive-hour");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Failed to fetch productive hour data:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse bg-white/[0.03] border border-white/5 rounded-2xl p-6 h-full flex flex-col justify-between">
                <div className="h-4 w-24 bg-white/5 rounded-full" />
                <div className="h-20 bg-white/5 rounded-2xl" />
            </div>
        );
    }

    if (!data) return null;

    const maxVal = Math.max(...data.distribution);
    const formatHour = (h: number) => {
        const hour = h % 24;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour} ${ampm}`;
    };

    return (
        <div className="relative overflow-hidden group bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 rounded-2xl p-4 lg:p-5 h-full flex flex-col transition-all duration-500 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700" />

            <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div>
                    <h3 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Puncak Produktivitas</h3>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className="text-xl lg:text-2xl">{data.icon}</span>
                        <span className="text-base lg:text-lg font-black text-white tracking-tight leading-none">{data.persona}</span>
                    </div>
                </div>
                <div className="px-2 lg:px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-lg lg:text-xl font-black text-blue-400 tracking-tighter">
                        {formatHour(data.peakHour)}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex items-end gap-[1px] lg:gap-[2px] h-16 lg:h-20 mb-3 group-hover:gap-[2px] lg:group-hover:gap-[3px] transition-all duration-500">
                {data.distribution.map((val, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all duration-500 hover:opacity-100 ${i === data.peakHour
                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'bg-white/10 opacity-40'
                            }`}
                        style={{ height: `${(val / (maxVal || 1)) * 100}%`, minHeight: '2px' }}
                        title={`${formatHour(i)}: ${Math.round(val / 3600 * 10) / 10}h`}
                    />
                ))}
            </div>

            <div className="flex justify-between items-center mt-auto">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aktivitas 24 jam</p>
                <p className="text-[10px] font-black text-blue-400/80 uppercase tracking-tighter">Paling Aktif @ {formatHour(data.peakHour)}</p>
            </div>
        </div>
    );
}
