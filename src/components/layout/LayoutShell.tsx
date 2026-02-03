import React, { useState } from "react";
import Sidebar from "./Sidebar";

interface LayoutShellProps {
    children: React.ReactNode;
}

const navItems = [
    {
        category: "Main", items: [
            { label: "Tren Aktivitas", href: "#traffic", icon: "ChartBarIcon" },
            { label: "Proyek", href: "#projects", icon: "LibraryIcon" },
            { label: "Kontribusi Harian", href: "#github", icon: "UsersIcon" },
            { label: "Catatan Coding", href: "#kpi-summary", icon: "ClipboardListIcon" },
        ]
    },

];

export default function LayoutShell({ children }: LayoutShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar
                items={navItems}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 lg:pl-[280px]">
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child) && (child.type as any).name === 'TopHeader') {
                        return React.cloneElement(child as React.ReactElement<any>, {
                            onMenuClick: () => setIsSidebarOpen(true)
                        });
                    }
                    return child;
                })}
            </div>
        </div>
    );
}
