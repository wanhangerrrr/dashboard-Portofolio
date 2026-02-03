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
        <div className="space-y-4">
            {insights.map((insight, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${insight.type === 'positive'
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                            : insight.type === 'negative'
                                ? 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                                : 'bg-white/5 border-white/5 text-zinc-400'
                        }`}
                >
                    <span className="text-xl shrink-0">
                        {insight.type === 'positive' ? '🚀' : insight.type === 'negative' ? '⚠️' : '💡'}
                    </span>
                    <p className="text-sm font-medium leading-relaxed">
                        {insight.text}
                    </p>
                </div>
            ))}
        </div>
    );
}
