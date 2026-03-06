import { useEffect, useState } from "react";

type WakaStatus = {
    isCoding: boolean;
    project: string | null;
    language: string | null;
    lastActive: string | null;
};

export default function LiveStatus() {
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
                // Umami returns an array for active visitors
                setActiveVisitors(Array.isArray(umamiData) ? umamiData.length : 0);
            }
        } catch (e) {
            console.error("Failed to fetch live status:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (loading || !status) return null;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.05] group">
            <div className="relative flex h-2 w-2">
                {status.isCoding && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.isCoding ? "bg-emerald-500" : "bg-zinc-500"}`}></span>
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${status.isCoding ? "text-emerald-400" : "text-zinc-500"}`}>
                        {status.isCoding ? "Sedang Coding" : "Sedang Istirahat"}
                    </span>
                    {status.isCoding && status.project && (
                        <span className="text-[10px] font-medium text-zinc-500">•</span>
                    )}
                    {status.isCoding && status.project && (
                        <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[100px]">
                            {status.project}
                        </span>
                    )}
                </div>
            </div>

            {status.isCoding && status.language && (
                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10 ml-1">
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tighter">Using</span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{status.language}</span>
                </div>
            )}

            {activeVisitors > 0 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 ml-1">
                    <div className="flex h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">
                        {activeVisitors} {activeVisitors === 1 ? 'Visitor' : 'Visitors'}
                    </span>
                </div>
            )}
        </div>
    );
}
