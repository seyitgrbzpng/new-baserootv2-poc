import { ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: ReactNode;
    icon?: ReactNode;
    subtitle?: string;
    className?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
}

export function StatCard({ title, value, icon, subtitle, className, trend, trendValue }: StatCardProps) {
    return (
        <GlassCard className={cn("flex flex-col gap-2", className)}>
            <div className="flex justify-between items-center text-gray-400">
                <h3 className="text-sm font-medium tracking-wide">{title}</h3>
                {icon && <div className="text-[#F1A70E]/70">{icon}</div>}
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white">{value}</div>
                {trendValue && (
                    <span
                        className={cn("text-xs font-semibold", {
                            "text-green-400": trend === "up",
                            "text-red-400": trend === "down",
                            "text-gray-400": trend === "neutral",
                        })}
                    >
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendValue}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </GlassCard>
    );
}
