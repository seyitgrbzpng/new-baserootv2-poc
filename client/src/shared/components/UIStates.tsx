import { ReactNode } from "react";
import { AlertCircle, FileSearch, Loader2 } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description: string;
    icon?: ReactNode;
}

export function EmptyState({ title = "No Data", description, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="text-gray-500 mb-4">{icon || <FileSearch className="w-12 h-12 opacity-50" />}</div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 max-w-sm">{description}</p>
        </div>
    );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#F1A70E] animate-spin mb-4" />
            <p className="text-gray-400 font-medium tracking-wide animate-pulse">{message}</p>
        </div>
    );
}

export function ErrorState({ message = "Something went wrong. Please try again." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-red-500/20 bg-red-500/5">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-300 font-medium">{message}</p>
        </div>
    );
}
