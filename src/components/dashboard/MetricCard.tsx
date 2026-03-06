import React from "react";

interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: string;
    className?: string;
}

export default function MetricCard({ label, value, trend, className = "" }: MetricCardProps) {
    return (
        <div className={`metric-card flex flex-col justify-between min-h-[120px] lg:min-h-[140px] p-4 lg:p-5 ${className}`}>
            <div>
                <p className="text-[10px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl lg:text-3xl font-black text-white tracking-tighter whitespace-nowrap">{value}</p>
                    {trend && (
                        <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend.startsWith("+") ? "text-emerald-400" : trend.startsWith("-") ? "text-rose-400" : "text-blue-400"
                            }`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>

            {/* Minimal Trend Sparkline Visual */}
            <div className="mt-4 h-8 w-full overflow-hidden opacity-30">
                <svg viewBox="0 0 100 20" className="w-full h-full">
                    <path
                        d="M0,15 Q25,5 50,15 T100,10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={trend?.startsWith("+") ? "text-blue-500" : "text-zinc-500"}
                    />
                </svg>
            </div>
        </div>
    );
}
