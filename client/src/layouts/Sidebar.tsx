import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getRole } from "@/shared/lib/role";
import {
    LayoutDashboard,
    Store,
    History,
    ShieldCheck,
    Bot,
    PlusCircle,
    Banknote,
    UploadCloud,
    Database,
    Link as LinkIcon,
} from "lucide-react";

export function Sidebar() {
    const [location] = useLocation();
    const role = getRole();

    if (!role) return null;

    const menus = {
        consumer: [
            { label: "Marketplace", href: "/marketplace", icon: Store },
            { label: "My Licenses", href: "/marketplace/licenses", icon: ShieldCheck },
            { label: "Usage History", href: "/marketplace/history", icon: History },
        ],
        creator: [
            { label: "Overview", href: "/creator", icon: LayoutDashboard },
            { label: "My Agents", href: "/creator/agents", icon: Bot },
            { label: "Create Agent", href: "/creator/agents/new", icon: PlusCircle },
            { label: "Revenue", href: "/creator/revenue", icon: Banknote },
        ],
        dao: [
            { label: "Overview", href: "/dao", icon: LayoutDashboard },
            { label: "Datasets", href: "/dao/datasets", icon: Database },
            { label: "Upload Dataset", href: "/dao/datasets/new", icon: UploadCloud },
            { label: "Provenance", href: "/dao/provenance", icon: LinkIcon },
            { label: "Earnings", href: "/dao/earnings", icon: Banknote },
        ],
    };

    const currentMenu = menus[role] || [];

    return (
        <aside className="w-64 fixed left-0 top-16 bottom-0 border-r border-white/5 bg-black/40 backdrop-blur-md p-4 flex flex-col gap-1 overflow-y-auto hidden md:flex">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3 mt-2">
                {role === "consumer" && "Marketplace"}
                {role === "creator" && "Creator Studio"}
                {role === "dao" && "DAO Portal"}
            </div>

            {currentMenu.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/creator" && item.href !== "/dao" && item.href !== "/marketplace");

                return (
                    <Link key={item.href} href={item.href}>
                        <div
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-200",
                                isActive
                                    ? "bg-[#F1A70E]/10 text-[#F1A70E]"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </div>
                    </Link>
                );
            })}
        </aside>
    );
}
