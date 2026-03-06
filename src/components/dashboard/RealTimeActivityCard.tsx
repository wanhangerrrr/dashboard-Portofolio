import React, { useEffect, useState } from "react";

type WakaStatus = {
    isCoding: boolean;
    project: string | null;
    language: string | null;
    lastActive: string | null;
};

export default function RealTimeActivityCard() {
    const [status, setStatus] = useState<WakaStatus | null>(null);
    const [activeVisitors, setActiveVisitors] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [wakaRes, umamiRes] = await Promise.all([
                fetch("/api/wakatime-status"),
                fetch("/api/umami-active"),
            ]);

            if (wakaRes.ok) setStatus(await wakaRes.json());
            if (umamiRes.ok) {
                const umamiData = await umamiRes.json();
                setActiveVisitors(Array.isArray(umamiData) ? umamiData.length : 0);
            }
        } catch (e) {
            console.error("Failed to fetch real-time activity:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30 seconds for more "real-time" feel
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
                <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Coding Status Card */}
            <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] cursor-default shadow-sm group ${status?.isCoding
                    ? 'bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.01] border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
                    : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/5 hover:border-white/10 text-zinc-400'
                }`}>
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-white/10 transition-all duration-300 shadow-inner">
                    <div className="relative">
                        {status?.isCoding && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                            {status?.isCoding ? '💻' : '💤'}
                        </span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase tracking-widest mb-1 opacity-60">Status Coding</p>
                    <p className="text-lg font-black text-white leading-tight">
                        {status?.isCoding ? "Sedang Coding" : "Sedang Istirahat"}
                    </p>
                    {status?.isCoding && status.project && (
                        <p className="text-xs font-bold text-emerald-400/80 mt-1 truncate">
                            {status.project} {status.language ? `• ${status.language}` : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Visitors Status Card */}
            <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] cursor-default shadow-sm group ${activeVisitors > 0
                    ? 'bg-gradient-to-br from-blue-500/[0.06] to-blue-500/[0.01] border-blue-500/20 hover:border-blue-500/40 text-blue-400'
                    : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/5 hover:border-white/10 text-zinc-400'
                }`}>
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-white/10 transition-all duration-300 shadow-inner">
                    <div className="relative">
                        {activeVisitors > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        )}
                        <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                            {activeVisitors > 0 ? '🔥' : '👤'}
                        </span>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest mb-1 opacity-60">Live Visitors</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tracking-tighter">{activeVisitors}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Orang Aktif</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
