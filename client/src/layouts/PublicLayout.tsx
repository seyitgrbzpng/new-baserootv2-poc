import { ReactNode } from "react";
import { Topbar } from "./Topbar";

interface PublicLayoutProps {
    children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans">
            <Topbar />
            <main className="pt-16 relative">
                {/* Subtle background glow for landing */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#F1A70E]/5 rounded-[100%] blur-[120px] -z-10 pointer-events-none" />

                {children}
            </main>
        </div>
    );
}
