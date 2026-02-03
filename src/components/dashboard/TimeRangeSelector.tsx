import React from "react";

interface TimeRangeSelectorProps {
    currentRange: "7D" | "30D" | "90D" | "all";
    onRangeChange: (range: "7D" | "30D" | "90D" | "all") => void;
}

const ranges = ["7D", "30D", "90D", "all"] as const;

export default function TimeRangeSelector({ currentRange, onRangeChange }: TimeRangeSelectorProps) {
    return (
        <div className="flex items-center gap-3">
            {/* Mock Dropdowns */}
            <div className="hidden md:flex items-center justify-between px-4 py-2 bg-white/5 border border-white/5 rounded-xl min-w-[140px] cursor-pointer hover:bg-white/10 transition-colors">
                <span className="text-xs font-medium text-zinc-400">Timeframe:</span>
                <span className="text-xs font-bold text-white ml-2">{currentRange}</span>
                <span className="ml-2 text-zinc-500">▼</span>
            </div>

            {/* Actual Functional Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                {ranges.map((r) => (
                    <button
                        key={r}
                        onClick={() => onRangeChange(r)}
                        className={`px-3 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg ${currentRange === r
                            ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10"
                            : "text-zinc-500 hover:text-zinc-300"
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>



        </div>
    );
}
