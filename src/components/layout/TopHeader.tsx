import React from "react";

interface TopHeaderProps {
    title: string;
    onMenuClick: () => void;
    children?: React.ReactNode;
}

export default function TopHeader({ title, onMenuClick, children }: TopHeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:p-6 max-w-[1920px] mx-auto">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                    <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {children}
                </div>
            </div>
        </header>
    );
}
