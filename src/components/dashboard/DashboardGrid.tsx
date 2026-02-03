import React from "react";

interface DashboardGridProps {
    children: React.ReactNode;
}

export default function DashboardGrid({ children }: DashboardGridProps) {
    return (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 lg:p-10 max-w-[1600px] mx-auto overflow-hidden">
            {children}
        </main>
    );
}
