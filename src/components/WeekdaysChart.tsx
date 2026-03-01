import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from "recharts";

type DayData = {
    range: { date: string };
    grand_total: { total_seconds: number };
};

interface WeekdaysChartProps {
    data: { data: DayData[] } | null;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeekdaysChart({ data }: WeekdaysChartProps) {
    const chartData = useMemo(() => {
        if (!data?.data) return WEEKDAYS.map(day => ({ name: day, seconds: 0, hours: 0 }));

        // Map day names to total seconds
        const dayMap: Record<string, number> = {};
        WEEKDAYS.forEach(day => {
            dayMap[day] = 0;
        });

        data.data.forEach(day => {
            const date = new Date(day.range.date);
            const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
            if (dayMap[dayName] !== undefined) {
                dayMap[dayName] += day.grand_total.total_seconds;
            }
        });

        return WEEKDAYS.map(day => {
            const seconds = dayMap[day];
            return {
                name: day,
                seconds: seconds,
                hours: Number((seconds / 3600).toFixed(1))
            };
        });
    }, [data]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const seconds = payload[0].value * 3600;
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);

            return (
                <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                    <p className="text-sm font-black text-white">
                        {h > 0 ? `${h}h ` : ""}{m}m
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl transition-all duration-300 hover:border-blue-500/20 shadow-2xl overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-inner group-hover:scale-110 transition-transform">
                        <span className="text-xl">📅</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white tracking-tight leading-tight">Weekdays</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Coding Activity</p>
                    </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold cursor-help hover:bg-white/10 transition-colors">
                    ?
                </div>
            </div>

            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid stroke="#ffffff05" horizontal={false} strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#52525b", fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 700 }}
                            width={100}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 10 }} />
                        <Bar
                            dataKey="hours"
                            radius={[0, 6, 6, 0]}
                            animationDuration={1500}
                            barSize={20}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="#3b82f6"
                                    className="hover:fill-blue-400 transition-colors duration-300"
                                    style={{
                                        filter: 'drop-shadow(2px 0 8px rgba(59, 130, 246, 0.3))'
                                    }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
