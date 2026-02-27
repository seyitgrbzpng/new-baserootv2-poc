import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: "default" | "amber" | "interactive";
}

export function GlassCard({ children, className, variant = "default", ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300",
                {
                    "border-white/10 hover:border-white/20": variant === "default",
                    "border-[#F1A70E]/30 shadow-[#F1A70E]/5": variant === "amber",
                    "border-white/10 hover:border-[#F1A70E]/50 hover:shadow-[0_0_15px_rgba(241,167,14,0.15)] cursor-pointer":
                        variant === "interactive",
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
