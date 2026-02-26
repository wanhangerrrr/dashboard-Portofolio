import React from "react";
import { Insight } from "../../lib/InsightEngine";

interface InsightListProps {
    insights: Insight[];
}

export default function InsightList({ insights }: InsightListProps) {
    if (insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                <span className="text-3xl">💡</span>
                <p className="text-xs font-semibold">No insights today</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {insights.map((insight, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-default shadow-sm group ${insight.type === 'positive'
                        ? 'bg-gradient-to-br from-emerald-500/[0.04] to-emerald-500/[0.01] border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400/90'
                        : insight.type === 'negative'
                            ? 'bg-gradient-to-br from-rose-500/[0.04] to-rose-500/[0.01] border-rose-500/10 hover:border-rose-500/30 text-rose-400/90'
                            : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/5 hover:border-white/10 text-zinc-400'
                        }`}
                >
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-white/10 transition-all duration-300 shadow-inner">
                        <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                            {insight.type === 'positive' ? '🚀' : insight.type === 'negative' ? '⚠️' : '💡'}
                        </span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed pt-0.5">
                        {insight.text}
                    </p>
                </div>
            ))}
        </div>
    );
}
