import { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans">
            <Topbar />
            <div className="flex flex-1 pt-16">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-6 lg:p-10 relative">
                    {/* Subtle background glow effect for deep dark theme */}
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F1A70E]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <div className="max-w-7xl mx-auto z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
