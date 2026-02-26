import React from "react";
import styles from "./GithubContributionsHeatmap.module.css";

type Day = { date: string; contributionCount: number; color: string };
type Week = { contributionDays: Day[] };

export default function GithubContributionsHeatmap({
  totalContributions,
  weeks,
}: {
  totalContributions: number;
  weeks: Week[];
}) {
  return (
    <div className="flex flex-col p-8 md:p-12 min-h-[350px] rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-blue-500/20 group overflow-hidden">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-10 px-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black text-zinc-500 tracking-[0.4em] uppercase transition-colors duration-500 group-hover:text-blue-400/80">
            GITHUB CONTRIBUTIONS
          </span>
          <div className="w-12 h-1 bg-blue-500/20 rounded-full transition-all duration-500 group-hover:w-24 group-hover:bg-blue-500/40" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-4xl font-black text-white tracking-tighter leading-none transition-colors duration-500 group-hover:text-blue-400">
            {totalContributions}
          </span>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
            Total Year
          </span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative mt-auto group/scroll">
        {/* Scroll Hint (Universal) */}
        <div className="flex items-center justify-center gap-2 mb-4 text-[10px] font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
          <span className="uppercase tracking-[0.2em] animate-pulse">Slide to View</span>
          <svg className="w-3 h-3 animate-bounce-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </div>

        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex gap-[5px] overflow-x-auto pb-4 scrollbar-hide"
          >
            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-[5px] flex-shrink-0">
                {w.contributionDays.map((d) => (
                  <div
                    key={d.date}
                    className="w-3 h-3 md:w-[13px] md:h-[13px] rounded-[3px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer"
                    style={{
                      backgroundColor: d.contributionCount === 0 ? 'rgba(255,255,255,0.03)' : d.color,
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}
                    title={`${d.date}: ${d.contributionCount} contributions`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Subtle Gradient Mask to indicate more content */}
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-zinc-950/40 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
