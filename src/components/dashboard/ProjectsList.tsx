import React from "react";

type Project = {
    name: string;
    total_seconds: number;
    percent: number;
    digital: string;
};

interface ProjectsListProps {
    data: { data: Project[] } | null;
}

export default function ProjectsList({ data }: ProjectsListProps) {
    if (!data?.data || data.data.length === 0) {
        return <div className="text-zinc-500 text-sm italic">No project data available.</div>;
    }

    return (
        <div className="space-y-6">
            {data.data.slice(0, 5).map((project, i) => (
                <div key={i} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {project.percent.toFixed(1)}% of total focus
                            </span>
                        </div>
                        <span className="text-sm font-black text-white">
                            {project.digital}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 group-hover:bg-blue-500"
                            style={{ width: `${project.percent}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
