import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type EditorData = {
    name: string;
    total_seconds: number;
    percent: number;
    digital: string;
    text: string;
};

interface EditorsCardProps {
    data: EditorData[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export default function EditorsCard({ data }: EditorsCardProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-zinc-500 font-medium">
                No editor data available
            </div>
        );
    }

    const chartData = data.map((ed) => ({
        name: ed.name,
        value: ed.total_seconds,
        displayPercent: ed.percent,
        displayText: ed.digital
    }));

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💻</span>
                    <h2 className="text-lg font-black text-white leading-tight">
                        Editors
                    </h2>
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-8">
                    Focus By Tool &bull; This Week
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#18181b",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "12px",
                                    color: "#fff"
                                }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full mt-4 space-y-2">
                    {data.slice(0, 4).map((ed, index) => (
                        <div key={ed.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors truncate max-w-[120px]">
                                    {ed.name}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-white">{ed.digital}</span>
                                <span className="text-[10px] font-bold text-zinc-500">{ed.percent.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
