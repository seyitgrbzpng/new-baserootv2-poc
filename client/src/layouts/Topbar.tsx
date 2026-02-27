import { ReactNode } from "react";
import { Link } from "wouter";
import { useAccount, useDisconnect } from "wagmi";
import { getRole, setRole, BaserootRole } from "@/shared/lib/role";
import { useLocation } from "wouter";
import { LogOut, Wallet, Bot, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@/contexts/WalletContext";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [_, setLocation] = useLocation();
    const role = getRole();

    const handleRoleChange = (newRole: BaserootRole) => {
        setRole(newRole);
        if (newRole === 'consumer') setLocation('/marketplace');
        if (newRole === 'creator') setLocation('/creator');
        if (newRole === 'dao') setLocation('/dao');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl z-50 px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
                <Link href="/">
                    <div className="flex items-center gap-2 cursor-pointer cursor-interactive">
                        <img src="/logo.png" alt="Baseroot Logo" className="h-8 w-auto" />
                    </div>
                </Link>
            </div>

            {/* Right: Network + Connect + Role */}
            <div className="flex items-center gap-4">
                {/* Fuji Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Fuji Testnet
                </div>

                {/* Role Switcher (If connected and has a role) */}
                {isConnected && role && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-gray-200">
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                <span className="capitalize">{role}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#111] border-white/10 text-gray-300">
                            <DropdownMenuLabel>Switch View</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => handleRoleChange('consumer')} className="cursor-pointer focus:bg-white/10 focus:text-white">
                                Consumer (Marketplace)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('creator')} className="cursor-pointer focus:bg-white/10 focus:text-white">
                                Creator Studio
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('dao')} className="cursor-pointer focus:bg-white/10 focus:text-white">
                                DAO Portal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Wallet Dropdown - Keeping it simple, can integrate wagmi web3modal if used */}
                {isConnected ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-[#F1A70E]/10 border-[#F1A70E]/20 text-[#F1A70E] hover:bg-[#F1A70E]/20">
                                <Wallet className="w-4 h-4 mr-2" />
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#111] border-white/10 text-gray-300">
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(address || '') }} className="cursor-pointer focus:bg-white/10 focus:text-white">
                                Copy Address
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300">
                                <LogOut className="w-4 h-4 mr-2" /> Disconnect
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <WalletMultiButton />
                )}
            </div>
        </header>
    );
}
