import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet } from "lucide-react";
import { getExplorerTxUrl } from "@/shared/lib/chain";
import { useAccount } from "wagmi";

export type TxStatus = "idle" | "signing" | "pending" | "confirmed" | "error";

interface TxButtonProps {
    status: TxStatus;
    hash?: string;
    errorMsg?: string;
    onClick: () => void;
    idleText?: string;
    disabled?: boolean;
}

export function TxButton({ status, hash, errorMsg, onClick, idleText = "Sign in wallet", disabled }: TxButtonProps) {
    const { isConnected } = useAccount();

    // If not connected, we force a connect state (unless it's a generic button and we just want them to connect via header).
    // But usually, user expects a disabled or "Connect" proxy here. Since `idleText` defaults to `Sign in wallet`, we respect that.

    if (status === "confirmed" && hash) {
        return (
            <Button variant="outline" className="w-full bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" asChild>
                <a href={getExplorerTxUrl(hash)} target="_blank" rel="noopener noreferrer">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmed ✓ (View on explorer)
                    <ExternalLink className="w-3 h-3 ml-2 opacity-70" />
                </a>
            </Button>
        );
    }

    if (status === "error") {
        return (
            <Button variant="destructive" className="w-full flex-col h-auto py-2" onClick={onClick}>
                <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Try Again
                </div>
                {errorMsg && <span className="text-xs opacity-80 mt-1 max-w-full truncate px-4">{errorMsg}</span>}
            </Button>
        );
    }

    if (status === "signing") {
        return (
            <Button disabled className="w-full bg-[#F1A70E] text-black">
                <Wallet className="w-4 h-4 mr-2 animate-bounce" />
                Awaiting signature...
            </Button>
        );
    }

    if (status === "pending") {
        return (
            <Button disabled className="w-full bg-[#F1A70E]/80 text-black">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transaction pending...
            </Button>
        );
    }

    // idle
    return (
        <Button
            className="w-full bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black font-semibold"
            onClick={onClick}
            disabled={disabled || !isConnected}
        >
            {idleText}
        </Button>
    );
}
